export interface RefinementTurn {
  id: string;
  role: 'user' | 'assistant';
  instruction: string;
  diagramBefore: string;
  diagramAfter: string;
  summary?: string;
  timestamp: number;
}

export interface RefineResponse {
  ok: boolean;
  provider: 'openapi' | 'fallback';
  refinedText: string | null;
  summary: string;
  changes: {
    nodesAdded: number;
    nodesRemoved: number;
    nodesModified: number;
    edgesAdded: number;
    edgesRemoved: number;
  };
  suggestions: string[];
  creditsCharged?: boolean;
  creditsRemaining?: number;
  error?: {
    code: string;
    message: string;
  };
  raw?: unknown;
}

export interface RefineOptions {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
}

const SYSTEM_PROMPT = `You are a Mermaid diagram refinement expert. Your job is to modify existing diagrams based on user instructions while preserving the overall structure and intent.

Rules:
1. Make ONLY the changes requested - do not add unrequested features
2. Preserve existing node IDs and connections where possible
3. Maintain consistent styling with the existing diagram
4. If the instruction is unclear, make reasonable assumptions and explain them
5. Return valid Mermaid syntax that will render correctly
6. Keep the diagram readable - if adding many nodes, use subgraphs

Consider the conversation history to:
- Avoid repeating changes that were already made
- Build on previous refinements coherently
- Understand the user's overall intent

Return a JSON object with:
{
  "refinedText": string,        // The modified Mermaid diagram
  "summary": string,            // 1-2 sentence summary of what changed
  "changes": {
    "nodesAdded": number,
    "nodesRemoved": number,
    "nodesModified": number,
    "edgesAdded": number,
    "edgesRemoved": number
  },
  "suggestions": string[]       // 1-3 follow-up suggestions (optional)
}

Do not include markdown fences. Return only the JSON object.`;

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4o';

const extractJsonObject = (input: string): unknown | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    // continue
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;

  const candidate = trimmed.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
};

type NodeProcessLike = {
  env?: Record<string, string | undefined>;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
};

function buildConversationHistory(history: RefinementTurn[]): string {
  if (!history.length) return '';

  return history
    .map((turn) => {
      if (turn.role === 'user') {
        return `User requested: "${turn.instruction}"`;
      } else {
        return `Assistant made changes: ${turn.summary || 'Modified diagram'}`;
      }
    })
    .join('\n');
}

export async function refineMermaidDiagram(
  diagramText: string,
  instruction: string,
  options: RefineOptions & { history?: RefinementTurn[] } = {}
): Promise<RefineResponse> {
  const env =
    ((globalThis as unknown as { process?: NodeProcessLike }).process?.env as
      | Record<string, string | undefined>
      | undefined) ?? {};

  const apiKey = options.apiKey ?? env.OPENAPI_API_KEY ?? env.XAI_API_KEY;
  const baseUrl = options.baseUrl ?? env.OPENAPI_BASE_URL ?? env.XAI_BASE_URL ?? DEFAULT_BASE_URL;
  const model = options.model ?? env.OPENAPI_MODEL ?? env.XAI_MODEL ?? DEFAULT_MODEL;
  const timeoutMs = options.timeoutMs ?? 30000;
  const history = options.history ?? [];

  if (!diagramText.trim()) {
    return {
      ok: false,
      provider: 'fallback',
      refinedText: null,
      summary: 'Cannot refine an empty diagram.',
      changes: {
        nodesAdded: 0,
        nodesRemoved: 0,
        nodesModified: 0,
        edgesAdded: 0,
        edgesRemoved: 0,
      },
      suggestions: ['Please provide a diagram to refine.'],
      error: {
        code: 'EMPTY_DIAGRAM',
        message: 'Diagram text cannot be empty.',
      },
    };
  }

  if (!instruction.trim()) {
    return {
      ok: false,
      provider: 'fallback',
      refinedText: null,
      summary: 'Cannot refine without an instruction.',
      changes: {
        nodesAdded: 0,
        nodesRemoved: 0,
        nodesModified: 0,
        edgesAdded: 0,
        edgesRemoved: 0,
      },
      suggestions: ['Please provide an instruction for refinement.'],
      error: {
        code: 'EMPTY_INSTRUCTION',
        message: 'Instruction cannot be empty.',
      },
    };
  }

  if (!apiKey) {
    return {
      ok: false,
      provider: 'fallback',
      refinedText: null,
      summary: 'AI refinement is not available.',
      changes: {
        nodesAdded: 0,
        nodesRemoved: 0,
        nodesModified: 0,
        edgesAdded: 0,
        edgesRemoved: 0,
      },
      suggestions: ['Set OPENAPI_API_KEY to enable AI refinement.'],
      error: {
        code: 'NOT_CONFIGURED',
        message: 'OPENAPI_API_KEY is not configured.',
      },
    };
  }

  const historyContext = buildConversationHistory(history);

  const userPrompt = `${historyContext ? `Previous conversation:\n${historyContext}\n\n` : ''}Current diagram:
\`\`\`mermaid
${diagramText}
\`\`\`

User instruction: ${instruction}

Apply the requested changes and return the result as JSON.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
      signal: controller.signal,
    });

    const raw: unknown = await response.json().catch(() => null);
    const rawRecord = asRecord(raw);

    if (!response.ok) {
      const errorRecord = rawRecord ? asRecord(rawRecord.error) : null;

      const message =
        (errorRecord && typeof errorRecord.message === 'string' && errorRecord.message) ||
        (rawRecord && typeof rawRecord.message === 'string' && rawRecord.message) ||
        `OpenAPI request failed with status ${response.status}`;

      return {
        ok: false,
        provider: 'openapi',
        refinedText: null,
        summary: 'AI refinement failed.',
        changes: {
          nodesAdded: 0,
          nodesRemoved: 0,
          nodesModified: 0,
          edgesAdded: 0,
          edgesRemoved: 0,
        },
        suggestions: [],
        error: {
          code: 'OPENAPI_REQUEST_FAILED',
          message,
        },
        raw,
      };
    }

    let content: string | null = null;
    const choices = rawRecord?.choices;
    if (Array.isArray(choices) && choices.length > 0) {
      const firstChoice = asRecord(choices[0]);
      const messageRecord = firstChoice ? asRecord(firstChoice.message) : null;
      if (messageRecord && typeof messageRecord.content === 'string') {
        content = messageRecord.content;
      }
    }

    if (typeof content !== 'string' || !content.trim()) {
      return {
        ok: false,
        provider: 'openapi',
        refinedText: null,
        summary: 'AI returned an empty response.',
        changes: {
          nodesAdded: 0,
          nodesRemoved: 0,
          nodesModified: 0,
          edgesAdded: 0,
          edgesRemoved: 0,
        },
        suggestions: [],
        error: {
          code: 'EMPTY_RESPONSE',
          message: 'OpenAPI endpoint returned an empty response.',
        },
        raw,
      };
    }

    const parsed = extractJsonObject(content);
    const parsedRecord = asRecord(parsed);

    const refinedText =
      parsedRecord && typeof parsedRecord.refinedText === 'string' ? parsedRecord.refinedText : null;

    const summary =
      parsedRecord && typeof parsedRecord.summary === 'string'
        ? parsedRecord.summary
        : 'Applied requested changes to the diagram.';

    const changesRecord = parsedRecord && typeof parsedRecord.changes === 'object' && parsedRecord.changes
      ? parsedRecord.changes as Record<string, unknown>
      : null;

    const defaultChanges = {
      nodesAdded: 0,
      nodesRemoved: 0,
      nodesModified: 0,
      edgesAdded: 0,
      edgesRemoved: 0,
    };

    const changes = {
      nodesAdded: Number(changesRecord?.nodesAdded) || defaultChanges.nodesAdded,
      nodesRemoved: Number(changesRecord?.nodesRemoved) || defaultChanges.nodesRemoved,
      nodesModified: Number(changesRecord?.nodesModified) || defaultChanges.nodesModified,
      edgesAdded: Number(changesRecord?.edgesAdded) || defaultChanges.edgesAdded,
      edgesRemoved: Number(changesRecord?.edgesRemoved) || defaultChanges.edgesRemoved,
    };

    const suggestions = Array.isArray(parsedRecord?.suggestions)
      ? parsedRecord.suggestions.filter((s: unknown) => typeof s === 'string')
      : [];

    if (!refinedText) {
      return {
        ok: false,
        provider: 'openapi',
        refinedText: null,
        summary: 'AI could not generate a refined diagram.',
        changes: defaultChanges,
        suggestions: suggestions.length ? suggestions : ['Please try rephrasing your instruction.'],
        error: {
          code: 'NO_REFINEMENT',
          message: 'AI could not generate refined diagram content.',
        },
        raw,
      };
    }

    return {
      ok: true,
      provider: 'openapi',
      refinedText,
      summary,
      changes,
      suggestions,
      raw,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    return {
      ok: false,
      provider: 'openapi',
      refinedText: null,
      summary: 'Network error during refinement.',
      changes: {
        nodesAdded: 0,
        nodesRemoved: 0,
        nodesModified: 0,
        edgesAdded: 0,
        edgesRemoved: 0,
      },
      suggestions: [],
      error: {
        code: 'OPENAPI_NETWORK_ERROR',
        message,
      },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}