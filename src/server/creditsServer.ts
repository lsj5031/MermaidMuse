import { getClerkUser, updateClerkUserPrivateMetadata, type ClerkUser } from './clerkServer';
import { type RuntimeEnv } from './runtimeEnv';

const FREE_SIGNUP_CREDITS = 10;

const getCreditsFromUser = (user: ClerkUser): number | null => {
  const raw = user.private_metadata?.creditsBalance;
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return null;
  return raw;
};

export async function ensureCreditsBalance(
  userId: string,
  envOverride?: RuntimeEnv
): Promise<number> {
  const user = await getClerkUser(userId, envOverride);
  if (!user) {
    throw new Error('Unable to load user');
  }

  const existing = getCreditsFromUser(user);
  if (existing !== null) return existing;

  const ok = await updateClerkUserPrivateMetadata(
    userId,
    {
      ...(user.private_metadata ?? {}),
      creditsBalance: FREE_SIGNUP_CREDITS,
      creditsInitializedAt: new Date().toISOString(),
    },
    envOverride
  );

  if (!ok) {
    throw new Error('Unable to initialize credits');
  }

  return FREE_SIGNUP_CREDITS;
}

export async function spendCredits(
  userId: string,
  amount: number,
  envOverride?: RuntimeEnv
): Promise<number> {
  if (amount <= 0) return ensureCreditsBalance(userId, envOverride);

  const user = await getClerkUser(userId, envOverride);
  if (!user) throw new Error('Unable to load user');

  const existing = getCreditsFromUser(user) ?? FREE_SIGNUP_CREDITS;
  const next = Math.max(0, existing - amount);

  const ok = await updateClerkUserPrivateMetadata(
    userId,
    {
      ...(user.private_metadata ?? {}),
      creditsBalance: next,
    },
    envOverride
  );

  if (!ok) throw new Error('Unable to update credits');

  return next;
}

type StripeTracking = {
  stripeCheckoutSessionIds?: string[];
};

const getStripeTracking = (user: ClerkUser): StripeTracking => {
  const raw = user.private_metadata?.stripeCheckoutSessionIds;
  return {
    stripeCheckoutSessionIds: Array.isArray(raw)
      ? raw.filter((v) => typeof v === 'string')
      : undefined,
  };
};

export async function addCreditsForPaidSession(
  userId: string,
  sessionId: string,
  creditsToAdd: number,
  envOverride?: RuntimeEnv
): Promise<{ creditsBalance: number; alreadyProcessed: boolean }> {
  if (!sessionId) throw new Error('Missing session id');
  if (creditsToAdd <= 0) {
    return {
      creditsBalance: await ensureCreditsBalance(userId, envOverride),
      alreadyProcessed: false,
    };
  }

  const user = await getClerkUser(userId, envOverride);
  if (!user) throw new Error('Unable to load user');

  const existing = getCreditsFromUser(user) ?? FREE_SIGNUP_CREDITS;
  const tracking = getStripeTracking(user);

  const processed = tracking.stripeCheckoutSessionIds ?? [];
  if (processed.includes(sessionId)) {
    return { creditsBalance: existing, alreadyProcessed: true };
  }

  const next = existing + creditsToAdd;
  const nextProcessed = [sessionId, ...processed].slice(0, 25);

  const ok = await updateClerkUserPrivateMetadata(
    userId,
    {
      ...(user.private_metadata ?? {}),
      creditsBalance: next,
      stripeCheckoutSessionIds: nextProcessed,
    },
    envOverride
  );

  if (!ok) throw new Error('Unable to add credits');

  return { creditsBalance: next, alreadyProcessed: false };
}
