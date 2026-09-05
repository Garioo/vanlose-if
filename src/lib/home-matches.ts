import type { Match } from "@/lib/supabase";
import { getMatchSortTimestamp, sortMatchesByKickoff } from "@/lib/matchDate";

/** Never promote a past, unreported fixture as the next match. */
export function selectHomeMatches(matches: Match[], now = Date.now()) {
  const upcoming = sortMatchesByKickoff(matches.filter((match) => {
    const kickoff = getMatchSortTimestamp(match);
    return match.status === "scheduled" && kickoff !== null && kickoff >= now;
  }), "asc");
  return {
    next: matches.find((match) => match.status === "live") ?? upcoming[0] ?? null,
    latest: sortMatchesByKickoff(matches.filter((match) => match.status === "finished"), "desc")[0] ?? null,
  };
}
