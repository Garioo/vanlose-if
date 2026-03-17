import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MatchDayBanner from "@/components/MatchDayBanner";
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
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        {hasBanner && <MatchDayBanner match={todayOrLive} />}
        <Navbar nextMatch={nextMatch} />
      </div>
      <div className={hasBanner ? "pt-[6.5rem]" : "pt-16"}>
        {children}
      </div>
      <Footer />
    </>
  );
}
