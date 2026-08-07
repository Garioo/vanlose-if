import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentSeason } from "@/lib/season";

// GET — list every season that has data, newest first, with the current season flagged.
// Used to populate the admin season selectors (archive access).
export async function GET() {
  const currentSeason = await getCurrentSeason();

  const [{ data: matchSeasons }, { data: standingSeasons }] = await Promise.all([
    supabase.from("matches").select("season"),
    supabase.from("standings").select("season"),
  ]);

  const seasons = new Set<string>([currentSeason]);
  for (const row of [...(matchSeasons ?? []), ...(standingSeasons ?? [])]) {
    const value = (row as { season: string | null }).season?.trim();
    if (value) seasons.add(value);
  }

  // Sort descending so the newest season comes first (string sort works for YYYY/YY).
  const sorted = [...seasons].sort((a, b) => b.localeCompare(a));

  return NextResponse.json({ current: currentSeason, seasons: sorted });
}
