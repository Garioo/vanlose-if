import { supabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";

/** Fallback used only if the `current_season` setting is somehow missing. */
export const DEFAULT_SEASON = "2025/26";

/**
 * Read the active season from `site_settings.current_season`.
 * Uses the anon client so it works in public Server Components and API routes alike
 * (site_settings is publicly readable).
 */
export async function getCurrentSeason(): Promise<string> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "current_season")
    .maybeSingle<{ value: string }>();
  return data?.value?.trim() || DEFAULT_SEASON;
}

export type StartSeasonResult = {
  season: string;
  /** Number of fresh, zeroed standings rows created for the new season. */
  standingsReset: number;
  statsSeeded: number;
};

/**
 * Roll the club over to a new season — non-destructive / archiving.
 *
 * - Archives the outgoing season by tagging any legacy null-season matches and
 *   standings with the season they belonged to, so their final tables survive.
 * - Creates a FRESH, zeroed standings set for the new season (carrying over the
 *   teams + VIF `highlight` flag) instead of wiping the previous table.
 * - Sets the `current_season` site setting (drives the public site + player_stats).
 * - Seeds a blank (0-value) player_stats row for every player for the new season,
 *   without overwriting any row that already exists.
 *
 * Previous seasons' matches, standings and player_stats are all preserved.
 */
export async function startNewSeason(season: string): Promise<StartSeasonResult> {
  const trimmed = season.trim();
  if (!trimmed) throw new Error("season is required");

  // Capture the outgoing season BEFORE changing the setting, so its data can be
  // archived under its own name.
  const previousSeason = await getCurrentSeason();
  const isNewSeason = previousSeason !== trimmed;

  let standingsCreated = 0;

  if (isNewSeason) {
    // 1. Archive legacy (null-season) rows under the outgoing season.
    const { error: tagStandingsError } = await supabaseAdmin
      .from("standings")
      .update({ season: previousSeason })
      .is("season", null);
    if (tagStandingsError) throw new Error(tagStandingsError.message);

    const { error: tagMatchesError } = await supabaseAdmin
      .from("matches")
      .update({ season: previousSeason })
      .is("season", null);
    if (tagMatchesError) throw new Error(tagMatchesError.message);

    // 2. Read the outgoing season's teams to seed a fresh, zeroed table.
    const { data: prevStandings, error: prevError } = await supabaseAdmin
      .from("standings")
      .select("team, team_id, highlight")
      .eq("season", previousSeason)
      .order("pos", { ascending: true });
    if (prevError) throw new Error(prevError.message);

    // 3. Only seed if the new season doesn't already have a table.
    const { data: existingNew, error: existingError } = await supabaseAdmin
      .from("standings")
      .select("id")
      .eq("season", trimmed)
      .limit(1);
    if (existingError) throw new Error(existingError.message);

    const teams = (prevStandings ?? []) as { team: string; team_id: string | null; highlight: boolean }[];
    if ((existingNew ?? []).length === 0 && teams.length > 0) {
      const fresh = teams.map((t, i) => ({
        pos: i + 1,
        team: t.team,
        team_id: t.team_id,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_scored: 0,
        goals_conceded: 0,
        pts: 0,
        highlight: t.highlight,
        gruppe: "regular",
        season: trimmed,
      }));
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("standings")
        .insert(fresh)
        .select("id");
      if (insertError) throw new Error(insertError.message);
      standingsCreated = (inserted ?? []).length;
    }
  }

  // 4. Set the current season.
  const { error: settingError } = await supabaseAdmin
    .from("site_settings")
    .upsert(
      { key: "current_season", value: trimmed, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
  if (settingError) throw new Error(settingError.message);

  // 5. Seed blank player_stats for every player for the new season
  const { data: players, error: playersError } = await supabaseAdmin
    .from("players")
    .select("id");
  if (playersError) throw new Error(playersError.message);

  let statsSeeded = 0;
  const playerRows = (players ?? []) as { id: string }[];
  if (playerRows.length > 0) {
    const seed = playerRows.map((p) => ({
      player_id: p.id,
      season: trimmed,
      goals: 0,
      assists: 0,
      appearances: 0,
      yellow_cards: 0,
      red_cards: 0,
    }));
    const { error: seedError } = await supabaseAdmin
      .from("player_stats")
      .upsert(seed, { onConflict: "player_id,season", ignoreDuplicates: true });
    if (seedError) throw new Error(seedError.message);
    statsSeeded = seed.length;
  }

  return {
    season: trimmed,
    standingsReset: standingsCreated,
    statsSeeded,
  };
}
