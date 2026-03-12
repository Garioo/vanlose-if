type Entry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Entry>();

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function isRateLimited(
  key: string,
  maxAttempts: number,
  windowMs: number,
): { limited: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, remaining: maxAttempts - 1, retryAfterMs: windowMs };
  }

  current.count += 1;
  buckets.set(key, current);

  if (current.count > maxAttempts) {
    return {
      limited: true,
      remaining: 0,
      retryAfterMs: Math.max(0, current.resetAt - now),
    };
  }

  return {
    limited: false,
    remaining: maxAttempts - current.count,
    retryAfterMs: Math.max(0, current.resetAt - now),
  };
}
