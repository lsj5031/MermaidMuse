import { getBearerToken, getClerkUserIdFromSessionToken } from '../../src/server/clerkServer';
import { addCreditsForPaidSession } from '../../src/server/creditsServer';
import { getStripeCheckoutSession } from '../../src/server/stripeServer';

type NetlifyEvent = {
  httpMethod: string;
  headers?: Record<string, string | undefined>;
  body?: string | null;
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

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
};

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

  let parsed: unknown = null;
  try {
    parsed = event.body ? JSON.parse(event.body) : null;
  } catch {
    parsed = null;
  }

  const payload = asRecord(parsed);
  const sessionId = payload && typeof payload.sessionId === 'string' ? payload.sessionId : null;

  if (!sessionId) {
    return buildResponse(400, {
      ok: false,
      error: { code: 'BAD_REQUEST', message: 'Expected JSON body with { sessionId: string }.' },
    });
  }

  try {
    const session = await getStripeCheckoutSession(sessionId);

    if (!session) {
      return buildResponse(404, { ok: false, error: { code: 'NOT_FOUND', message: 'Stripe session not found.' } });
    }

    const metadataUserId = session.metadata?.clerkUserId;
    const creditsRaw = session.metadata?.credits;

    if (!metadataUserId || metadataUserId !== userId) {
      return buildResponse(403, { ok: false, error: { code: 'FORBIDDEN', message: 'Session does not belong to user.' } });
    }

    if (session.payment_status !== 'paid') {
      return buildResponse(400, {
        ok: false,
        error: { code: 'NOT_PAID', message: 'Checkout session is not paid.' },
      });
    }

    const creditsToAdd = creditsRaw ? Number.parseInt(creditsRaw, 10) : 0;

    const result = await addCreditsForPaidSession(userId, session.id, creditsToAdd);

    return buildResponse(200, {
      ok: true,
      creditsBalance: result.creditsBalance,
      creditsAdded: creditsToAdd,
      alreadyProcessed: result.alreadyProcessed,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return buildResponse(500, { ok: false, error: { code: 'SERVER_ERROR', message } });
  }
};
