export interface FixSyntaxResponse {
  ok: boolean;
  provider: 'xai' | 'fallback';
  fixedText: string | null;
  suggestions: string[];
  error?: {
    code: string;
    message: string;
  };
  raw?: unknown;
}

export interface FixSyntaxOptions {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
}

const DEFAULT_BASE_URL = 'https://api.x.ai/v1';
const DEFAULT_MODEL = 'grok-beta';

const SYSTEM_PROMPT =
  'You are a meticulous Mermaid syntax expert. Fix ONLY syntax errors and preserve intent. ' +
  'Return a JSON object with keys: fixedText (string), suggestions (string[]). ' +
  'Do not include markdown fences. Do not include any other keys.';

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

export async function fixMermaidSyntaxWithXai(
  diagramText: string,
  options: FixSyntaxOptions = {}
): Promise<FixSyntaxResponse> {
  const env =
    ((globalThis as unknown as { process?: NodeProcessLike }).process?.env as
      | Record<string, string | undefined>
      | undefined) ?? {};

  const apiKey = options.apiKey ?? env.XAI_API_KEY;
  const baseUrl = options.baseUrl ?? env.XAI_BASE_URL ?? DEFAULT_BASE_URL;
  const model = options.model ?? env.XAI_MODEL ?? DEFAULT_MODEL;
  const timeoutMs = options.timeoutMs ?? 15000;

  if (!diagramText.trim()) {
    return {
      ok: true,
      provider: 'fallback',
      fixedText: diagramText,
      suggestions: [],
    };
  }

  if (!apiKey) {
    return {
      ok: false,
      provider: 'fallback',
      fixedText: null,
      suggestions: ['Set XAI_API_KEY to enable AI syntax fixing.'],
      error: {
        code: 'NOT_CONFIGURED',
        message: 'XAI_API_KEY is not configured.',
      },
    };
  }

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
            content:
              'Fix Mermaid syntax errors in the following diagram. Preserve formatting where possible.\n\n' +
              diagramText,
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
        `xAI request failed with status ${response.status}`;

      return {
        ok: false,
        provider: 'xai',
        fixedText: null,
        suggestions: [],
        error: {
          code: 'XAI_REQUEST_FAILED',
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
        provider: 'xai',
        fixedText: null,
        suggestions: [],
        error: {
          code: 'EMPTY_RESPONSE',
          message: 'xAI returned an empty response.',
        },
        raw,
      };
    }

    const parsed = extractJsonObject(content);
    const parsedRecord = asRecord(parsed);

    const fixedText = parsedRecord && typeof parsedRecord.fixedText === 'string' ? parsedRecord.fixedText : null;

    const suggestions = Array.isArray(parsedRecord?.suggestions)
      ? parsedRecord.suggestions.filter((s: unknown) => typeof s === 'string')
      : [];

    if (!fixedText) {
      return {
        ok: true,
        provider: 'xai',
        fixedText: null,
        suggestions: suggestions.length ? suggestions : [content.trim()],
        raw,
      };
    }

    return {
      ok: true,
      provider: 'xai',
      fixedText,
      suggestions,
      raw,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    return {
      ok: false,
      provider: 'xai',
      fixedText: null,
      suggestions: [],
      error: {
        code: 'XAI_NETWORK_ERROR',
        message,
      },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
