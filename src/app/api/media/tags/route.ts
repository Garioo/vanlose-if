import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";
import cloudinary from "@/lib/cloudinary";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Full tag vocabulary, independent of any active filter — deriving it from the
 * already-filtered grid made non-co-occurring tags vanish from the filter bar.
 *
 * Reads the mirror rather than paging Cloudinary's rate-limited tag listing.
 */
export async function GET(req: NextRequest) {
  const unauthorized = await requireAdminApi(req);
  if (unauthorized) return unauthorized;

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
