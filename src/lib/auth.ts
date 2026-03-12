import { SignJWT, jwtVerify } from "jose";

const secret = process.env.ADMIN_JWT_SECRET;
if (!secret) {
  throw new Error("Missing ADMIN_JWT_SECRET");
}

const SECRET = new TextEncoder().encode(secret);
const COOKIE_NAME = "admin_token";
const EXPIRES_IN = "24h";

export { COOKIE_NAME };

export async function signToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}
