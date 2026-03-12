import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { parseLiveActionPayload } from "@/lib/matchday-payload";
import { captureApiError } from "@/lib/observability";
import { getLiveClockMinute, getLiveClockSeconds, withDerivedLiveMinute } from "@/lib/live-clock";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const unauthorized = await requireAdminApi(req);
    if (unauthorized) return unauthorized;

    const { id } = await params;
    const body = await req.json();
    const parsed = parseLiveActionPayload(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { data: current, error: fetchError } = await supabaseAdmin
      .from("matches")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const nowIso = new Date().toISOString();
    const nowMs = Date.now();
    const secondsNow = getLiveClockSeconds(current, nowMs);
    const minuteNow = getLiveClockMinute(current, nowMs) ?? 0;

    const updates: Record<string, unknown> = {};
    const {
      action,
      matchday_notes: matchdayNotes,
      has_matchday_notes: hasMatchdayNotes,
      period_label: periodLabel,
      has_period_label: hasPeriodLabel,
    } = parsed.payload;

    if (action === "start") {
      updates.status = "live";
      updates.is_upcoming = true;
      updates.live_phase = "first_half";
      updates.live_clock_running = true;
      updates.live_clock_started_at = nowIso;
      updates.live_clock_accumulated_seconds = 0;
      updates.live_minute = 0;
      updates.period_label = periodLabel ?? "1. halvleg";
    } else if (action === "pause") {
      updates.status = "live";
      updates.is_upcoming = true;
      updates.live_phase = "halftime";
      updates.live_clock_running = false;
      updates.live_clock_started_at = null;
      updates.live_clock_accumulated_seconds = secondsNow;
      updates.live_minute = minuteNow;
      updates.period_label = periodLabel ?? "Pause";
    } else if (action === "resume_second_half") {
      const secondHalfBase = Math.max(secondsNow, 45 * 60);
      updates.status = "live";
      updates.is_upcoming = true;
      updates.live_phase = "second_half";
      updates.live_clock_running = true;
      updates.live_clock_started_at = nowIso;
      updates.live_clock_accumulated_seconds = secondHalfBase;
      updates.live_minute = Math.floor(secondHalfBase / 60);
      updates.period_label = periodLabel ?? "2. halvleg";
    } else if (action === "finish") {
      updates.status = "finished";
      updates.is_upcoming = false;
      updates.live_phase = "fulltime";
      updates.live_clock_running = false;
      updates.live_clock_started_at = null;
      updates.live_clock_accumulated_seconds = secondsNow;
      updates.live_minute = minuteNow;
      updates.period_label = periodLabel ?? "SLUT";
    } else if (action === "set_note") {
      if (hasPeriodLabel) {
        updates.period_label = periodLabel;
      }
    }

    if (hasMatchdayNotes) {
      updates.matchday_notes = matchdayNotes;
    }

    const { data, error } = await supabaseAdmin
      .from("matches")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(withDerivedLiveMinute(data));
  } catch (error) {
    captureApiError(error, { route: "/api/admin/matches/[id]/live", method: "PUT" });
    return NextResponse.json({ error: "Kunne ikke opdatere live-status." }, { status: 500 });
  }
}
