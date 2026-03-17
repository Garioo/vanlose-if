import { supabaseAdmin } from "./supabase-admin";

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function isRateLimited(
  key: string,
  maxAttempts: number,
  windowMs: number,
): Promise<{ limited: boolean; remaining: number; retryAfterMs: number }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabaseAdmin as any).rpc("rate_limit_increment", {
    p_key: key,
    p_window_ms: windowMs,
  }) as { data: Array<{ count: number; window_start: string }> | null; error: unknown };
  if (error || !data?.[0]) {
    // Fail open: if rate limit table is unavailable, allow request
    return { limited: false, remaining: maxAttempts, retryAfterMs: 0 };
  }
  const { count, window_start } = data[0];
  const windowEnd = new Date(window_start).getTime() + windowMs;
  const retryAfterMs = Math.max(0, windowEnd - Date.now());
  const remaining = Math.max(0, maxAttempts - count);
  return { limited: count > maxAttempts, remaining, retryAfterMs };
}
