import { getBearerToken, getClerkUserIdFromSessionToken } from '../src/server/clerkServer';
import { createStripeCheckoutSession, DEFAULT_CREDITS_PACK } from '../src/server/stripeServer';

type ApiRequest = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
};

const parseBody = (req: ApiRequest): unknown | null => {
  const body = req.body;
  if (!body) return null;

  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }

  return body;
};

const json = (res: ApiResponse, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(body));
};

const getHeader = (req: ApiRequest, name: string): string | null => {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    json(res, 405, { ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST.' } });
    return;
  }

  const token = getBearerToken(getHeader(req, 'authorization'));
  if (!token) {
    json(res, 401, { ok: false, error: { code: 'UNAUTHORIZED', message: 'Sign in required.' } });
    return;
  }

  const userId = await getClerkUserIdFromSessionToken(token);
  if (!userId) {
    json(res, 401, { ok: false, error: { code: 'UNAUTHORIZED', message: 'Invalid session.' } });
    return;
  }

  const parsed = parseBody(req);
  const payload = asRecord(parsed);

  const successUrl = payload && typeof payload.successUrl === 'string' ? payload.successUrl : null;
  const cancelUrl = payload && typeof payload.cancelUrl === 'string' ? payload.cancelUrl : null;

  if (!successUrl || !cancelUrl) {
    json(res, 400, {
      ok: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Expected JSON body with { successUrl: string, cancelUrl: string }.',
      },
    });
    return;
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
      json(res, 500, {
        ok: false,
        error: { code: 'STRIPE_ERROR', message: 'Unable to create checkout session.' },
      });
      return;
    }

    json(res, 200, {
      ok: true,
      checkoutSessionId: session.id,
      url: session.url,
      credits: DEFAULT_CREDITS_PACK.credits,
      amountCents: DEFAULT_CREDITS_PACK.amountCents,
      currency: DEFAULT_CREDITS_PACK.currency,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    json(res, 500, { ok: false, error: { code: 'SERVER_ERROR', message } });
  }
}
