import "@/components/public-shell.css";
import Footer from "@/components/Footer";
import SiteShell from "@/components/SiteShell";
import { supabase, type Match } from "@/lib/supabase";
import { getMatchSortTimestamp } from "@/lib/matchDate";
import { selectHomeMatches } from "@/lib/home-matches";
import { getCurrentSeason } from "@/lib/season";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const dayFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Copenhagen" });
  const today = dayFormatter.format(new Date());
  const currentSeason = await getCurrentSeason();

  const { data: matchData } = await supabase
    .from("matches")
    .select("*")
    .in("status", ["scheduled", "live"])
    .or(`season.eq.${currentSeason},season.is.null`);

  const matches = (matchData ?? []) as Match[];

  const { next: nextMatch } = selectHomeMatches(matches);

  const nextKickoff = nextMatch ? getMatchSortTimestamp(nextMatch) : null;
  const todayOrLive = nextMatch && (
    nextMatch.status === "live" ||
    (nextKickoff !== null && dayFormatter.format(new Date(nextKickoff)) === today)
  ) ? nextMatch : null;

  const hasBanner = todayOrLive !== null;

  return (
    <SiteShell hasBanner={hasBanner} nextMatch={nextMatch} todayOrLive={todayOrLive}>
      {children}
      <Footer />
    </SiteShell>
  );
}
