import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Full tag vocabulary, independent of any active filter.
 *
 * The media grid used to derive its tag list from the (already filtered)
 * resources it had loaded, so selecting a tag made every non-co-occurring tag
 * vanish from the filter bar. This endpoint is the stable source instead.
 *
 * It reads the Supabase mirror: one query over a few hundred rows, rather
 * than paging Cloudinary's rate-limited tag listing on every admin page load.
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from("media_assets").select("tags");
    if (error) throw new Error(error.message);

    const unique = new Set<string>();
    for (const row of (data ?? []) as { tags: string[] | null }[]) {
      for (const tag of row.tags ?? []) unique.add(tag);
    }

    return NextResponse.json(sortDanish([...unique]));
  } catch (error) {
    console.warn("[media/tags] mirror unavailable, falling back to Cloudinary:", error);
    try {
      return NextResponse.json(await tagsFromCloudinary());
    } catch (fallbackError) {
      const msg = fallbackError instanceof Error ? fallbackError.message : "Ukendt fejl";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }
}

function sortDanish(tags: string[]) {
  return tags.sort((a, b) => a.localeCompare(b, "da"));
}

async function tagsFromCloudinary() {
  const tags: string[] = [];
  let nextCursor: string | undefined;

  // Cloudinary caps tags per call; page through so large libraries stay complete.
  do {
    const result = await cloudinary.api.tags({
      max_results: 500,
      ...(nextCursor ? { next_cursor: nextCursor } : {}),
    });
    tags.push(...((result.tags ?? []) as string[]));
    nextCursor = result.next_cursor as string | undefined;
  } while (nextCursor);

  return sortDanish([...new Set(tags)]);
}
