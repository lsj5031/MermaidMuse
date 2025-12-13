import { getRuntimeEnv, type RuntimeEnv } from './runtimeEnv';

export type ClerkSession = {
  id: string;
  status: string;
  user_id: string;
};

export type ClerkUser = {
  id: string;
  private_metadata?: Record<string, unknown>;
};

const base64UrlDecode = (input: string): string => {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');

  const atobFn = (globalThis as unknown as { atob?: (value: string) => string }).atob;
  if (typeof atobFn === 'function') {
    const binary = atobFn(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  const buffer =
    (
      globalThis as unknown as {
        Buffer?: {
          from: (value: string, encoding: string) => { toString: (encoding: string) => string };
        };
      }
    ).Buffer ?? null;

  if (!buffer) {
    throw new Error('No base64 decoder available');
  }

  const binary = buffer.from(padded, 'base64').toString('binary');

  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

export const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const json = base64UrlDecode(parts[1]);
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
};

export function getBearerToken(authorizationHeader: string | null | undefined): string | null {
  if (!authorizationHeader) return null;

  const [scheme, value] = authorizationHeader.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !value) return null;
  return value.trim();
}

export function getClerkSecretKey(envOverride?: RuntimeEnv): string | null {
  const env = getRuntimeEnv(envOverride);
  const secret = env.CLERK_SECRET_KEY;
  if (!secret) return null;
  return secret;
}

async function clerkFetch(
  path: string,
  init: RequestInit,
  envOverride?: RuntimeEnv
): Promise<Response> {
  const secretKey = getClerkSecretKey(envOverride);
  if (!secretKey) {
    throw new Error('CLERK_SECRET_KEY is not configured');
  }

  return fetch(`https://api.clerk.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

export async function getClerkUserIdFromSessionToken(
  sessionToken: string,
  envOverride?: RuntimeEnv
): Promise<string | null> {
  const payload = decodeJwtPayload(sessionToken);
  const sessionId = payload && typeof payload.sid === 'string' ? payload.sid : null;

  if (!sessionId) {
    return null;
  }

  const response = await clerkFetch(`/sessions/${sessionId}`, { method: 'GET' }, envOverride);

  if (!response.ok) {
    return null;
  }

  const session = (await response.json()) as ClerkSession;
  if (!session || typeof session.user_id !== 'string') return null;

  if (session.status !== 'active') return null;

  return session.user_id;
}

export async function getClerkUser(
  userId: string,
  envOverride?: RuntimeEnv
): Promise<ClerkUser | null> {
  const response = await clerkFetch(`/users/${userId}`, { method: 'GET' }, envOverride);
  if (!response.ok) return null;

  const user = (await response.json()) as ClerkUser;
  if (!user || typeof user.id !== 'string') return null;

  return user;
}

export async function updateClerkUserPrivateMetadata(
  userId: string,
  privateMetadata: Record<string, unknown>,
  envOverride?: RuntimeEnv
): Promise<boolean> {
  const response = await clerkFetch(
    `/users/${userId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ private_metadata: privateMetadata }),
    },
    envOverride
  );

  return response.ok;
}
