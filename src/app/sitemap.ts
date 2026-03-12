import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";
import { toAbsoluteUrl } from "@/lib/metadata";

const STATIC_ROUTES = [
  "/",
  "/nyheder",
  "/kampe",
  "/forsteholdet",
  "/ungdom",
  "/frivillig",
  "/kontakt",
  "/bliv-medlem",
  "/sponsorer",
  "/klubben",
  "/privatlivspolitik",
  "/cookiepolitik",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fallbackDate = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: toAbsoluteUrl(path),
    lastModified: fallbackDate,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));

  const [{ data: articles }, { data: matches }] = await Promise.all([
    supabase
      .from("articles")
      .select("slug,created_at")
      .order("created_at", { ascending: false }),
    supabase.from("matches").select("id,kickoff_at"),
  ]);

  for (const article of articles ?? []) {
    if (typeof article.slug !== "string") continue;
    entries.push({
      url: toAbsoluteUrl(`/nyheder/${article.slug}`),
      lastModified:
        typeof article.created_at === "string" ? new Date(article.created_at) : fallbackDate,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const match of matches ?? []) {
    if (typeof match.id !== "string") continue;
    entries.push({
      url: toAbsoluteUrl(`/kampe/${match.id}`),
      lastModified:
        typeof match.kickoff_at === "string" ? new Date(match.kickoff_at) : fallbackDate,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return entries;
}

export const dynamic = "force-dynamic";
export const revalidate = 3600;
