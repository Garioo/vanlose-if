import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { signToken, COOKIE_NAME } from "@/lib/auth";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";

export const maxRequestBodySize = 4096; // 4 KB

// Constant-time credential compare. Hashing to a fixed-length digest first keeps the
// timingSafeEqual buffers equal-length (it throws otherwise) and avoids leaking the
// password length through comparison timing.
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rate = await isRateLimited(`admin-login:${ip}`, 10, 15 * 60 * 1000, true);
  if (rate.limited) {
    return NextResponse.json({ error: "For mange forsøg. Prøv igen senere." }, { status: 429 });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const { password } = await req.json();

  if (!adminPassword || typeof password !== "string" || !safeEqual(password, adminPassword)) {
    return NextResponse.json({ error: "Kunne ikke logge ind." }, { status: 401 });
  }

  const token = await signToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
  return res;
}
