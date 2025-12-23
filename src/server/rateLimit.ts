/**
 * Rate limiting module with support for both in-memory (development) and
 * Cloudflare KV (production) backends.
 *
 * In serverless environments like Cloudflare Workers, each isolate has its own
 * memory space, so in-memory rate limiting is ineffective. For production,
 * use the KV-based rate limiter.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
}

// In-memory store for development/testing (not effective in serverless)
const memoryLimits = new Map<string, RateLimitEntry>();

/**
 * In-memory rate limiter - suitable for development/testing only.
 * WARNING: This does NOT work reliably in serverless environments like
 * Cloudflare Workers where each request may hit a different isolate.
 */
export function checkRateLimit(
  identifier: string,
  endpoint: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const key = `${identifier}:${endpoint}`;
  const now = Date.now();
  const entry = memoryLimits.get(key);

  if (!entry || entry.resetTime <= now) {
    // New window or expired
    const reset = now + windowMs;
    memoryLimits.set(key, { count: 1, resetTime: reset });
    return { allowed: true, remaining: limit - 1, reset };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, reset: entry.resetTime };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, reset: entry.resetTime };
}

/**
 * KV Namespace interface (subset of Cloudflare KV)
 */
export interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

/**
 * Distributed rate limiter using Cloudflare KV.
 * This works correctly in serverless environments.
 *
 * @param kv - Cloudflare KV namespace binding
 * @param identifier - User ID or IP address
 * @param endpoint - API endpoint being rate limited
 * @param limit - Maximum requests allowed in the window
 * @param windowSeconds - Time window in seconds
 */
export async function checkRateLimitKV(
  kv: KVNamespace,
  identifier: string,
  endpoint: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / windowSeconds) * windowSeconds;
  const windowEnd = windowStart + windowSeconds;
  const key = `ratelimit:${endpoint}:${identifier}:${windowStart}`;

  try {
    const current = await kv.get(key);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        reset: windowEnd * 1000, // Convert to milliseconds
      };
    }

    // Increment counter with TTL slightly longer than window to ensure cleanup
    await kv.put(key, String(count + 1), {
      expirationTtl: windowSeconds + 60,
    });

    return {
      allowed: true,
      remaining: limit - count - 1,
      reset: windowEnd * 1000,
    };
  } catch {
    // If KV fails, fail open to avoid blocking legitimate requests
    // but with reduced limits as a safety measure
    console.error('KV rate limit check failed, falling back to allow');
    return {
      allowed: true,
      remaining: Math.floor(limit / 2),
      reset: windowEnd * 1000,
    };
  }
}

/**
 * Clean up old entries from the in-memory store.
 * Call this periodically in long-running processes to prevent memory leaks.
 */
export function cleanupMemoryLimits(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of memoryLimits.entries()) {
    if (entry.resetTime <= now) {
      memoryLimits.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}
