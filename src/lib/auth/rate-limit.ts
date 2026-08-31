import { headers } from "next/headers";

type RateLimitOptions = {
  maxAttempts?: number;
  windowMs?: number;
};

type RateLimitEntry = {
  attempts: number[];
};

// Global in-memory store for rate limiting
const globalRateLimitStore = new Map<string, RateLimitEntry>();

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function getClientIp(): Promise<string> {
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    if (forwardedFor) {
      return forwardedFor.split(",")[0].trim();
    }
    const realIp = headersList.get("x-real-ip");
    if (realIp) {
      return realIp.trim();
    }
    const cfConnectingIp = headersList.get("cf-connecting-ip");
    if (cfConnectingIp) {
      return cfConnectingIp.trim();
    }
  } catch {
    // Outside request context or during build/tests
  }
  return "127.0.0.1";
}

function cleanExpiredAttempts(
  entry: RateLimitEntry,
  windowMs: number,
  now: number,
): void {
  const cutoff = now - windowMs;
  entry.attempts = entry.attempts.filter((timestamp) => timestamp > cutoff);
}

export function checkRateLimit(
  key: string,
  options?: RateLimitOptions,
): {
  allowed: boolean;
  retryAfterSeconds: number;
  remainingAttempts: number;
} {
  const maxAttempts = options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const now = Date.now();

  const entry = globalRateLimitStore.get(key);
  if (!entry) {
    return {
      allowed: true,
      retryAfterSeconds: 0,
      remainingAttempts: maxAttempts,
    };
  }

  cleanExpiredAttempts(entry, windowMs, now);

  if (entry.attempts.length >= maxAttempts) {
    const oldestAttempt = entry.attempts[0];
    const retryAfterMs = oldestAttempt + windowMs - now;
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));

    return {
      allowed: false,
      retryAfterSeconds,
      remainingAttempts: 0,
    };
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
    remainingAttempts: maxAttempts - entry.attempts.length,
  };
}

export function recordFailedAttempt(
  key: string,
  options?: RateLimitOptions,
): void {
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const now = Date.now();

  let entry = globalRateLimitStore.get(key);
  if (!entry) {
    entry = { attempts: [] };
    globalRateLimitStore.set(key, entry);
  }

  cleanExpiredAttempts(entry, windowMs, now);
  entry.attempts.push(now);
}

export function resetRateLimit(key: string): void {
  globalRateLimitStore.delete(key);
}
