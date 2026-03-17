import { NextRequest, NextResponse } from "next/server";
import { parseMembershipSubmission } from "@/lib/form-submissions";
import {
  buildMembershipFallbackMessage,
  buildMembershipFallbackSubject,
} from "@/lib/membership-submissions";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { captureApiError, captureApiMessage } from "@/lib/observability";
import { RATE_LIMIT_MAX_ATTEMPTS, RATE_LIMIT_WINDOW_MS } from "@/lib/constants";

export const maxRequestBodySize = 4096; // 4 KB

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = await isRateLimited(`membership:${ip}`, RATE_LIMIT_MAX_ATTEMPTS, RATE_LIMIT_WINDOW_MS);
    if (rate.limited) {
      return NextResponse.json({ error: "For mange forsøg. Prøv igen senere." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = parseMembershipSubmission(body);

    if (!parsed.ok) {
      if (parsed.error === "Spam detected") {
        captureApiMessage("membership_submit_spam", "warning", { ip });
      }
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { payload } = parsed;
    const membershipInsert = {
      name: payload.name,
      email: payload.email,
      phone: payload.phone || null,
      membership_tier: payload.membershipTier,
      status: "new",
    };
    const { error } = await supabaseAdmin.from("membership_submissions").insert(membershipInsert);

    if (error) {
      const fallback = await supabaseAdmin.from("contact_submissions").insert({
        name: payload.name,
        email: payload.email,
        subject: buildMembershipFallbackSubject(payload.membershipTier),
        message: buildMembershipFallbackMessage(payload.phone),
        status: "new",
      });

      if (fallback.error) {
        captureApiError(fallback.error, {
          route: "/api/membership",
          fallback: "contact_submissions",
          originalError: error.message,
        });
        return NextResponse.json({ error: fallback.error.message || error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    captureApiError(error, { route: "/api/membership" });
    return NextResponse.json({ error: "Kunne ikke sende medlemsanmodning." }, { status: 500 });
  }
}
