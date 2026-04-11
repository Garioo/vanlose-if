import Footer from "@/components/Footer";
import SiteShell from "@/components/SiteShell";
import { supabase, type Match } from "@/lib/supabase";
import { sortMatchesByKickoff } from "@/lib/matchDate";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const today = new Date().toISOString().split("T")[0];

  const { data: matchData } = await supabase
    .from("matches")
    .select("*")
    .in("status", ["scheduled", "live"]);

  const matches = (matchData ?? []) as Match[];

  const nextMatch = sortMatchesByKickoff(
    matches.filter((m) => m.status === "scheduled"),
    "asc"
  )[0] ?? null;

  const todayOrLive =
    matches.find((m) => {
      if (m.status === "live") return true;
      if (m.kickoff_at) return m.kickoff_at.startsWith(today);
      return false;
    }) ?? null;

  const hasBanner = todayOrLive !== null;

  return (
    <SiteShell hasBanner={hasBanner} nextMatch={nextMatch} todayOrLive={todayOrLive}>
      {children}
      <Footer />
    </SiteShell>
  );
}
