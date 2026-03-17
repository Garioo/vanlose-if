import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { buildPageMetadata } from "@/lib/metadata";
import { supabase } from "@/lib/supabase";
import type { Sponsor, SponsorTier } from "@/lib/supabase";

export const metadata: Metadata = buildPageMetadata({
  title: "Sponsorer — Vanløse IF",
  description: "Vores partnere og sponsorer, der gør Vanløse IFs ambitioner mulige.",
  path: "/sponsorer",
});

const partnershipThemes = [
  {
    title: "Synlighed på kampdage",
    description: "Få en tydelig tilstedeværelse omkring klubbens hjemmekampe, events og lokale aktiviteter.",
  },
  {
    title: "Aktivering i lokalmiljøet",
    description: "Brug partnerskabet til at skabe relationer i Vanløse og resten af København.",
  },
  {
    title: "Fleksible samarbejder",
    description: "Vi tilpasser sponsorater efter virksomhedens mål, budget og ønskede engagement.",
  },
];

const TIER_ORDER: SponsorTier[] = ["guld", "sølv", "bronze"];
const TIER_LABELS: Record<SponsorTier, string> = { guld: "Guld", sølv: "Sølv", bronze: "Bronze" };

export default async function SponsorerPage() {
  const { data } = await supabase
    .from("sponsors")
    .select("*")
    .order("display_order", { ascending: true });

  const sponsors: Sponsor[] = data ?? [];

  const byTier = (tier: SponsorTier) => sponsors.filter((s) => s.tier === tier);

  return (
    <div className="bg-[#f7f4ef] text-[#0d0d0b] min-h-screen pt-14">
      {/* Hero */}
      <section className="border-b border-[#e0dbd3] px-4 md:px-8 py-12 md:py-16 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#8a847c] mb-4">
            Samarbejdspartnere
          </p>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.9] mb-3">VORES PARTNERE</h1>
          <p className="text-sm text-[#4a4540] max-w-md">
            Vanløse IFs ambitioner bliver mulige takket være vores trofaste sponsorer og partnere.
            Vi er stolte af hvert eneste samarbejde.
          </p>
        </div>
        <Link
          href="/kontakt"
          className="shrink-0 text-xs font-bold tracking-widest uppercase bg-black text-white px-6 py-4 hover:bg-gray-900 transition-colors self-start md:self-auto"
        >
          BLIV SPONSOR
        </Link>
      </section>

      {/* Sponsors by tier */}
      {sponsors.length > 0 && (
        <section className="py-16 md:py-20 px-4 md:px-8">
          <div className="max-w-7xl mx-auto space-y-16">
            {TIER_ORDER.map((tier) => {
              const tierSponsors = byTier(tier);
              if (tierSponsors.length === 0) return null;
              return (
                <div key={tier}>
                  <div className="flex items-center gap-4 mb-8">
                    <p className="text-[10px] font-bold tracking-widest uppercase text-[#8a847c]">
                      {TIER_LABELS[tier]} Partner
                    </p>
                    <div className="flex-1 h-px bg-[#e0dbd3]" />
                  </div>
                  <div className={`grid gap-6 ${tier === "guld" ? "grid-cols-2 md:grid-cols-3" : tier === "sølv" ? "grid-cols-3 md:grid-cols-4" : "grid-cols-4 md:grid-cols-6"}`}>
                    {tierSponsors.map((sponsor) => {
                      const card = (
                        <div className="border border-[#e0dbd3] p-6 flex items-center justify-center aspect-[3/2] bg-[#f7f4ef] hover:border-black transition-colors group">
                          {sponsor.logo_url ? (
                            <Image
                              src={sponsor.logo_url}
                              alt={sponsor.name}
                              width={200}
                              height={100}
                              className="object-contain max-h-16 w-auto grayscale group-hover:grayscale-0 transition-all"
                            />
                          ) : (
                            <span className="text-sm font-bold text-[#8a847c] text-center">{sponsor.name}</span>
                          )}
                        </div>
                      );
                      return sponsor.website_url ? (
                        <a key={sponsor.id} href={sponsor.website_url} target="_blank" rel="noopener noreferrer">
                          {card}
                        </a>
                      ) : (
                        <div key={sponsor.id}>{card}</div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Partnership themes */}
      <section className={`py-16 md:py-24 px-4 md:px-8 ${sponsors.length > 0 ? "border-t border-[#e0dbd3]" : ""}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {partnershipThemes.map((theme) => (
              <div key={theme.title} className="border border-[#e0dbd3] p-8 bg-[#f7f4ef]">
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#8a847c] mb-3">
                  Partnerskab
                </p>
                <h2 className="font-display text-3xl leading-[0.95] mb-4">{theme.title}</h2>
                <p className="text-sm text-[#4a4540] leading-relaxed">{theme.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 px-4 md:px-8 bg-[#141412] text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div>
            <h2 className="font-display text-3xl md:text-5xl leading-[0.9] mb-3">
              VIL DU VÆRE MED?
            </h2>
            <p className="text-sm text-[#8a847c] max-w-md leading-relaxed">
              Vi tager gerne en konkret dialog om, hvordan et partnerskab kan passe til jeres
              virksomhed og klubbens aktiviteter.
            </p>
          </div>
          <Link
            href="/kontakt"
            className="shrink-0 text-xs font-bold tracking-widest uppercase border border-white text-white px-8 py-4 hover:bg-white hover:text-black transition-colors"
          >
            KONTAKT OS OM SPONSORAT
          </Link>
        </div>
      </section>
    </div>
  );
}
