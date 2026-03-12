import { NextRequest, NextResponse } from "next/server";
import { parseContactSubmission } from "@/lib/form-submissions";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { captureApiError, captureApiMessage } from "@/lib/observability";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = isRateLimited(`contact:${ip}`, 8, 15 * 60 * 1000);
    if (rate.limited) {
      return NextResponse.json({ error: "For mange forsøg. Prøv igen senere." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = parseContactSubmission(body);

    if (!parsed.ok) {
      if (parsed.error === "Spam detected") {
        captureApiMessage("contact_submit_spam", "warning", { ip });
      }
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { payload } = parsed;
    const { error } = await supabaseAdmin.from("contact_submissions").insert({
      name: payload.name,
      email: payload.email,
      subject: payload.subject,
      message: payload.message,
      status: "new",
    });

    if (error) {
      captureApiError(error, { route: "/api/contact" });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    captureApiError(error, { route: "/api/contact" });
    return NextResponse.json({ error: "Kunne ikke sende besked." }, { status: 500 });
  }
}
