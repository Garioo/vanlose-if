import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import { captureApiMessage } from "@/lib/observability";

export async function requireAdminApi(request: NextRequest): Promise<NextResponse | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const valid = token ? await verifyToken(token) : false;

  if (!valid) {
    captureApiMessage("admin_write_denied", "warning", {
      pathname: request.nextUrl.pathname,
      method: request.method,
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
