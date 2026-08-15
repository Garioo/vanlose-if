import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

/**
 * Full tag vocabulary, independent of any active filter.
 *
 * The media grid used to derive its tag list from the (already filtered)
 * resources it had loaded, so selecting a tag made every non-co-occurring tag
 * vanish from the filter bar. This endpoint is the stable source instead.
 */
export async function GET() {
  try {
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

    const unique = Array.from(new Set(tags)).sort((a, b) => a.localeCompare(b, "da"));

    return NextResponse.json(unique);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
