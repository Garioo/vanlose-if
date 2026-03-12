import { NextRequest, NextResponse } from "next/server";
import { signToken, COOKIE_NAME } from "@/lib/auth";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rate = isRateLimited(`admin-login:${ip}`, 10, 15 * 60 * 1000);
  if (rate.limited) {
    return NextResponse.json({ error: "For mange forsøg. Prøv igen senere." }, { status: 429 });
  }

  const { password } = await req.json();

  if (password !== process.env.ADMIN_PASSWORD) {
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
