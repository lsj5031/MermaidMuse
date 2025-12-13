export interface Suggestion {
  id: string;
  type: 'improvement' | 'warning' | 'pattern' | 'tip';
  severity: 'info' | 'low' | 'medium' | 'high';
  message: string;
  details?: string;
  lineNumber?: number;
  action?: {
    label: string;
    type: 'apply_fix' | 'show_example' | 'learn_more';
    payload?: string;
  };
}

export interface AnalyzeResponse {
  ok: boolean;
  provider: 'openapi' | 'fallback';
  complexity: {
    level: 'low' | 'medium' | 'high';
    nodeCount: number;
    edgeCount: number;
    maxDepth: number;
  };
  suggestions: Suggestion[];
  diagramType: string;
  error?: {
    code: string;
    message: string;
  };
  raw?: unknown;
}

export interface AnalyzeOptions {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
  focusAreas?: string[];
}

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4o';

const SYSTEM_PROMPT = `You are a Mermaid diagram analysis expert. Analyze diagrams and provide actionable suggestions.

Your analysis should include:
1. Complexity assessment (node count, edge count, depth)
2. Improvement suggestions (better structure, clearer labels, subgraphs)
3. Warnings (unused nodes, potential errors, accessibility issues)
4. Pattern recognition (identify common diagram patterns, suggest best practices)

Return a JSON object with this exact structure:
{
  "complexity": {
    "level": "low" | "medium" | "high",
    "nodeCount": number,
    "edgeCount": number,
    "maxDepth": number
  },
  "diagramType": string,
  "suggestions": [
    {
      "id": "sug_N",
      "type": "improvement" | "warning" | "pattern" | "tip",
      "severity": "info" | "low" | "medium" | "high",
      "message": string,
      "details": string (optional),
      "lineNumber": number (optional),
      "action": {
        "label": string,
        "type": "apply_fix" | "show_example" | "learn_more",
        "payload": string (optional)
      } (optional)
    }
  ]
}

Focus on practical, actionable advice. Limit to 5-7 most important suggestions.
Do not include markdown fences. Return only the JSON object.`;

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

const detectDiagramType = (diagramText: string): string => {
  const firstLine = diagramText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => Boolean(line));

  if (!firstLine) return 'unknown';

  const token = firstLine.split(/\s+/)[0]?.toLowerCase() ?? 'unknown';

  const mapping: Record<string, string> = {
    flowchart: 'flowchart',
    sequencediagram: 'sequence',
    classdiagram: 'class',
    statediagram: 'state',
    'statediagram-v2': 'state',
    erdiagram: 'er',
    gantt: 'gantt',
    pie: 'pie',
    mindmap: 'mindmap',
    timeline: 'timeline',
    journey: 'journey',
    sankey: 'sankey',
    gitgraph: 'git',
    block: 'block',
    kanban: 'kanban',
  };

  return mapping[token] ?? token;
};

const analyzeComplexityFallback = (diagramText: string): AnalyzeResponse['complexity'] => {
  const nodes = new Set<string>();
  const edges: Array<{ from: string; to: string }> = [];

  const nodeDefRegex = /^\s*([A-Za-z0-9_]+)\s*(?:\[|\(|\{|"|`)/;

  const edgeRegexes = [
    /\b([A-Za-z0-9_]+)\b\s*--?>\s*\b([A-Za-z0-9_]+)\b/g,
    /\b([A-Za-z0-9_]+)\b\s*---\s*\b([A-Za-z0-9_]+)\b/g,
    /\b([A-Za-z0-9_]+)\b\s*-\.->\s*\b([A-Za-z0-9_]+)\b/g,
    /\b([A-Za-z0-9_]+)\b\s*==>\s*\b([A-Za-z0-9_]+)\b/g,
    /\b([A-Za-z0-9_]+)\b\s*<--?>\s*\b([A-Za-z0-9_]+)\b/g,
    /\b([A-Za-z0-9_]+)\b\s*<-->\s*\b([A-Za-z0-9_]+)\b/g,
    /\b([A-Za-z0-9_]+)\b\s*--[ox]\s*\b([A-Za-z0-9_]+)\b/g,
  ];

  const lines = diagramText.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('%%')) continue;

    const nodeMatch = nodeDefRegex.exec(trimmed);
    if (nodeMatch?.[1]) {
      nodes.add(nodeMatch[1]);
    }

    for (const regex of edgeRegexes) {
      regex.lastIndex = 0;
      let match: RegExpExecArray | null = null;
      while ((match = regex.exec(trimmed))) {
        const from = match[1];
        const to = match[2];
        if (from) nodes.add(from);
        if (to) nodes.add(to);
        if (from && to) {
          edges.push({ from, to });
        }
      }
    }
  }

  const adjacency = new Map<string, string[]>();
  for (const { from, to } of edges) {
    const list = adjacency.get(from) ?? [];
    list.push(to);
    adjacency.set(from, list);
  }

  const memo = new Map<string, number>();
  const visiting = new Set<string>();

  const dfs = (node: string): number => {
    const memoized = memo.get(node);
    if (typeof memoized === 'number') return memoized;
    if (visiting.has(node)) return 0;

    visiting.add(node);
    let best = 0;
    for (const next of adjacency.get(node) ?? []) {
      best = Math.max(best, dfs(next) + 1);
    }
    visiting.delete(node);

    memo.set(node, best);
    return best;
  };

  let maxDepth = 0;
  for (const node of nodes) {
    maxDepth = Math.max(maxDepth, dfs(node));
  }

  const nodeCount = nodes.size;
  const edgeCount = edges.length;

  const level: AnalyzeResponse['complexity']['level'] =
    nodeCount <= 8 && edgeCount <= 10 ? 'low' : nodeCount <= 20 && edgeCount <= 30 ? 'medium' : 'high';

  return {
    level,
    nodeCount,
    edgeCount,
    maxDepth,
  };
};

const normalizeSuggestionType = (value: unknown): Suggestion['type'] => {
  if (value === 'improvement' || value === 'warning' || value === 'pattern' || value === 'tip') {
    return value;
  }
  return 'tip';
};

const normalizeSeverity = (value: unknown): Suggestion['severity'] => {
  if (value === 'info' || value === 'low' || value === 'medium' || value === 'high') {
    return value;
  }
  return 'info';
};

const normalizeActionType = (
  value: unknown
): NonNullable<Suggestion['action']>['type'] => {
  if (value === 'apply_fix' || value === 'show_example' || value === 'learn_more') {
    return value;
  }
  return 'learn_more';
};

export async function analyzeMermaidDiagram(
  diagramText: string,
  options: AnalyzeOptions = {}
): Promise<AnalyzeResponse> {
  const env =
    ((globalThis as unknown as { process?: NodeProcessLike }).process?.env as
      | Record<string, string | undefined>
      | undefined) ?? {};

  const apiKey = options.apiKey ?? env.OPENAPI_API_KEY ?? env.XAI_API_KEY;
  const baseUrl = options.baseUrl ?? env.OPENAPI_BASE_URL ?? env.XAI_BASE_URL ?? DEFAULT_BASE_URL;
  const model = options.model ?? env.OPENAPI_MODEL ?? env.XAI_MODEL ?? DEFAULT_MODEL;
  const timeoutMs = options.timeoutMs ?? 20000;

  const diagramTypeFallback = detectDiagramType(diagramText);
  const complexityFallback = analyzeComplexityFallback(diagramText);

  if (!diagramText.trim()) {
    return {
      ok: false,
      provider: 'fallback',
      diagramType: diagramTypeFallback,
      complexity: complexityFallback,
      suggestions: [],
      error: {
        code: 'EMPTY_DIAGRAM',
        message: 'Diagram text cannot be empty.',
      },
    };
  }

  if (!apiKey) {
    return {
      ok: false,
      provider: 'fallback',
      diagramType: diagramTypeFallback,
      complexity: complexityFallback,
      suggestions: [],
      error: {
        code: 'NOT_CONFIGURED',
        message: 'OPENAPI_API_KEY is not configured.',
      },
    };
  }

  const focusHint = options.focusAreas?.length
    ? `Focus areas: ${options.focusAreas.filter(Boolean).join(', ')}`
    : '';

  const userPrompt = `${focusHint ? `${focusHint}\n\n` : ''}Analyze this Mermaid diagram:\n\n${diagramText}`;

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
        temperature: 0.2,
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
        diagramType: diagramTypeFallback,
        complexity: complexityFallback,
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
        diagramType: diagramTypeFallback,
        complexity: complexityFallback,
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

    const diagramType =
      parsedRecord && typeof parsedRecord.diagramType === 'string'
        ? parsedRecord.diagramType
        : diagramTypeFallback;

    const complexityRecord = parsedRecord ? asRecord(parsedRecord.complexity) : null;

    const nodeCountRaw = complexityRecord?.nodeCount;
    const edgeCountRaw = complexityRecord?.edgeCount;
    const maxDepthRaw = complexityRecord?.maxDepth;

    const nodeCount = typeof nodeCountRaw === 'number' ? nodeCountRaw : complexityFallback.nodeCount;
    const edgeCount = typeof edgeCountRaw === 'number' ? edgeCountRaw : complexityFallback.edgeCount;
    const maxDepth = typeof maxDepthRaw === 'number' ? maxDepthRaw : complexityFallback.maxDepth;

    const levelRaw = complexityRecord?.level;
    const level: AnalyzeResponse['complexity']['level'] =
      levelRaw === 'low' || levelRaw === 'medium' || levelRaw === 'high'
        ? levelRaw
        : analyzeComplexityFallback(diagramText).level;

    const suggestionsRaw = Array.isArray(parsedRecord?.suggestions) ? parsedRecord.suggestions : [];

    const suggestions: Suggestion[] = suggestionsRaw
      .map((item: unknown, index: number): Suggestion | null => {
        const r = asRecord(item);
        if (!r || typeof r.message !== 'string' || !r.message.trim()) return null;

        const actionRecord = r.action ? asRecord(r.action) : null;
        const action =
          actionRecord && typeof actionRecord.label === 'string'
            ? {
                label: actionRecord.label,
                type: normalizeActionType(actionRecord.type),
                payload: typeof actionRecord.payload === 'string' ? actionRecord.payload : undefined,
              }
            : undefined;

        return {
          id: typeof r.id === 'string' && r.id.trim() ? r.id : `sug_${index + 1}`,
          type: normalizeSuggestionType(r.type),
          severity: normalizeSeverity(r.severity),
          message: r.message.trim(),
          details: typeof r.details === 'string' ? r.details : undefined,
          lineNumber: typeof r.lineNumber === 'number' ? r.lineNumber : undefined,
          action,
        };
      })
      .filter((s): s is Suggestion => Boolean(s));

    return {
      ok: true,
      provider: 'openapi',
      diagramType,
      complexity: {
        level,
        nodeCount,
        edgeCount,
        maxDepth,
      },
      suggestions,
      raw,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    return {
      ok: false,
      provider: 'openapi',
      diagramType: diagramTypeFallback,
      complexity: complexityFallback,
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
