import type { Match } from "@/lib/supabase";

export type TeamOutcome = "win" | "loss" | "draw" | "unknown";

export function normalizeTeamName(name: string): string {
  return name.trim().toLocaleLowerCase("da-DK");
}

export function isVanlose(name: string): boolean {
  return normalizeTeamName(name) === "vanløse if";
}

export function getTeamOutcome(
  match: Pick<Match, "home_score" | "away_score">,
  side: "home" | "away",
): TeamOutcome {
  const home = match.home_score;
  const away = match.away_score;
  if (home == null || away == null) return "unknown";
  if (home === away) return "draw";
  if (side === "home") return home > away ? "win" : "loss";
  return away > home ? "win" : "loss";
}
