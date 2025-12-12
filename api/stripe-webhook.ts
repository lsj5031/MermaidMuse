import { addCreditsForPaidSession } from '../src/server/creditsServer';
import {
  asStripeCheckoutSession,
  asStripeEvent,
  getStripeWebhookSecret,
  verifyStripeWebhookSignature,
} from '../src/server/stripeServer';

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

const json = (res: ApiResponse, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
};

const getHeader = (req: ApiRequest, name: string): string | null => {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    json(res, 405, { ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST.' } });
    return;
  }

  const secret = getStripeWebhookSecret();
  if (!secret) {
    json(res, 500, {
      ok: false,
      error: { code: 'NOT_CONFIGURED', message: 'STRIPE_WEBHOOK_SECRET not configured.' },
    });
    return;
  }

  const rawBody = typeof req.body === 'string' ? req.body : null;
  if (!rawBody) {
    json(res, 400, {
      ok: false,
      error: { code: 'BAD_REQUEST', message: 'Expected raw webhook body as a string.' },
    });
    return;
  }

  const signatureHeader = getHeader(req, 'stripe-signature');
  const isValid = await verifyStripeWebhookSignature(rawBody, signatureHeader, secret);

  if (!isValid) {
    json(res, 400, { ok: false, error: { code: 'INVALID_SIGNATURE', message: 'Invalid signature.' } });
    return;
  }

  let parsedEvent: unknown = null;
  try {
    parsedEvent = JSON.parse(rawBody);
  } catch {
    parsedEvent = null;
  }

  const event = asStripeEvent(parsedEvent);
  if (!event) {
    json(res, 400, { ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid Stripe event.' } });
    return;
  }

  if (event.type !== 'checkout.session.completed') {
    json(res, 200, { ok: true, received: true, ignored: true });
    return;
  }

  const session = asStripeCheckoutSession(event.data.object);
  if (!session) {
    json(res, 400, { ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid checkout session.' } });
    return;
  }

  const clerkUserId = session.metadata?.clerkUserId;
  const creditsRaw = session.metadata?.credits;
  const creditsToAdd = creditsRaw ? Number.parseInt(creditsRaw, 10) : 0;

  if (!clerkUserId || creditsToAdd <= 0) {
    json(res, 200, { ok: true, received: true, ignored: true });
    return;
  }

  try {
    const result = await addCreditsForPaidSession(clerkUserId, session.id, creditsToAdd);

    json(res, 200, {
      ok: true,
      received: true,
      creditsBalance: result.creditsBalance,
      alreadyProcessed: result.alreadyProcessed,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    json(res, 500, { ok: false, error: { code: 'SERVER_ERROR', message } });
  }
}
