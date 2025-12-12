import { getBearerToken, getClerkUserIdFromSessionToken } from '../../src/server/clerkServer';
import { createStripeCheckoutSession, DEFAULT_CREDITS_PACK } from '../../src/server/stripeServer';

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
  const successUrl = payload && typeof payload.successUrl === 'string' ? payload.successUrl : null;
  const cancelUrl = payload && typeof payload.cancelUrl === 'string' ? payload.cancelUrl : null;

  if (!successUrl || !cancelUrl) {
    return buildResponse(400, {
      ok: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Expected JSON body with { successUrl: string, cancelUrl: string }.',
      },
    });
  }

  try {
    const session = await createStripeCheckoutSession({
      clerkUserId: userId,
      successUrl,
      cancelUrl,
      credits: DEFAULT_CREDITS_PACK.credits,
      amountCents: DEFAULT_CREDITS_PACK.amountCents,
      currency: DEFAULT_CREDITS_PACK.currency,
    });

    if (!session) {
      return buildResponse(500, {
        ok: false,
        error: { code: 'STRIPE_ERROR', message: 'Unable to create checkout session.' },
      });
    }

    return buildResponse(200, {
      ok: true,
      checkoutSessionId: session.id,
      url: session.url,
      credits: DEFAULT_CREDITS_PACK.credits,
      amountCents: DEFAULT_CREDITS_PACK.amountCents,
      currency: DEFAULT_CREDITS_PACK.currency,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return buildResponse(500, { ok: false, error: { code: 'SERVER_ERROR', message } });
  }
};
