import { getApiUrl } from './environmentHelpers';

export interface FixDiagramResponse {
  ok: boolean;
  provider: 'openapi' | 'xai' | 'fallback';
  fixedText: string | null;
  suggestions: string[];
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Call the /api/fix endpoint to fix Mermaid diagram syntax using AI
 */
export async function fixDiagramSyntax(
  diagramText: string,
  timeoutMs: number = 15000
): Promise<FixDiagramResponse> {
  const apiUrl = getApiUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${apiUrl}/api/fix`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ diagramText }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      throw new Error(
        `API request failed with status ${response.status}: ${
          (errorData.error as Record<string, string> | undefined)?.message ||
          'Unknown error'
        }`
      );
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
