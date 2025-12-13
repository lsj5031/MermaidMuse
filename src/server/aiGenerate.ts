export interface GenerateResponse {
  ok: boolean;
  provider: 'openapi' | 'fallback';
  generatedText: string | null;
  diagramType: string | null;
  suggestions: string[];
  error?: {
    code: string;
    message: string;
  };
  raw?: unknown;
}

export interface GenerateOptions {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
  diagramType?: string;
  style?: string;
}

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4o';

const SYSTEM_PROMPT = `You are a Mermaid diagram expert. Generate valid Mermaid diagram code from natural language descriptions.

Rules:
1. Output ONLY valid Mermaid syntax that will render correctly
2. Choose the most appropriate diagram type if not specified
3. Use clear, descriptive node labels
4. Keep diagrams readable (not too many nodes)
5. Return a JSON object with keys: generatedText (string), diagramType (string), suggestions (string[])
6. Do not include markdown fences or any other text outside the JSON

Supported diagram types: flowchart, sequence, class, state, er, gantt, pie, mindmap, timeline, kanban, block, sankey, git, journey`;

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

export async function generateMermaidDiagram(
  prompt: string,
  options: GenerateOptions = {}
): Promise<GenerateResponse> {
  const env =
    ((globalThis as unknown as { process?: NodeProcessLike }).process?.env as
      | Record<string, string | undefined>
      | undefined) ?? {};

  const apiKey = options.apiKey ?? env.OPENAPI_API_KEY ?? env.XAI_API_KEY;
  const baseUrl = options.baseUrl ?? env.OPENAPI_BASE_URL ?? env.XAI_BASE_URL ?? DEFAULT_BASE_URL;
  const model = options.model ?? env.OPENAPI_MODEL ?? env.XAI_MODEL ?? DEFAULT_MODEL;
  const timeoutMs = options.timeoutMs ?? 30000;

  if (!prompt.trim()) {
    return {
      ok: false,
      provider: 'fallback',
      generatedText: null,
      diagramType: null,
      suggestions: ['Please provide a prompt to generate a diagram.'],
      error: {
        code: 'EMPTY_PROMPT',
        message: 'Prompt cannot be empty.',
      },
    };
  }

  if (!apiKey) {
    return {
      ok: false,
      provider: 'fallback',
      generatedText: null,
      diagramType: null,
      suggestions: ['Set OPENAPI_API_KEY to enable AI diagram generation.'],
      error: {
        code: 'NOT_CONFIGURED',
        message: 'OPENAPI_API_KEY is not configured.',
      },
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const diagramTypeHint = options.diagramType ? `${options.diagramType} ` : '';
    const styleHint =
      options.style === 'detailed'
        ? 'Include detailed labels and comprehensive flow.'
        : 'Keep the diagram concise and focused.';

    const userPrompt = `Generate a Mermaid ${diagramTypeHint}diagram for the following description:

${prompt}

${styleHint}`;

    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
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
        generatedText: null,
        diagramType: null,
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
        generatedText: null,
        diagramType: null,
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

    const generatedText =
      parsedRecord && typeof parsedRecord.generatedText === 'string'
        ? parsedRecord.generatedText
        : null;

    const diagramType =
      parsedRecord && typeof parsedRecord.diagramType === 'string'
        ? parsedRecord.diagramType
        : null;

    const suggestions = Array.isArray(parsedRecord?.suggestions)
      ? parsedRecord.suggestions.filter((s: unknown) => typeof s === 'string')
      : [];

    if (!generatedText) {
      return {
        ok: false,
        provider: 'openapi',
        generatedText: null,
        diagramType: null,
        suggestions: suggestions.length ? suggestions : [content.trim()],
        error: {
          code: 'INVALID_RESPONSE',
          message: 'AI response did not contain valid diagram text.',
        },
        raw,
      };
    }

    return {
      ok: true,
      provider: 'openapi',
      generatedText,
      diagramType,
      suggestions,
      raw,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    return {
      ok: false,
      provider: 'openapi',
      generatedText: null,
      diagramType: null,
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
