import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminApi } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdminApi(req);
  if (unauthorized) return unauthorized;

  const { season } = await req.json();
  if (!season) return NextResponse.json({ error: "season is required" }, { status: 400 });

  type EventRow = { event_type: string; player_name: string | null; assist_name: string | null; match_id: string };

  // Fetch all finished match events joined with their match
  const { data: eventsRaw, error: eventsError } = await supabaseAdmin
    .from("match_events")
    .select("event_type, player_name, assist_name, match_id, matches!inner(status)")
    .in("event_type", ["goal", "yellow_card", "red_card"])
    .eq("matches.status", "finished");

  if (eventsError) return NextResponse.json({ error: eventsError.message }, { status: 500 });
  const events = (eventsRaw ?? []) as EventRow[];

  // Fetch all players
  const { data: players, error: playersError } = await supabaseAdmin
    .from("players")
    .select("id, name");

  if (playersError) return NextResponse.json({ error: playersError.message }, { status: 500 });

  // Build a name -> player_id map (case-insensitive)
  const nameToId = new Map<string, string>();
  for (const p of (players ?? []) as { id: string; name: string }[]) {
    nameToId.set(p.name.toLowerCase().trim(), p.id);
  }

  // Aggregate stats per player
  const statsMap = new Map<string, { goals: number; assists: number; yellow_cards: number; red_cards: number }>();

  function getOrInit(playerId: string) {
    if (!statsMap.has(playerId)) {
      statsMap.set(playerId, { goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 });
    }
    return statsMap.get(playerId)!;
  }

  for (const ev of events) {
    if (ev.event_type === "goal") {
      const scorerId = ev.player_name ? nameToId.get(ev.player_name.toLowerCase().trim()) : null;
      if (scorerId) getOrInit(scorerId).goals++;
      const assistId = ev.assist_name ? nameToId.get(ev.assist_name.toLowerCase().trim()) : null;
      if (assistId) getOrInit(assistId).assists++;
    } else if (ev.event_type === "yellow_card") {
      const pid = ev.player_name ? nameToId.get(ev.player_name.toLowerCase().trim()) : null;
      if (pid) getOrInit(pid).yellow_cards++;
    } else if (ev.event_type === "red_card") {
      const pid = ev.player_name ? nameToId.get(ev.player_name.toLowerCase().trim()) : null;
      if (pid) getOrInit(pid).red_cards++;
    }
  }

  if (statsMap.size === 0) {
    return NextResponse.json({ synced: 0 });
  }

  // Upsert stats (preserve appearances — manual only)
  const upserts = Array.from(statsMap.entries()).map(([player_id, s]) => ({
    player_id,
    season,
    goals: s.goals,
    assists: s.assists,
    yellow_cards: s.yellow_cards,
    red_cards: s.red_cards,
  }));

  const { error: upsertError } = await supabaseAdmin
    .from("player_stats")
    .upsert(upserts, { onConflict: "player_id,season", ignoreDuplicates: false });

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });

  return NextResponse.json({ synced: upserts.length });
}
