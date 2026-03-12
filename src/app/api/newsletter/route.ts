import { NextRequest, NextResponse } from "next/server";
import { parseNewsletterSubscription } from "@/lib/form-submissions";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { captureApiError, captureApiMessage } from "@/lib/observability";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = isRateLimited(`newsletter:${ip}`, 8, 15 * 60 * 1000);
    if (rate.limited) {
      return NextResponse.json({ error: "For mange forsøg. Prøv igen senere." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = parseNewsletterSubscription(body);

    if (!parsed.ok) {
      if (parsed.error === "Spam detected") {
        captureApiMessage("newsletter_submit_spam", "warning", { ip });
      }
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { payload } = parsed;
    const { error } = await supabaseAdmin
      .from("newsletter_subscriptions")
      .upsert({ email: payload.email }, { onConflict: "email", ignoreDuplicates: true });

    if (error) {
      captureApiError(error, { route: "/api/newsletter" });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    captureApiError(error, { route: "/api/newsletter" });
    return NextResponse.json({ error: "Kunne ikke tilmelde nyhedsbrev." }, { status: 500 });
  }
}
