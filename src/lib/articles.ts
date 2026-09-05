import { cache } from "react";
import { supabase, type Article, type ArticleSummary } from "@/lib/supabase";
import { readingTime } from "@/lib/readingTime";

/** Columns every article card renders, plus the body needed for reading time. */
const CARD_COLUMNS = "id, slug, category, date, title, excerpt, image_url, latest, content";

type CardRow = Omit<Article, "created_at">;

/** Drops the body and folds it into a minute count instead. */
function toSummary({ content, ...rest }: CardRow): ArticleSummary {
  return { ...rest, minutes: readingTime(content) };
}

/**
 * Articles for a list view, newest first.
 *
 * The body is read here so the reading time can be computed, but it never
 * leaves the server — callers get the card fields and a minute count.
 */
export async function listArticleSummaries(limit?: number): Promise<ArticleSummary[]> {
  let query = supabase.from("articles").select(CARD_COLUMNS).order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data } = await query;
  return ((data ?? []) as unknown as CardRow[]).map(toSummary);
}

/**
 * One article by slug.
 *
 * Cached because the route renders it twice per request — once in
 * `generateMetadata`, once in the page — and that was two round trips.
 */
export const getArticleBySlug = cache(async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data } = await supabase.from("articles").select("*").eq("slug", slug).maybeSingle<Article>();
  return data;
});

/** Other articles in the same category, for the "Læs også" strip. */
export async function listRelatedArticles(article: Article, limit = 3): Promise<ArticleSummary[]> {
  const { data } = await supabase
    .from("articles")
    .select(CARD_COLUMNS)
    .eq("category", article.category)
    .neq("id", article.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as unknown as CardRow[]).map(toSummary);
}
