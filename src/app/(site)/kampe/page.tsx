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
  const [{ data: matchData }, { data: standingsData }] = await Promise.all([
    supabase.from("matches").select("*").order("kickoff_at", { ascending: true, nullsFirst: false }),
    supabase.from("standings").select("*").order("pos", { ascending: true }),
  ]);

  const matches: Match[] = matchData ?? [];
  const standings: Standing[] = standingsData ?? [];

  return (
    <div className="bg-white text-black min-h-screen pt-14">
      {/* Page header */}
      <section className="border-b border-gray-200 px-4 md:px-8 py-12 md:py-16 max-w-7xl mx-auto">
        <h1 className="font-display text-5xl md:text-7xl leading-[0.9] mb-3">KAMPPROGRAM</h1>
        <p className="text-sm text-gray-600">3. Division — Sæson 2025/26</p>
      </section>
      <KampeContent matches={matches} standings={standings} />
    </div>
  );
}
