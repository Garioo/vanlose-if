import type { Metadata } from "next";
import { Suspense } from "react";
import HeroEnterWrapper from "@/components/HeroEnterWrapper";
import SiteImage from "@/components/SiteImage";
import { supabase } from "@/lib/supabase";
import { buildPageMetadata } from "@/lib/metadata";
import SeasonSections from "./SeasonSections";
import Squad from "./Squad";
import { SeasonSectionsSkeleton, SquadSkeleton } from "./skeletons";

// Trup, resultater og stilling ændrer sig sjældent mellem kampe. Siden genopbygges højst hvert 120. sekund i stedet for ved
// hver eneste anmodning; live-resultater ligger i kampcenteret, som stadig
// er dynamisk.
export const revalidate = 120;

export const metadata: Metadata = buildPageMetadata({
  title: "Førsteholdet — Vanløse IF",
  description: "Mød Vanløse IFs førstehold, se resultater og stillingen i 3. Division.",
  path: "/forsteholdet",
});

export default async function ForsteholdetPage() {
  // Only the hero image is needed to paint the first screen; the results,
  // standings, statistics and squad queries stream in behind their skeletons.
  const { data: settingsData } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["forsteholdet_hero_image"]);
  const heroImage = (settingsData ?? []).find((row) => row.key === "forsteholdet_hero_image")?.value;

  return (
    <div className="bg-[#f7f4ef] text-[#0d0d0b] min-h-screen">
      <section id="profil" className="pt-14 min-h-screen flex items-end relative overflow-hidden bg-black text-white">
        {heroImage && (
          <SiteImage src={heroImage} alt="" aria-hidden width={1600} sizes="100vw" priority className="object-cover" />
        )}
        <div className="absolute inset-0 bg-linear-to-b from-black/40 to-black" />
        <div
          className="absolute inset-x-0 bottom-0 font-display text-[20vw] leading-none text-white/5 select-none overflow-hidden whitespace-nowrap"
          aria-hidden
        >
          VIF
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 pb-12 md:pb-16">
          <HeroEnterWrapper>
            <p className="hero-badge text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">
              Førsteholdet
            </p>
            <h1 className="hero-title font-display text-6xl md:text-8xl lg:text-9xl leading-[0.85] mb-8">
              KLAR TIL
              <br />
              <span className="text-gray-400">KAMPDAG</span>
            </h1>
            <div className="hero-body max-w-2xl text-sm text-gray-300 leading-relaxed">
              Her finder du den aktuelle trup, de seneste resultater og stillingen omkring Vanløse IFs
              førstehold. Kampdata opdateres løbende i takt med sæsonen.
            </div>
          </HeroEnterWrapper>
        </div>
      </section>

      <Suspense fallback={<SeasonSectionsSkeleton />}>
        <SeasonSections />
      </Suspense>

      <Suspense fallback={<SquadSkeleton />}>
        <Squad />
      </Suspense>
    </div>
  );
}
