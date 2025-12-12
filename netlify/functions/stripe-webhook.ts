import { addCreditsForPaidSession } from '../../src/server/creditsServer';
import {
  asStripeCheckoutSession,
  asStripeEvent,
  getStripeWebhookSecret,
  verifyStripeWebhookSignature,
} from '../../src/server/stripeServer';

type NetlifyEvent = {
  httpMethod: string;
  headers?: Record<string, string | undefined>;
  body?: string | null;
};

const buildResponse = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
  body: JSON.stringify(body),
});

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod !== 'POST') {
    return buildResponse(405, {
      ok: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST.' },
    });
  }

  const secret = getStripeWebhookSecret();
  if (!secret) {
    return buildResponse(500, {
      ok: false,
      error: { code: 'NOT_CONFIGURED', message: 'STRIPE_WEBHOOK_SECRET not configured.' },
    });
  }

  const rawBody = event.body ?? '';
  const signatureHeader = event.headers?.['stripe-signature'] ?? event.headers?.['Stripe-Signature'];

  const isValid = await verifyStripeWebhookSignature(rawBody, signatureHeader, secret);

  if (!isValid) {
    return buildResponse(400, { ok: false, error: { code: 'INVALID_SIGNATURE', message: 'Invalid signature.' } });
  }

  let parsedEvent: unknown = null;
  try {
    parsedEvent = JSON.parse(rawBody);
  } catch {
    parsedEvent = null;
  }

  const stripeEvent = asStripeEvent(parsedEvent);
  if (!stripeEvent) {
    return buildResponse(400, { ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid Stripe event.' } });
  }

  if (stripeEvent.type !== 'checkout.session.completed') {
    return buildResponse(200, { ok: true, received: true, ignored: true });
  }

  const session = asStripeCheckoutSession(stripeEvent.data.object);
  if (!session) {
    return buildResponse(400, { ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid checkout session.' } });
  }

  const clerkUserId = session.metadata?.clerkUserId;
  const creditsRaw = session.metadata?.credits;
  const creditsToAdd = creditsRaw ? Number.parseInt(creditsRaw, 10) : 0;

  if (!clerkUserId || creditsToAdd <= 0) {
    return buildResponse(200, { ok: true, received: true, ignored: true });
  }

  try {
    const result = await addCreditsForPaidSession(clerkUserId, session.id, creditsToAdd);
    return buildResponse(200, {
      ok: true,
      received: true,
      creditsBalance: result.creditsBalance,
      alreadyProcessed: result.alreadyProcessed,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return buildResponse(500, { ok: false, error: { code: 'SERVER_ERROR', message } });
  }
};
