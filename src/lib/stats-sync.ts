import { supabaseAdmin } from "@/lib/supabase-admin";

type EventRow = { event_type: string; player_name: string | null; assist_name: string | null; match_id: string };

export async function syncPlayerStats(season: string): Promise<{ synced: number }> {
  // Finished matches for THIS season only. The events query used to have no
  // season filter at all, so every finished match ever played was counted into
  // whichever season was being synced.
  const { data: matchesRaw, error: matchesError } = await supabaseAdmin
    .from("matches")
    .select("id")
    .eq("season", season)
    .eq("status", "finished");

  if (matchesError) throw new Error(matchesError.message);
  const matchIds = ((matchesRaw ?? []) as { id: string }[]).map((m) => m.id);

  const { data: players, error: playersError } = await supabaseAdmin
    .from("players")
    .select("id, name");

  if (playersError) throw new Error(playersError.message);

  // Squad names are what separates our players from the opposition: both teams'
  // events and lineups live in the same tables, and opponent entries simply do
  // not match a row in `players`.
  const nameToId = new Map<string, string>();
  for (const p of (players ?? []) as { id: string; name: string }[]) {
    nameToId.set(p.name.toLowerCase().trim(), p.id);
  }
  const idFor = (name: string | null | undefined) =>
    name ? nameToId.get(name.toLowerCase().trim()) ?? null : null;

  type Totals = { goals: number; assists: number; yellow_cards: number; red_cards: number; appearances: number };
  const statsMap = new Map<string, Totals>();

  function getOrInit(playerId: string): Totals {
    if (!statsMap.has(playerId)) {
      statsMap.set(playerId, { goals: 0, assists: 0, yellow_cards: 0, red_cards: 0, appearances: 0 });
    }
    return statsMap.get(playerId)!;
  }

  if (matchIds.length > 0) {
    const { data: eventsRaw, error: eventsError } = await supabaseAdmin
      .from("match_events")
      .select("event_type, player_name, assist_name, match_id")
      .in("match_id", matchIds)
      .in("event_type", ["goal", "yellow_card", "red_card", "substitution"]);

    if (eventsError) throw new Error(eventsError.message);
    const events = (eventsRaw ?? []) as EventRow[];

    // Bench players only count as having played once they actually came on;
    // for a substitution, `player_name` is the player entering the pitch.
    const cameOn = new Set<string>();

    for (const ev of events) {
      if (ev.event_type === "goal") {
        const scorerId = idFor(ev.player_name);
        if (scorerId) getOrInit(scorerId).goals++;
        const assistId = idFor(ev.assist_name);
        if (assistId) getOrInit(assistId).assists++;
      } else if (ev.event_type === "yellow_card") {
        const pid = idFor(ev.player_name);
        if (pid) getOrInit(pid).yellow_cards++;
      } else if (ev.event_type === "red_card") {
        const pid = idFor(ev.player_name);
        if (pid) getOrInit(pid).red_cards++;
      } else if (ev.event_type === "substitution") {
        const pid = idFor(ev.player_name);
        if (pid) cameOn.add(`${ev.match_id}:${pid}`);
      }
    }

    // Appearances were never derived from anything, which is why the current
    // season showed goals against zero games played.
    const { data: lineupsRaw, error: lineupsError } = await supabaseAdmin
      .from("match_lineups")
      .select("match_id, starters, bench")
      .in("match_id", matchIds);

    if (lineupsError) throw new Error(lineupsError.message);

    type LineupEntry = { name?: string | null };
    const lineups = (lineupsRaw ?? []) as { match_id: string; starters: LineupEntry[] | null; bench: LineupEntry[] | null }[];

    // A player counts once per match however they got on.
    const played = new Set<string>();
    for (const lineup of lineups) {
      for (const entry of lineup.starters ?? []) {
        const pid = idFor(entry?.name);
        if (pid) played.add(`${lineup.match_id}:${pid}`);
      }
      for (const entry of lineup.bench ?? []) {
        const pid = idFor(entry?.name);
        if (pid && cameOn.has(`${lineup.match_id}:${pid}`)) {
          played.add(`${lineup.match_id}:${pid}`);
        }
      }
    }

    for (const key of played) {
      getOrInit(key.slice(key.indexOf(":") + 1)).appearances++;
    }
  }

  if (statsMap.size === 0) return { synced: 0 };

  // Seasons recorded by hand, before the club tracked matches here, have no
  // matches to derive from. Leaving `appearances` out of the payload keeps
  // those figures rather than resetting them to zero.
  const canDeriveAppearances = matchIds.length > 0;

  const upserts = Array.from(statsMap.entries()).map(([player_id, s]) => ({
    player_id,
    season,
    goals: s.goals,
    assists: s.assists,
    yellow_cards: s.yellow_cards,
    red_cards: s.red_cards,
    ...(canDeriveAppearances ? { appearances: s.appearances } : {}),
  }));

  const { error: upsertError } = await supabaseAdmin
    .from("player_stats")
    .upsert(upserts, { onConflict: "player_id,season", ignoreDuplicates: false });

  if (upsertError) throw new Error(upsertError.message);
  return { synced: upserts.length };
}

export async function syncPlayerStatsForCurrentSeason(): Promise<void> {
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "current_season")
    .single<{ value: string }>();
  const season = data?.value;
  if (!season) return;
  await syncPlayerStats(season);
}
