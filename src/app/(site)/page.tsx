import type { Metadata } from "next";
import Hero from "@/components/Hero";
import News from "@/components/News";
import FirstTeam from "@/components/FirstTeam";
import YouthFootball from "@/components/YouthFootball";
import Volunteer from "@/components/Volunteer";
import Newsletter from "@/components/Newsletter";
import { buildPageMetadata } from "@/lib/metadata";
import { supabase, type Match, type Player } from "@/lib/supabase";
import { sortMatchesByKickoff } from "@/lib/matchDate";
import { sortPlayersByNumber } from "@/lib/playerSort";

export const metadata: Metadata = buildPageMetadata({
  title: "Vanløse IF - Københavns mest ambitiøse klub",
  description:
    "Vanløse IF - Stolthed & Passion. Oplev intensiteten på Vanløse Idrætspark. Siden 1921.",
  path: "/",
});

export default async function Home() {
  const [{ data: matchData }, { data: playerData }, { data: settingsData }] = await Promise.all([
    supabase.from("matches").select("*").eq("is_upcoming", true),
    supabase.from("players").select("*"),
    supabase.from("site_settings").select("*").eq("key", "hero_image_url").single(),
  ]);

  const nextMatch = sortMatchesByKickoff((matchData ?? []) as Match[], "asc")[0] ?? null;
  const featuredPlayers = sortPlayersByNumber((playerData ?? []) as Player[], "asc").slice(0, 3);
  const heroImageUrl = settingsData?.value ?? null;

  return (
    <main>
      <Hero nextMatch={nextMatch} heroImageUrl={heroImageUrl} />
      <News />
      <FirstTeam players={featuredPlayers} />
      <YouthFootball />
      <Volunteer />
      <Newsletter />
    </main>
  );
}
