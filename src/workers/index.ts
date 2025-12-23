import { fixMermaidSyntaxWithXai } from '../server/xaiFix';
import { generateMermaidDiagram } from '../server/aiGenerate';
import { refineMermaidDiagram } from '../server/aiRefine';
import { analyzeMermaidDiagram } from '../server/aiAnalyze';
import { getBearerToken, getClerkUserIdFromSessionToken } from '../server/clerkServer';
import {
  addCreditsForPaidSession,
  ensureCreditsBalance,
  spendCredits,
  ensureReferralCode,
  applyReferralCode,
} from '../server/creditsServer';
import {
  asStripeCheckoutSession,
  asStripeEvent,
  createStripeCheckoutSession,
  DEFAULT_CREDITS_PACK,
  getStripeCheckoutSession,
  getStripeWebhookSecret,
  isValidRedirectUrl,
  isValidStripeSessionId,
  verifyStripeWebhookSignature,
} from '../server/stripeServer';
import { checkRateLimit, checkRateLimitKV, type KVNamespace } from '../server/rateLimit';
import { type RuntimeEnv } from '../server/runtimeEnv';

type CloudflareEnv = {
  OPENAPI_API_KEY?: string;
  OPENAPI_MODEL?: string;
  OPENAPI_BASE_URL?: string;
  CLERK_SECRET_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  RATE_LIMIT_KV?: KVNamespace; // Optional KV binding for distributed rate limiting
  ALLOWED_ORIGINS?: string; // Comma-separated list of allowed origins
};

// =============================================================================
// Security Constants
// =============================================================================

// Maximum input sizes to prevent abuse
const MAX_DIAGRAM_TEXT_LENGTH = 100000; // 100KB
const MAX_PROMPT_LENGTH = 10000; // 10KB
const MAX_INSTRUCTION_LENGTH = 5000; // 5KB

// Default allowed origins for CORS (can be overridden via env)
const DEFAULT_ALLOWED_ORIGINS = [
  'https://mermaid.liu.nz',
  'https://mermaid-muse.pages.dev',
  'https://dev.mermaid-muse.pages.dev',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

// =============================================================================
// Helper Functions
// =============================================================================

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
};

/**
 * Get the allowed CORS origin for the request.
 * Returns the origin if it's in the allowed list, otherwise returns the first allowed origin.
 */
const getCorsOrigin = (requestOrigin: string | null, env: CloudflareEnv): string => {
  const allowedOrigins = env.ALLOWED_ORIGINS
    ? env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : DEFAULT_ALLOWED_ORIGINS;

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  // For development, be more lenient with localhost and Pages previews
  if (
    requestOrigin &&
    (requestOrigin.startsWith('http://localhost:') ||
      requestOrigin.startsWith('http://127.0.0.1:') ||
      requestOrigin.endsWith('.mermaid-muse.pages.dev'))
  ) {
    return requestOrigin;
  }

  return allowedOrigins[0];
};

const baseJson = (
  status: number,
  body: unknown,
  extraHeaders?: Record<string, string>,
  corsOrigin: string = DEFAULT_ALLOWED_ORIGINS[0]
): Response => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      ...extraHeaders,
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

// Rate limit configurations per endpoint (limit per minute)
const RATE_LIMITS: Record<string, { limit: number; windowSeconds: number }> = {
  '/api/fix': { limit: 20, windowSeconds: 60 },
  '/api/generate': { limit: 10, windowSeconds: 60 },
  '/api/analyze': { limit: 15, windowSeconds: 60 },
  '/api/refine': { limit: 20, windowSeconds: 60 },
  '/api/stripe-create-checkout-session': { limit: 5, windowSeconds: 60 },
  '/api/stripe-fulfill-session': { limit: 10, windowSeconds: 60 },
};

const checkEndpointRateLimit = async (
  userId: string,
  endpoint: string,
  kv?: KVNamespace,
  corsOrigin?: string
): Promise<Response | null> => {
  const config = RATE_LIMITS[endpoint];
  if (!config) return null;

  // Use KV-based rate limiting if available (production), otherwise fall back to in-memory
  const result = kv
    ? await checkRateLimitKV(kv, userId, endpoint, config.limit, config.windowSeconds)
    : checkRateLimit(userId, endpoint, config.limit, config.windowSeconds * 1000);

  if (result.allowed) return null;

  return baseJson(
    429,
    {
      ok: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded. Please try again later.',
      },
    },
    {
      'X-RateLimit-Limit': config.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.reset.toString(),
    },
    corsOrigin
  );
};

export default {
  async fetch(req: Request, env: CloudflareEnv): Promise<Response> {
    // Get CORS origin for this request
    const requestOrigin = req.headers.get('Origin');
    const corsOrigin = getCorsOrigin(requestOrigin, env);

    // Wrapper to inject corsOrigin automatically
    const json = (status: number, body: unknown, extraHeaders?: Record<string, string>) =>
      baseJson(status, body, extraHeaders, corsOrigin);

    // Build CORS headers for this request
    const corsHeaders = {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    };

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

      const rateLimitResponse = await checkEndpointRateLimit(
        userId,
        '/api/stripe-create-checkout-session',
        env.RATE_LIMIT_KV,
        corsOrigin
      );
      if (rateLimitResponse) return rateLimitResponse;

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

      // Validate redirect URLs to prevent open redirect attacks
      if (!isValidRedirectUrl(successUrl) || !isValidRedirectUrl(cancelUrl)) {
        return json(400, {
          ok: false,
          error: {
            code: 'INVALID_REDIRECT_URL',
            message: 'Redirect URLs must be from allowed domains.',
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

      const rateLimitResponse = await checkEndpointRateLimit(
        userId,
        '/api/stripe-fulfill-session',
        env.RATE_LIMIT_KV,
        corsOrigin
      );
      if (rateLimitResponse) return rateLimitResponse;

      const parsed = await parseBody(req);
      const payload = asRecord(parsed);
      const sessionId = payload && typeof payload.sessionId === 'string' ? payload.sessionId : null;

      if (!sessionId) {
        return json(400, {
          ok: false,
          error: { code: 'BAD_REQUEST', message: 'Expected JSON body with { sessionId: string }.' },
        });
      }

      // Validate session ID format to prevent enumeration attacks
      if (!isValidStripeSessionId(sessionId)) {
        return json(400, {
          ok: false,
          error: { code: 'INVALID_SESSION_ID', message: 'Invalid session ID format.' },
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

      const rateLimitResponse = await checkEndpointRateLimit(
        userId,
        '/api/fix',
        env.RATE_LIMIT_KV,
        corsOrigin
      );
      if (rateLimitResponse) return rateLimitResponse;

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

      // Validate input length to prevent abuse
      if (diagramText.length > MAX_DIAGRAM_TEXT_LENGTH) {
        return json(400, {
          ok: false,
          error: {
            code: 'INPUT_TOO_LARGE',
            message: `Diagram text exceeds maximum length of ${MAX_DIAGRAM_TEXT_LENGTH} characters.`,
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

    // Route /api/generate
    if (pathname === '/api/generate') {
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

      const rateLimitResponse = await checkEndpointRateLimit(
        userId,
        '/api/generate',
        env.RATE_LIMIT_KV,
        corsOrigin
      );
      if (rateLimitResponse) return rateLimitResponse;

      const parsed = await parseBody(req);
      const payload = asRecord(parsed);
      const prompt = payload && typeof payload.prompt === 'string' ? payload.prompt : null;

      if (!prompt || !prompt.trim()) {
        return json(400, {
          ok: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Expected JSON body with { prompt: string }.',
          },
        });
      }

      // Validate input length to prevent abuse
      if (prompt.length > MAX_PROMPT_LENGTH) {
        return json(400, {
          ok: false,
          error: {
            code: 'INPUT_TOO_LARGE',
            message: `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters.`,
          },
        });
      }

      const GENERATION_COST = 2;
      const creditsBefore = await ensureCreditsBalance(userId, runtimeEnv);
      if (creditsBefore < GENERATION_COST) {
        return json(402, {
          ok: false,
          error: {
            code: 'INSUFFICIENT_CREDITS',
            message: `Generation requires ${GENERATION_COST} credits.`,
          },
          creditsCharged: false,
          creditsRemaining: creditsBefore,
        });
      }

      const diagramType =
        payload && typeof payload.diagramType === 'string' ? payload.diagramType : undefined;
      const style = payload && typeof payload.style === 'string' ? payload.style : undefined;

      const result = await generateMermaidDiagram(prompt, {
        apiKey: env.OPENAPI_API_KEY,
        baseUrl: env.OPENAPI_BASE_URL,
        model: env.OPENAPI_MODEL,
        diagramType,
        style,
      });

      const shouldCharge = Boolean(result.ok && result.generatedText);
      const creditsRemaining = shouldCharge
        ? await spendCredits(userId, GENERATION_COST, runtimeEnv)
        : creditsBefore;

      return json(200, { ...result, creditsCharged: shouldCharge, creditsRemaining });
    }

    // Route /api/analyze
    if (pathname === '/api/analyze') {
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

      const rateLimitResponse = await checkEndpointRateLimit(
        userId,
        '/api/analyze',
        env.RATE_LIMIT_KV,
        corsOrigin
      );
      if (rateLimitResponse) return rateLimitResponse;

      const parsed = await parseBody(req);
      const payload = asRecord(parsed);
      const diagramText =
        payload && typeof payload.diagramText === 'string' ? payload.diagramText : null;

      if (!diagramText || !diagramText.trim()) {
        return json(400, {
          ok: false,
          error: { code: 'BAD_REQUEST', message: 'Expected { diagramText: string }.' },
        });
      }

      // Validate input length to prevent abuse
      if (diagramText.length > MAX_DIAGRAM_TEXT_LENGTH) {
        return json(400, {
          ok: false,
          error: {
            code: 'INPUT_TOO_LARGE',
            message: `Diagram text exceeds maximum length of ${MAX_DIAGRAM_TEXT_LENGTH} characters.`,
          },
        });
      }

      const focusAreas = Array.isArray(payload?.focusAreas)
        ? payload.focusAreas.filter((v: unknown): v is string => typeof v === 'string')
        : undefined;

      const ANALYSIS_COST = 1;
      const creditsBefore = await ensureCreditsBalance(userId, runtimeEnv);
      if (creditsBefore < ANALYSIS_COST) {
        return json(402, {
          ok: false,
          error: {
            code: 'INSUFFICIENT_CREDITS',
            message: `Analysis requires ${ANALYSIS_COST} credit.`,
          },
          creditsCharged: false,
          creditsRemaining: creditsBefore,
        });
      }

      const result = await analyzeMermaidDiagram(diagramText, {
        apiKey: env.OPENAPI_API_KEY,
        baseUrl: env.OPENAPI_BASE_URL,
        model: env.OPENAPI_MODEL,
        focusAreas,
      });

      const shouldCharge = result.ok;
      const creditsRemaining = shouldCharge
        ? await spendCredits(userId, ANALYSIS_COST, runtimeEnv)
        : creditsBefore;

      return json(200, { ...result, creditsCharged: shouldCharge, creditsRemaining });
    }

    // Route /api/refine
    if (pathname === '/api/refine') {
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

      const rateLimitResponse = await checkEndpointRateLimit(
        userId,
        '/api/refine',
        env.RATE_LIMIT_KV,
        corsOrigin
      );
      if (rateLimitResponse) return rateLimitResponse;

      const parsed = await parseBody(req);
      const payload = asRecord(parsed);

      const diagramText =
        payload && typeof payload.diagramText === 'string' ? payload.diagramText : null;
      const instruction =
        payload && typeof payload.instruction === 'string' ? payload.instruction : null;

      if (!diagramText || !instruction?.trim()) {
        return json(400, {
          ok: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Expected { diagramText: string, instruction: string }.',
          },
        });
      }

      // Validate input lengths to prevent abuse
      if (diagramText.length > MAX_DIAGRAM_TEXT_LENGTH) {
        return json(400, {
          ok: false,
          error: {
            code: 'INPUT_TOO_LARGE',
            message: `Diagram text exceeds maximum length of ${MAX_DIAGRAM_TEXT_LENGTH} characters.`,
          },
        });
      }

      if (instruction.length > MAX_INSTRUCTION_LENGTH) {
        return json(400, {
          ok: false,
          error: {
            code: 'INPUT_TOO_LARGE',
            message: `Instruction exceeds maximum length of ${MAX_INSTRUCTION_LENGTH} characters.`,
          },
        });
      }

      const history = Array.isArray(payload?.history) ? payload.history : [];

      const REFINEMENT_COST = 1;
      const creditsBefore = await ensureCreditsBalance(userId, runtimeEnv);
      if (creditsBefore < REFINEMENT_COST) {
        return json(402, {
          ok: false,
          error: {
            code: 'INSUFFICIENT_CREDITS',
            message: `Refinement requires ${REFINEMENT_COST} credit.`,
          },
          creditsCharged: false,
          creditsRemaining: creditsBefore,
        });
      }

      const result = await refineMermaidDiagram(diagramText, instruction, {
        apiKey: env.OPENAPI_API_KEY,
        baseUrl: env.OPENAPI_BASE_URL,
        model: env.OPENAPI_MODEL,
        history,
      });

      const shouldCharge = Boolean(result.ok && result.refinedText);
      const creditsRemaining = shouldCharge
        ? await spendCredits(userId, REFINEMENT_COST, runtimeEnv)
        : creditsBefore;

      return json(200, { ...result, creditsCharged: shouldCharge, creditsRemaining });
    }

    // Route /api/referral-code
    if (pathname === '/api/referral-code') {
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

      const referralCode = await ensureReferralCode(userId, runtimeEnv);
      return json(200, { ok: true, referralCode, userId });
    }

    // Route /api/apply-referral
    if (pathname === '/api/apply-referral') {
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
      const referrerUserId =
        payload && typeof payload.referrerUserId === 'string' ? payload.referrerUserId : null;

      if (!referrerUserId) {
        return json(400, {
          ok: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Expected JSON body with { referrerUserId: string }.',
          },
        });
      }

      const result = await applyReferralCode(userId, referrerUserId, runtimeEnv);

      if (!result.success) {
        return json(400, {
          ok: false,
          error: { code: 'REFERRAL_ERROR', message: result.message },
        });
      }

      return json(200, {
        ok: true,
        message: result.message,
        creditsBalance: result.creditsBalance,
      });
    }

    // Default 404
    return json(404, {
      ok: false,
      error: { code: 'NOT_FOUND', message: 'Endpoint not found.' },
    });
  },
};
