import { getApiUrl } from './environmentHelpers';

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

export interface AnalyzeDiagramResponse {
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
  creditsCharged?: boolean;
  creditsRemaining?: number;
  error?: {
    code: string;
    message: string;
  };
}

export async function analyzeDiagram(
  diagramText: string,
  options: { token?: string | null; timeoutMs?: number; focusAreas?: string[] } = {}
): Promise<AnalyzeDiagramResponse> {
  const timeoutMs = options.timeoutMs ?? 20000;
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

    const response = await fetch(`${apiUrl}/api/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ diagramText, focusAreas: options.focusAreas }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      const errorRecord = (errorData.error as Record<string, unknown> | undefined) ?? {};

      const code = typeof errorRecord.code === 'string' ? errorRecord.code : `HTTP_${response.status}`;

      const message =
        (typeof errorRecord.message === 'string' && errorRecord.message) ||
        `API request failed with status ${response.status}`;

      const creditsRemaining =
        typeof errorData.creditsRemaining === 'number' ? errorData.creditsRemaining : undefined;

      return {
        ok: false,
        provider: 'fallback',
        complexity: {
          level: 'low',
          nodeCount: 0,
          edgeCount: 0,
          maxDepth: 0,
        },
        suggestions: [
          {
            id: 'error',
            type: 'warning',
            severity: 'high',
            message,
          },
        ],
        diagramType: 'unknown',
        creditsCharged: false,
        creditsRemaining,
        error: {
          code,
          message,
        },
      };
    }

    const data = (await response.json()) as AnalyzeDiagramResponse;
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    return {
      ok: false,
      provider: 'fallback',
      complexity: {
        level: 'low',
        nodeCount: 0,
        edgeCount: 0,
        maxDepth: 0,
      },
      suggestions: [],
      diagramType: 'unknown',
      error: {
        code: 'NETWORK_ERROR',
        message,
      },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
