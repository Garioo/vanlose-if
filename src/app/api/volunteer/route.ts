import { NextRequest, NextResponse } from "next/server";
import { parseVolunteerSubmission } from "@/lib/form-submissions";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { captureApiError, captureApiMessage } from "@/lib/observability";
import { RATE_LIMIT_MAX_ATTEMPTS, RATE_LIMIT_WINDOW_MS } from "@/lib/constants";

export const maxRequestBodySize = 4096; // 4 KB

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = await isRateLimited(`volunteer:${ip}`, RATE_LIMIT_MAX_ATTEMPTS, RATE_LIMIT_WINDOW_MS);
    if (rate.limited) {
      return NextResponse.json({ error: "For mange forsøg. Prøv igen senere." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = parseVolunteerSubmission(body);

    if (!parsed.ok) {
      if (parsed.error === "Spam detected") {
        captureApiMessage("volunteer_submit_spam", "warning", { ip });
      }
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { payload } = parsed;
    const { error } = await supabaseAdmin.from("volunteer_submissions").insert({
      name: payload.name,
      email: payload.email,
      role: payload.role,
      status: "new",
    });

    if (error) {
      captureApiError(error, { route: "/api/volunteer" });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    captureApiError(error, { route: "/api/volunteer" });
    return NextResponse.json({ error: "Kunne ikke sende tilmelding." }, { status: 500 });
  }
}
