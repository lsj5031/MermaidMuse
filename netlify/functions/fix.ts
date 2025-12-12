import { fixMermaidSyntaxWithXai } from '../../src/server/xaiFix';
import { getBearerToken, getClerkUserIdFromSessionToken } from '../../src/server/clerkServer';
import { ensureCreditsBalance, spendCredits } from '../../src/server/creditsServer';

type NetlifyEvent = {
  httpMethod: string;
  body?: string | null;
  headers?: Record<string, string | undefined>;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
};

const buildResponse = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  },
  body: JSON.stringify(body),
});

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return buildResponse(405, {
      ok: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST.' },
    });
  }

  const token = getBearerToken(event.headers?.authorization ?? event.headers?.Authorization);
  if (!token) {
    return buildResponse(401, { ok: false, error: { code: 'UNAUTHORIZED', message: 'Sign in required.' } });
  }

  const userId = await getClerkUserIdFromSessionToken(token);
  if (!userId) {
    return buildResponse(401, { ok: false, error: { code: 'UNAUTHORIZED', message: 'Invalid session.' } });
  }

  let payload: unknown = null;
  try {
    payload = event.body ? JSON.parse(event.body) : null;
  } catch {
    payload = null;
  }

  const record = asRecord(payload);

  const diagramText =
    (record && typeof record.diagramText === 'string' && record.diagramText) ||
    (record && typeof record.diagram === 'string' && record.diagram) ||
    (record && typeof record.text === 'string' && record.text) ||
    null;

  if (typeof diagramText !== 'string') {
    return buildResponse(400, {
      ok: false,
      error: { code: 'BAD_REQUEST', message: 'Expected JSON body with { diagramText: string }.' },
    });
  }

  try {
    const creditsBefore = await ensureCreditsBalance(userId);

    if (creditsBefore < 1) {
      return buildResponse(402, {
        ok: false,
        error: {
          code: 'INSUFFICIENT_CREDITS',
          message: 'You do not have enough credits to run an AI fix.',
        },
        creditsCharged: false,
        creditsRemaining: creditsBefore,
      });
    }

    const result = await fixMermaidSyntaxWithXai(diagramText);

    const shouldCharge = Boolean(result.ok && result.fixedText);
    const creditsRemaining = shouldCharge ? await spendCredits(userId, 1) : creditsBefore;

    return buildResponse(200, {
      ...result,
      creditsCharged: shouldCharge,
      creditsRemaining,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return buildResponse(500, { ok: false, error: { code: 'SERVER_ERROR', message } });
  }
};
