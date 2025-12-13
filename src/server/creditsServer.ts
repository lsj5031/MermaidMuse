import { getClerkUser, updateClerkUserPrivateMetadata, type ClerkUser } from './clerkServer';
import { type RuntimeEnv } from './runtimeEnv';

const FREE_SIGNUP_CREDITS = 10;
const REFERRAL_REWARD_CREDITS = 50;

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

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function ensureReferralCode(
  userId: string,
  envOverride?: RuntimeEnv
): Promise<string> {
  const user = await getClerkUser(userId, envOverride);
  if (!user) {
    throw new Error('Unable to load user');
  }

  const existing = user.private_metadata?.referralCode;
  if (typeof existing === 'string' && existing) {
    return existing;
  }

  const newCode = generateReferralCode();
  const ok = await updateClerkUserPrivateMetadata(
    userId,
    {
      ...(user.private_metadata ?? {}),
      referralCode: newCode,
    },
    envOverride
  );

  if (!ok) {
    throw new Error('Unable to create referral code');
  }

  return newCode;
}

export async function applyReferralCode(
  userId: string,
  referrerUserId: string,
  envOverride?: RuntimeEnv
): Promise<{ success: boolean; message: string; creditsBalance?: number }> {
  if (!referrerUserId || typeof referrerUserId !== 'string') {
    return { success: false, message: 'Invalid referrer' };
  }

  const user = await getClerkUser(userId, envOverride);
  if (!user) {
    return { success: false, message: 'Unable to load user' };
  }

  const alreadyReferred = user.private_metadata?.referredBy;
  if (alreadyReferred) {
    return {
      success: false,
      message: 'You have already used a referral code',
      creditsBalance: getCreditsFromUser(user) ?? FREE_SIGNUP_CREDITS,
    };
  }

  const referrerUser = await getClerkUser(referrerUserId, envOverride);
  if (!referrerUser) {
    return { success: false, message: 'Invalid referrer' };
  }

  if (userId === referrerUser.id) {
    return { success: false, message: 'You cannot refer yourself' };
  }

  const currentCredits = getCreditsFromUser(user) ?? FREE_SIGNUP_CREDITS;
  const newCredits = currentCredits + REFERRAL_REWARD_CREDITS;

  const okReferee = await updateClerkUserPrivateMetadata(
    userId,
    {
      ...(user.private_metadata ?? {}),
      referredBy: referrerUserId,
      creditsBalance: newCredits,
    },
    envOverride
  );

  if (!okReferee) {
    return { success: false, message: 'Unable to apply referral' };
  }

  const referrerCredits = getCreditsFromUser(referrerUser) ?? FREE_SIGNUP_CREDITS;
  const referrerCount =
    typeof referrerUser.private_metadata?.referralCount === 'number'
      ? referrerUser.private_metadata.referralCount
      : 0;

  await updateClerkUserPrivateMetadata(
    referrerUser.id,
    {
      ...(referrerUser.private_metadata ?? {}),
      creditsBalance: referrerCredits + REFERRAL_REWARD_CREDITS,
      referralCount: referrerCount + 1,
    },
    envOverride
  );

  return {
    success: true,
    message: `You and your referrer each received ${REFERRAL_REWARD_CREDITS} credits!`,
    creditsBalance: newCredits,
  };
}
