import type { Metadata } from "next";
import KampeContent from "@/components/KampeContent";
import { supabase } from "@/lib/supabase";
import type { Match, Standing } from "@/lib/supabase";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Kampprogram — Vanløse IF",
  description: "Se Vanløse IFs kampprogram, resultater og stilling i 3. Division.",
  path: "/kampe",
});

export default async function KampePage() {
  const [{ data: matchData }, { data: standingsData }, { data: settingsData }] = await Promise.all([
    supabase.from("matches").select("*").order("kickoff_at", { ascending: true, nullsFirst: false }),
    supabase.from("standings").select("*").order("pos", { ascending: true }),
    supabase.from("site_settings").select("key, value"),
  ]);

  const matches: Match[] = matchData ?? [];
  const standings: Standing[] = standingsData ?? [];
  const settingsMap = Object.fromEntries((settingsData ?? []).map((s) => [s.key, s.value]));
  const currentSeason = settingsMap["current_season"] ?? "2025/26";

  return (
    <div className="bg-[#f7f4ef] text-[#0d0d0b] min-h-screen pt-14">
      {/* Page header */}
      <section className="mx-auto max-w-7xl border-b border-[#e0dbd3] bg-gradient-to-b from-[#f7f4ef] to-[#edeae3]/60 px-4 py-12 md:px-8 md:py-16">
        <h1 className="mb-3 font-display text-5xl leading-[0.9] tracking-tight md:text-7xl">
          KAMPPROGRAM
        </h1>
        <p className="text-sm text-[#4a4540]">3. Division — Sæson {currentSeason}</p>
      </section>
      <KampeContent matches={matches} standings={standings} />
    </div>
  );
}
