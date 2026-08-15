import type { Metadata } from "next";
import Hero from "@/components/Hero";
import News from "@/components/News";
import FirstTeam from "@/components/FirstTeam";
import YouthFootball from "@/components/YouthFootball";
import Volunteer from "@/components/Volunteer";
import { buildPageMetadata } from "@/lib/metadata";
import { supabase, type Match, type Player, type VolunteerRole } from "@/lib/supabase";
import { sortMatchesByKickoff } from "@/lib/matchDate";
import { sortPlayersByNumber } from "@/lib/playerSort";
import { getCurrentSeason } from "@/lib/season";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Vanløse Idrætsforening",
  description:
    "Vanløse Idrætsforening - Siden 1921.",
  path: "/",
});

export default async function Home() {
  const currentSeason = await getCurrentSeason();
  const [{ data: matchData }, { data: playerData }, { data: settingsData }, { data: rolesData }, { data: teamsData }] =
    await Promise.all([
      supabase.from("matches").select("*").eq("is_upcoming", true).or(`season.eq.${currentSeason},season.is.null`),
      supabase.from("players").select("*").eq("status", "active"),
      supabase.from("site_settings").select("key, value").in("key", ["hero_image_url", "volunteer_image", "youth_image"]),
      supabase.from("volunteer_roles").select("*").order("display_order", { ascending: true }),
      supabase.from("teams").select("id, logo_url, abbreviation"),
    ]);

  const settingsMap = Object.fromEntries((settingsData ?? []).map((s) => [s.key, s.value]));
  const nextMatch = sortMatchesByKickoff((matchData ?? []) as Match[], "asc")[0] ?? null;
  const featuredPlayers = sortPlayersByNumber((playerData ?? []) as Player[], "asc").slice(0, 3);
  const heroImageUrl = settingsMap["hero_image_url"] || null;
  const volunteerImageUrl = settingsMap["volunteer_image"] || null;
  const youthImageUrl = settingsMap["youth_image"] || null;
  const volunteerRoles = (rolesData ?? []) as VolunteerRole[];
  const teamLogoMap = Object.fromEntries(
    (teamsData ?? []).map((t) => [t.id, t.logo_url as string | null])
  );
  const teamAbbreviationMap = Object.fromEntries(
    (teamsData ?? []).map((t) => [t.id, (t as { abbreviation?: string | null }).abbreviation ?? null])
  );

  return (
    <main>
      <Hero
        nextMatch={nextMatch}
        heroImageUrl={heroImageUrl}
        teamLogoMap={teamLogoMap}
        teamAbbreviationMap={teamAbbreviationMap}
      />
      <News />
      <FirstTeam players={featuredPlayers} />
      <YouthFootball imageUrl={youthImageUrl} />
      <Volunteer roles={volunteerRoles} imageUrl={volunteerImageUrl} />
    </main>
  );
}
