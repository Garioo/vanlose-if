import type { Metadata } from "next";
import ClubHome from "@/components/ClubHome";
import { buildPageMetadata } from "@/lib/metadata";
import { supabase, type Match, type Player, type Article, type Sponsor } from "@/lib/supabase";
import { sortPlayersByNumber } from "@/lib/playerSort";
import { getCurrentSeason } from "@/lib/season";
import { selectHomeMatches } from "@/lib/home-matches";

export const revalidate = 60;
export const metadata: Metadata = buildPageMetadata({
  title: "Vanløse Idrætsforening",
  description: "Vanløse IF. Kampe, hold og klubnyt fra Vanløse Idrætspark.",
  path: "/",
});

export default async function Home() {
  const season = await getCurrentSeason();
  const [matches, players, settings, teams, articles, sponsors] = await Promise.all([
    supabase.from("matches").select("*").or(`season.eq.${season},season.is.null`),
    supabase.from("players").select("*").eq("status", "active"),
    supabase.from("site_settings").select("key, value").in("key", ["hero_image_url", "youth_image"]),
    supabase.from("teams").select("id, logo_url"),
    supabase.from("articles").select("id, slug, title, excerpt, image_url, category, date").order("created_at", { ascending: false }).limit(3),
    supabase.from("sponsors").select("*").order("display_order", { ascending: true }).limit(8),
  ]);
  const images = Object.fromEntries((settings.data ?? []).map((s) => [s.key, s.value]));
  const { next, latest } = selectHomeMatches((matches.data ?? []) as Match[]);
  return <ClubHome
    nextMatch={next}
    latestMatch={latest}
    heroImage={images.hero_image_url || null}
    youthImage={images.youth_image || null}
    logoMap={Object.fromEntries((teams.data ?? []).map((t) => [t.id, t.logo_url]))}
    players={sortPlayersByNumber((players.data ?? []) as Player[], "asc").slice(0, 3)}
    articles={(articles.data ?? []) as Pick<Article, "id" | "slug" | "title" | "excerpt" | "image_url" | "category" | "date">[]}
    sponsors={(sponsors.data ?? []) as Sponsor[]}
  />;
}
