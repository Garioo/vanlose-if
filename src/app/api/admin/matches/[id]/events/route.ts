import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { parseEventPayload } from "@/lib/matchday-payload";
import { captureApiError } from "@/lib/observability";
import { syncPlayerStatsForCurrentSeason } from "@/lib/stats-sync";

async function recalculateScore(matchId: string) {
  const { data: goals } = await supabaseAdmin
    .from("match_events")
    .select("team_side")
    .eq("match_id", matchId)
    .eq("event_type", "goal");

  const homeScore = goals?.filter((e) => e.team_side === "home").length ?? 0;
  const awayScore = goals?.filter((e) => e.team_side === "away").length ?? 0;

  await supabaseAdmin
    .from("matches")
    .update({ home_score: homeScore, away_score: awayScore })
    .eq("id", matchId);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const unauthorized = await requireAdminApi(req);
    if (unauthorized) return unauthorized;

    const { id } = await params;
    const body = await req.json();
    const parsed = parseEventPayload(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("match_events")
      .insert({ match_id: id, ...parsed.payload })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await recalculateScore(id);
    syncPlayerStatsForCurrentSeason().catch(() => {});

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    captureApiError(error, { route: "/api/admin/matches/[id]/events", method: "POST" });
    return NextResponse.json({ error: "Kunne ikke oprette event." }, { status: 500 });
  }
}
