import type { Metadata } from "next";
import BlivMedlemContent from "@/components/BlivMedlemContent";
import { buildPageMetadata } from "@/lib/metadata";
import { supabase } from "@/lib/supabase";
import type { MembershipTier } from "@/lib/supabase";

export const metadata: Metadata = buildPageMetadata({
  title: "Bliv Medlem — Vanløse IF",
  description: "Bliv medlem af Vanløse IF. Vælg mellem passivt, aktivt eller familiemedlemskab.",
  path: "/bliv-medlem",
});

export default async function BlivMedlemPage() {
  const { data } = await supabase
    .from("membership_tiers")
    .select("*")
    .order("display_order", { ascending: true });

  const tiers: MembershipTier[] = data ?? [];

  return (
    <div className="bg-[#f7f4ef] text-[#0d0d0b] min-h-screen pt-14">
      {/* Hero */}
      <section className="px-4 md:px-8 py-16 md:py-24 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">
            Siden 1921
          </p>
          <h1 className="font-display text-6xl md:text-8xl leading-[0.85] mb-6 max-w-2xl">
            BLIV MEDLEM
          </h1>
          <p className="text-sm text-gray-300 max-w-md leading-relaxed">
            Vanløse IF er båret af passionerede medlemmer. Uanset om du vil spille, støtte eller
            engagere dig — der er plads til dig i sort og hvid.
          </p>
        </div>
      </section>
      <BlivMedlemContent tiers={tiers} />
    </div>
  );
}
