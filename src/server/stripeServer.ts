import { getRuntimeEnv, type RuntimeEnv } from './runtimeEnv';

export type StripeCheckoutSession = {
  id: string;
  url?: string | null;
  payment_status?: string;
  metadata?: Record<string, string>;
};

export type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: unknown;
  };
};

const STRIPE_API_BASE = 'https://api.stripe.com/v1';

export const DEFAULT_CREDITS_PACK = {
  credits: 100,
  // $10.00 + estimated fee coverage (~2.9% + $0.30)
  amountCents: 1061,
  currency: 'usd',
} as const;

const getStripeSecretKey = (envOverride?: RuntimeEnv): string | null => {
  const env = getRuntimeEnv(envOverride);
  return env.STRIPE_SECRET_KEY ?? null;
};

export function getStripeWebhookSecret(envOverride?: RuntimeEnv): string | null {
  const env = getRuntimeEnv(envOverride);
  return env.STRIPE_WEBHOOK_SECRET ?? null;
}

async function stripeFetch(
  path: string,
  init: RequestInit,
  envOverride?: RuntimeEnv
): Promise<Response> {
  const secretKey = getStripeSecretKey(envOverride);
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  return fetch(`${STRIPE_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...(init.headers ?? {}),
    },
  });
}

export async function createStripeCheckoutSession(
  params: {
    clerkUserId: string;
    successUrl: string;
    cancelUrl: string;
    credits?: number;
    amountCents?: number;
    currency?: string;
  },
  envOverride?: RuntimeEnv
): Promise<{ id: string; url: string } | null> {
  const credits = params.credits ?? DEFAULT_CREDITS_PACK.credits;
  const amountCents = params.amountCents ?? DEFAULT_CREDITS_PACK.amountCents;
  const currency = params.currency ?? DEFAULT_CREDITS_PACK.currency;

  const body = new URLSearchParams();
  body.set('mode', 'payment');
  body.set('success_url', params.successUrl);
  body.set('cancel_url', params.cancelUrl);
  body.set('client_reference_id', params.clerkUserId);
  body.set('metadata[clerkUserId]', params.clerkUserId);
  body.set('metadata[credits]', String(credits));

  body.set('line_items[0][quantity]', '1');
  body.set('line_items[0][price_data][currency]', currency);
  body.set('line_items[0][price_data][unit_amount]', String(amountCents));
  body.set('line_items[0][price_data][product_data][name]', `${credits} credits`);
  body.set(
    'line_items[0][price_data][product_data][description]',
    'AI fix credits for MermaidMuse'
  );

  const response = await stripeFetch(
    '/checkout/sessions',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    },
    envOverride
  );

  if (!response.ok) {
    return null;
  }

  const session = (await response.json()) as StripeCheckoutSession;
  if (
    !session ||
    typeof session.id !== 'string' ||
    typeof session.url !== 'string' ||
    !session.url
  ) {
    return null;
  }

  return { id: session.id, url: session.url };
}

export async function getStripeCheckoutSession(
  sessionId: string,
  envOverride?: RuntimeEnv
): Promise<StripeCheckoutSession | null> {
  const response = await stripeFetch(
    `/checkout/sessions/${encodeURIComponent(sessionId)}`,
    { method: 'GET' },
    envOverride
  );
  if (!response.ok) return null;

  const session = (await response.json()) as StripeCheckoutSession;
  if (!session || typeof session.id !== 'string') return null;

  return session;
}

const timingSafeEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false;

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
};

const toHex = (bytes: ArrayBuffer): string => {
  const arr = new Uint8Array(bytes);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

async function computeHmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return toHex(signature);
}

export async function verifyStripeWebhookSignature(
  rawBody: string,
  stripeSignatureHeader: string | null | undefined,
  webhookSecret: string
): Promise<boolean> {
  if (!stripeSignatureHeader) return false;

  const parts = stripeSignatureHeader.split(',').map((p) => p.trim());
  const timestampPart = parts.find((p) => p.startsWith('t='));
  const signaturePart = parts.find((p) => p.startsWith('v1='));

  const timestamp = timestampPart ? timestampPart.slice(2) : null;
  const signature = signaturePart ? signaturePart.slice(3) : null;

  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const computed = await computeHmacSha256Hex(webhookSecret, signedPayload);

  const sigBytes = new TextEncoder().encode(signature);
  const computedBytes = new TextEncoder().encode(computed);

  return timingSafeEqual(sigBytes, computedBytes);
}

export const asStripeEvent = (value: unknown): StripeEvent | null => {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.id !== 'string' || typeof record.type !== 'string') return null;

  const data = record.data;
  if (!data || typeof data !== 'object') return null;

  const dataRecord = data as Record<string, unknown>;
  if (!('object' in dataRecord)) return null;

  return record as StripeEvent;
};

export const asStripeCheckoutSession = (value: unknown): StripeCheckoutSession | null => {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.id !== 'string') return null;

  return record as StripeCheckoutSession;
};
