import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { rowToAsset, MEDIA_ROOT, type MediaAssetRow } from "@/lib/media-sync";
import cloudinary from "@/lib/cloudinary";

/**
 * Media listing, served from the Supabase mirror of Cloudinary
 * (see supabase/migrations/20260904000000_add_media_assets.sql).
 *
 * Filtering happens in Postgres, so repeated `?tag=` params narrow to media
 * carrying *every* tag without the result cap the old Admin API path had.
 */
export async function GET(req: NextRequest) {
  const tags = req.nextUrl.searchParams.getAll("tag").filter(Boolean);
  const folder = req.nextUrl.searchParams.get("folder");

  try {
    let query = supabaseAdmin
      .from("media_assets")
      .select("*")
      .order("created_at", { ascending: false });

    // `contains` is `tags @> ARRAY[...]`, backed by the GIN index: an asset
    // matches only when it carries all of the selected tags.
    if (tags.length > 0) query = query.contains("tags", tags);

    // Match the folder itself and anything nested below it. Folder names are
    // free text ("06-04-2026 Sundby Bk. vs Vanløse IF"), and an unquoted comma
    // or period would be read as PostgREST filter syntax, so quote them.
    if (folder) {
      const quoted = quoteFilterValue(folder);
      const quotedPrefix = quoteFilterValue(`${folder}/%`);
      query = query.or(`folder.eq.${quoted},folder.like.${quotedPrefix}`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json(((data ?? []) as unknown as MediaAssetRow[]).map(rowToAsset));
  } catch (error) {
    // Before the migration has been applied and backfilled there is no mirror
    // to read, so fall back to Cloudinary rather than showing an empty
    // library. Slower, but it keeps the admin usable during rollout.
    console.warn("[media] mirror unavailable, falling back to Cloudinary:", error);
    try {
      return NextResponse.json(await listFromCloudinary(tags, folder));
    } catch (fallbackError) {
      const msg = fallbackError instanceof Error ? fallbackError.message : "Ukendt fejl";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }
}

/** Wraps a PostgREST filter value in quotes so separators inside it are literal. */
function quoteFilterValue(value: string) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

async function listFromCloudinary(tags: string[], folder: string | null) {
  const prefix = folder ? `${MEDIA_ROOT}/${folder}/` : `${MEDIA_ROOT}/`;
  let resources: Array<Record<string, unknown>>;

  if (tags.length > 0) {
    const [primaryTag, ...remainingTags] = tags;
    const [imageResult, videoResult] = await Promise.all([
      cloudinary.api.resources_by_tag(primaryTag, { resource_type: "image", tags: true, max_results: 500 }),
      cloudinary.api.resources_by_tag(primaryTag, { resource_type: "video", tags: true, max_results: 500 }),
    ]);
    resources = [...imageResult.resources, ...videoResult.resources];

    if (remainingTags.length > 0) {
      resources = resources.filter((r) =>
        remainingTags.every((t) => ((r.tags as string[]) ?? []).includes(t))
      );
    }
    if (folder) {
      resources = resources.filter((r) => (r.public_id as string).startsWith(prefix));
    }
  } else {
    const [imageResult, videoResult] = await Promise.all([
      cloudinary.api.resources({ type: "upload", prefix, resource_type: "image", tags: true, max_results: 500 }),
      cloudinary.api.resources({ type: "upload", prefix, resource_type: "video", tags: true, max_results: 500 }),
    ]);
    resources = [...imageResult.resources, ...videoResult.resources];
  }

  return resources
    .map((r) => ({
      public_id: r.public_id as string,
      url: r.secure_url as string,
      tags: (r.tags as string[]) ?? [],
      created_at: r.created_at as string,
      bytes: (r.bytes as number) ?? 0,
      resource_type: (r.resource_type as "image" | "video") ?? "image",
      filename: (r.public_id as string).split("/").pop() ?? (r.public_id as string),
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
