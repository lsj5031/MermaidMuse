import { getApiUrl } from './environmentHelpers';

export interface RefinementTurn {
  id: string;
  role: 'user' | 'assistant';
  instruction: string;
  diagramBefore: string;
  diagramAfter: string;
  summary?: string;
  timestamp: number;
}

export interface RefineDiagramResponse {
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
}

export interface RefineDiagramOptions {
  timeoutMs?: number;
  token?: string | null;
  history?: RefinementTurn[];
}

/**
 * Call the /api/refine endpoint to refine Mermaid diagrams using AI.
 */
export async function refineDiagram(
  diagramText: string,
  instruction: string,
  options: RefineDiagramOptions = {}
): Promise<RefineDiagramResponse> {
  const timeoutMs = options.timeoutMs ?? 30000;
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

    const response = await fetch(`${apiUrl}/api/refine`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        diagramText,
        instruction,
        history: options.history,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      const errorRecord = (errorData.error as Record<string, unknown> | undefined) ?? {};

      const code =
        typeof errorRecord.code === 'string' ? errorRecord.code : `HTTP_${response.status}`;

      const message =
        (typeof errorRecord.message === 'string' && errorRecord.message) ||
        `API request failed with status ${response.status}`;

      const creditsRemaining =
        typeof errorData.creditsRemaining === 'number' ? errorData.creditsRemaining : undefined;

      return {
        ok: false,
        provider: 'fallback',
        refinedText: null,
        summary: 'Refinement failed.',
        changes: {
          nodesAdded: 0,
          nodesRemoved: 0,
          nodesModified: 0,
          edgesAdded: 0,
          edgesRemoved: 0,
        },
        suggestions: [message],
        creditsCharged: false,
        creditsRemaining,
        error: {
          code,
          message,
        },
      };
    }

    const data = (await response.json()) as RefineDiagramResponse;
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    return {
      ok: false,
      provider: 'fallback',
      refinedText: null,
      summary: 'Network error during refinement.',
      changes: {
        nodesAdded: 0,
        nodesRemoved: 0,
        nodesModified: 0,
        edgesAdded: 0,
        edgesRemoved: 0,
      },
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