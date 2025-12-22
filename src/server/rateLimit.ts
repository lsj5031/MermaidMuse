interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const limits = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  identifier: string,
  endpoint: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; reset: number } {
  const key = `${identifier}:${endpoint}`;
  const now = Date.now();
  const entry = limits.get(key);

  if (!entry || entry.resetTime <= now) {
    // New window or expired
    const reset = now + windowMs;
    limits.set(key, { count: 1, resetTime: reset });
    return { allowed: true, remaining: limit - 1, reset };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, reset: entry.resetTime };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, reset: entry.resetTime };
}
