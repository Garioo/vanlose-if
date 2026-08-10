import { supabaseAdmin } from "./supabase-admin";

export function getClientIp(request: Request): string {
  // On Vercel, x-real-ip is set by the platform to the true client IP and cannot be
  // spoofed. Prefer it. Only if it is absent fall back to the RIGHTMOST x-forwarded-for
  // entry (the one appended by the proxy) — never the leftmost, which is client-supplied
  // and trivially spoofable to evade per-IP limits.
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor.split(",");
    return parts[parts.length - 1].trim();
  }
  return "unknown";
}

export async function isRateLimited(
  key: string,
  maxAttempts: number,
  windowMs: number,
  failClosed = false,
): Promise<{ limited: boolean; remaining: number; retryAfterMs: number }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabaseAdmin as any).rpc("rate_limit_increment", {
    p_key: key,
    p_window_ms: windowMs,
  }) as { data: Array<{ count: number; window_start: string }> | null; error: unknown };
  if (error || !data?.[0]) {
    // Store unavailable: we cannot count attempts. Sensitive callers (login) pass
    // failClosed=true to DENY rather than wave through an uncounted brute-force.
    if (failClosed) {
      return { limited: true, remaining: 0, retryAfterMs: windowMs };
    }
    // Low-stakes public forms fail OPEN so a DB blip never blocks a legitimate submission.
    return { limited: false, remaining: maxAttempts, retryAfterMs: 0 };
  }
  const { count, window_start } = data[0];
  const windowEnd = new Date(window_start).getTime() + windowMs;
  const retryAfterMs = Math.max(0, windowEnd - Date.now());
  const remaining = Math.max(0, maxAttempts - count);
  return { limited: count > maxAttempts, remaining, retryAfterMs };
}
