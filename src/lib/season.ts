import { supabaseAdmin } from "@/lib/supabase-admin";

export type StartSeasonResult = {
  season: string;
  standingsReset: number;
  statsSeeded: number;
};

/**
 * Roll the club over to a new season.
 *
 * - Sets the `current_season` site setting to the new value (drives the whole
 *   public site + which player_stats rows are shown).
 * - Resets every standings row to 0 and back to grundspil (`gruppe = 'regular'`),
 *   keeping the teams and their VIF `highlight` flag.
 * - Seeds a blank (0-value) player_stats row for every player for the new season,
 *   without overwriting any row that already exists.
 *
 * Matches and previous seasons' player_stats are intentionally left untouched.
 */
export async function startNewSeason(season: string): Promise<StartSeasonResult> {
  const trimmed = season.trim();
  if (!trimmed) throw new Error("season is required");

  // 1. Set the current season
  const { error: settingError } = await supabaseAdmin
    .from("site_settings")
    .upsert(
      { key: "current_season", value: trimmed, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
  if (settingError) throw new Error(settingError.message);

  // 2. Reset standings to 0 and back to grundspil (keep teams + highlight)
  const { data: resetRows, error: resetError } = await supabaseAdmin
    .from("standings")
    .update({
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goals_scored: 0,
      goals_conceded: 0,
      pts: 0,
      gruppe: "regular",
    })
    .not("id", "is", null)
    .select("id");
  if (resetError) throw new Error(resetError.message);

  // 3. Seed blank player_stats for every player for the new season
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
    standingsReset: (resetRows ?? []).length,
    statsSeeded,
  };
}
