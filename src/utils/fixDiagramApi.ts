import { getApiUrl } from './environmentHelpers';

export interface FixDiagramResponse {
  ok: boolean;
  provider: 'openapi' | 'xai' | 'fallback';
  fixedText: string | null;
  suggestions: string[];
  creditsCharged?: boolean;
  creditsRemaining?: number;
  error?: {
    code: string;
    message: string;
  };
}

export interface FixDiagramOptions {
  timeoutMs?: number;
  token?: string | null;
}

/**
 * Call the /api/fix endpoint to fix Mermaid diagram syntax using AI.
 */
export async function fixDiagramSyntax(
  diagramText: string,
  options: FixDiagramOptions = {}
): Promise<FixDiagramResponse> {
  const timeoutMs = options.timeoutMs ?? 15000;
  const apiUrl = getApiUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    const response = await fetch(`${apiUrl}/api/fix`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ diagramText }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      const errorRecord = (errorData.error as Record<string, unknown> | undefined) ?? {};

      const code =
        typeof errorRecord.code === 'string'
          ? errorRecord.code
          : `HTTP_${response.status}`;

      const message =
        (typeof errorRecord.message === 'string' && errorRecord.message) ||
        `API request failed with status ${response.status}`;

      const creditsRemaining =
        typeof errorData.creditsRemaining === 'number' ? errorData.creditsRemaining : undefined;

      return {
        ok: false,
        provider: 'fallback',
        fixedText: null,
        suggestions: [message],
        creditsCharged: false,
        creditsRemaining,
        error: {
          code,
          message,
        },
      };
    }

    const data = (await response.json()) as FixDiagramResponse;
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    return {
      ok: false,
      provider: 'fallback',
      fixedText: null,
      suggestions: [message],
      error: {
        code: 'NETWORK_ERROR',
        message,
      },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
