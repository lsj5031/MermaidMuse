import { fixMermaidSyntaxWithXai } from '../server/xaiFix';
import { getBearerToken, getClerkUserIdFromSessionToken } from '../server/clerkServer';
import {
  addCreditsForPaidSession,
  ensureCreditsBalance,
  spendCredits,
} from '../server/creditsServer';
import {
  asStripeCheckoutSession,
  asStripeEvent,
  createStripeCheckoutSession,
  DEFAULT_CREDITS_PACK,
  getStripeCheckoutSession,
  getStripeWebhookSecret,
  verifyStripeWebhookSignature,
} from '../server/stripeServer';
import { type RuntimeEnv } from '../server/runtimeEnv';

type CloudflareEnv = {
  OPENAPI_API_KEY?: string;
  OPENAPI_MODEL?: string;
  OPENAPI_BASE_URL?: string;
  CLERK_SECRET_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
};

const json = (status: number, body: unknown): Response => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};

const parseBody = async (req: Request): Promise<unknown | null> => {
  try {
    const text = await req.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(req: Request, env: CloudflareEnv): Promise<Response> {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Extract path from URL
    const url = new URL(req.url);
    const pathname = url.pathname;

    const runtimeEnv = env as unknown as RuntimeEnv;

    // Route /api/credits-balance
    if (pathname === '/api/credits-balance') {
      if (req.method !== 'GET') {
        return json(405, {
          ok: false,
          error: { code: 'METHOD_NOT_ALLOWED', message: 'Use GET.' },
        });
      }

      if (!env.CLERK_SECRET_KEY) {
        return json(500, {
          ok: false,
          error: { code: 'NOT_CONFIGURED', message: 'CLERK_SECRET_KEY not configured.' },
        });
      }

      const token = getBearerToken(req.headers.get('Authorization'));
      if (!token) {
        return json(401, {
          ok: false,
          error: { code: 'UNAUTHORIZED', message: 'Sign in required.' },
        });
      }

      const userId = await getClerkUserIdFromSessionToken(token, runtimeEnv);
      if (!userId) {
        return json(401, {
          ok: false,
          error: { code: 'UNAUTHORIZED', message: 'Invalid session.' },
        });
      }

      const creditsBalance = await ensureCreditsBalance(userId, runtimeEnv);
      return json(200, { ok: true, creditsBalance });
    }

    // Route /api/stripe-create-checkout-session
    if (pathname === '/api/stripe-create-checkout-session') {
      if (req.method !== 'POST') {
        return json(405, {
          ok: false,
          error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST.' },
        });
      }

      if (!env.CLERK_SECRET_KEY || !env.STRIPE_SECRET_KEY) {
        return json(500, {
          ok: false,
          error: { code: 'NOT_CONFIGURED', message: 'Stripe billing is not configured.' },
        });
      }

      const token = getBearerToken(req.headers.get('Authorization'));
      if (!token) {
        return json(401, {
          ok: false,
          error: { code: 'UNAUTHORIZED', message: 'Sign in required.' },
        });
      }

      const userId = await getClerkUserIdFromSessionToken(token, runtimeEnv);
      if (!userId) {
        return json(401, {
          ok: false,
          error: { code: 'UNAUTHORIZED', message: 'Invalid session.' },
        });
      }

      const parsed = await parseBody(req);
      const payload = asRecord(parsed);

      const successUrl =
        payload && typeof payload.successUrl === 'string' ? payload.successUrl : null;
      const cancelUrl = payload && typeof payload.cancelUrl === 'string' ? payload.cancelUrl : null;

      if (!successUrl || !cancelUrl) {
        return json(400, {
          ok: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Expected JSON body with { successUrl: string, cancelUrl: string }.',
          },
        });
      }

      const session = await createStripeCheckoutSession(
        {
          clerkUserId: userId,
          successUrl,
          cancelUrl,
          credits: DEFAULT_CREDITS_PACK.credits,
          amountCents: DEFAULT_CREDITS_PACK.amountCents,
          currency: DEFAULT_CREDITS_PACK.currency,
        },
        runtimeEnv
      );

      if (!session) {
        return json(500, {
          ok: false,
          error: { code: 'STRIPE_ERROR', message: 'Unable to create checkout session.' },
        });
      }

      return json(200, {
        ok: true,
        checkoutSessionId: session.id,
        url: session.url,
        credits: DEFAULT_CREDITS_PACK.credits,
        amountCents: DEFAULT_CREDITS_PACK.amountCents,
        currency: DEFAULT_CREDITS_PACK.currency,
      });
    }

    // Route /api/stripe-fulfill-session
    if (pathname === '/api/stripe-fulfill-session') {
      if (req.method !== 'POST') {
        return json(405, {
          ok: false,
          error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST.' },
        });
      }

      if (!env.CLERK_SECRET_KEY || !env.STRIPE_SECRET_KEY) {
        return json(500, {
          ok: false,
          error: { code: 'NOT_CONFIGURED', message: 'Stripe billing is not configured.' },
        });
      }

      const token = getBearerToken(req.headers.get('Authorization'));
      if (!token) {
        return json(401, {
          ok: false,
          error: { code: 'UNAUTHORIZED', message: 'Sign in required.' },
        });
      }

      const userId = await getClerkUserIdFromSessionToken(token, runtimeEnv);
      if (!userId) {
        return json(401, {
          ok: false,
          error: { code: 'UNAUTHORIZED', message: 'Invalid session.' },
        });
      }

      const parsed = await parseBody(req);
      const payload = asRecord(parsed);
      const sessionId = payload && typeof payload.sessionId === 'string' ? payload.sessionId : null;

      if (!sessionId) {
        return json(400, {
          ok: false,
          error: { code: 'BAD_REQUEST', message: 'Expected JSON body with { sessionId: string }.' },
        });
      }

      const session = await getStripeCheckoutSession(sessionId, runtimeEnv);
      if (!session) {
        return json(404, {
          ok: false,
          error: { code: 'NOT_FOUND', message: 'Stripe session not found.' },
        });
      }

      const metadataUserId = session.metadata?.clerkUserId;
      const creditsRaw = session.metadata?.credits;

      if (!metadataUserId || metadataUserId !== userId) {
        return json(403, {
          ok: false,
          error: { code: 'FORBIDDEN', message: 'Session does not belong to user.' },
        });
      }

      if (session.payment_status !== 'paid') {
        return json(400, {
          ok: false,
          error: { code: 'NOT_PAID', message: 'Checkout session is not paid.' },
        });
      }

      const creditsToAdd = creditsRaw ? Number.parseInt(creditsRaw, 10) : 0;
      const result = await addCreditsForPaidSession(userId, session.id, creditsToAdd, runtimeEnv);

      return json(200, {
        ok: true,
        creditsBalance: result.creditsBalance,
        creditsAdded: creditsToAdd,
        alreadyProcessed: result.alreadyProcessed,
      });
    }

    // Route /api/stripe-webhook
    if (pathname === '/api/stripe-webhook') {
      if (req.method !== 'POST') {
        return json(405, {
          ok: false,
          error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST.' },
        });
      }

      if (!env.CLERK_SECRET_KEY) {
        return json(500, {
          ok: false,
          error: { code: 'NOT_CONFIGURED', message: 'CLERK_SECRET_KEY not configured.' },
        });
      }

      const webhookSecret = getStripeWebhookSecret(runtimeEnv);
      if (!webhookSecret) {
        return json(500, {
          ok: false,
          error: { code: 'NOT_CONFIGURED', message: 'STRIPE_WEBHOOK_SECRET not configured.' },
        });
      }

      const rawBody = await req.text();
      const signatureHeader = req.headers.get('Stripe-Signature');
      const isValid = await verifyStripeWebhookSignature(rawBody, signatureHeader, webhookSecret);

      if (!isValid) {
        return json(400, {
          ok: false,
          error: { code: 'INVALID_SIGNATURE', message: 'Invalid signature.' },
        });
      }

      let parsedEvent: unknown = null;
      try {
        parsedEvent = JSON.parse(rawBody);
      } catch {
        parsedEvent = null;
      }

      const stripeEvent = asStripeEvent(parsedEvent);
      if (!stripeEvent) {
        return json(400, {
          ok: false,
          error: { code: 'BAD_REQUEST', message: 'Invalid Stripe event.' },
        });
      }

      if (stripeEvent.type !== 'checkout.session.completed') {
        return json(200, { ok: true, received: true, ignored: true });
      }

      const session = asStripeCheckoutSession(stripeEvent.data.object);
      if (!session) {
        return json(400, {
          ok: false,
          error: { code: 'BAD_REQUEST', message: 'Invalid checkout session.' },
        });
      }

      const clerkUserId = session.metadata?.clerkUserId;
      const creditsRaw = session.metadata?.credits;
      const creditsToAdd = creditsRaw ? Number.parseInt(creditsRaw, 10) : 0;

      if (!clerkUserId || creditsToAdd <= 0) {
        return json(200, { ok: true, received: true, ignored: true });
      }

      const result = await addCreditsForPaidSession(
        clerkUserId,
        session.id,
        creditsToAdd,
        runtimeEnv
      );
      return json(200, {
        ok: true,
        received: true,
        creditsBalance: result.creditsBalance,
        alreadyProcessed: result.alreadyProcessed,
      });
    }

    // Route /api/fix
    if (pathname === '/api/fix') {
      if (req.method !== 'POST') {
        return json(405, {
          ok: false,
          error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST.' },
        });
      }

      if (!env.CLERK_SECRET_KEY) {
        return json(500, {
          ok: false,
          error: { code: 'NOT_CONFIGURED', message: 'CLERK_SECRET_KEY not configured.' },
        });
      }

      const token = getBearerToken(req.headers.get('Authorization'));
      if (!token) {
        return json(401, {
          ok: false,
          error: { code: 'UNAUTHORIZED', message: 'Sign in required.' },
        });
      }

      const userId = await getClerkUserIdFromSessionToken(token, runtimeEnv);
      if (!userId) {
        return json(401, {
          ok: false,
          error: { code: 'UNAUTHORIZED', message: 'Invalid session.' },
        });
      }

      const parsed = await parseBody(req);
      const payload = asRecord(parsed);

      const diagramText =
        (payload && typeof payload.diagramText === 'string' && payload.diagramText) ||
        (payload && typeof payload.diagram === 'string' && payload.diagram) ||
        (payload && typeof payload.text === 'string' && payload.text) ||
        null;

      if (typeof diagramText !== 'string') {
        return json(400, {
          ok: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Expected JSON body with { diagramText: string }.',
          },
        });
      }

      const creditsBefore = await ensureCreditsBalance(userId, runtimeEnv);
      if (creditsBefore < 1) {
        return json(402, {
          ok: false,
          error: {
            code: 'INSUFFICIENT_CREDITS',
            message: 'You do not have enough credits to run an AI fix.',
          },
          creditsCharged: false,
          creditsRemaining: creditsBefore,
        });
      }

      const result = await fixMermaidSyntaxWithXai(diagramText, {
        apiKey: env.OPENAPI_API_KEY,
        baseUrl: env.OPENAPI_BASE_URL,
        model: env.OPENAPI_MODEL,
      });

      const shouldCharge = Boolean(result.ok && result.fixedText);
      const creditsRemaining = shouldCharge
        ? await spendCredits(userId, 1, runtimeEnv)
        : creditsBefore;

      return json(200, { ...result, creditsCharged: shouldCharge, creditsRemaining });
    }

    // Default 404
    return json(404, {
      ok: false,
      error: { code: 'NOT_FOUND', message: 'Endpoint not found.' },
    });
  },
};
