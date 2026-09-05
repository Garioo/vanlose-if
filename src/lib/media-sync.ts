import cloudinary from "@/lib/cloudinary";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const MEDIA_ROOT = "vanlose-if";

/** What the media API returns to the admin UI. */
export interface MediaAsset {
  public_id: string;
  url: string;
  tags: string[];
  created_at: string;
  bytes: number;
  resource_type: "image" | "video";
  filename: string;
}

interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  tags?: string[];
  created_at: string;
  bytes?: number;
  width?: number;
  height?: number;
  format?: string;
  resource_type?: string;
}

export interface MediaAssetRow {
  public_id: string;
  url: string;
  resource_type: string;
  format: string | null;
  folder: string | null;
  tags: string[];
  bytes: number;
  width: number | null;
  height: number | null;
  created_at: string;
  synced_at: string;
}

/** "vanlose-if/2026-05-02 Naesby/IMG_1.jpg" -> "2026-05-02 Naesby"; null at the root. */
export function folderOf(publicId: string): string | null {
  const prefix = `${MEDIA_ROOT}/`;
  if (!publicId.startsWith(prefix)) return null;
  const rest = publicId.slice(prefix.length);
  const lastSlash = rest.lastIndexOf("/");
  return lastSlash === -1 ? null : rest.slice(0, lastSlash);
}

export function filenameOf(publicId: string): string {
  return publicId.split("/").pop() ?? publicId;
}

function toRow(r: CloudinaryResource): MediaAssetRow {
  return {
    public_id: r.public_id,
    url: r.secure_url,
    resource_type: r.resource_type === "video" ? "video" : "image",
    format: r.format ?? null,
    folder: folderOf(r.public_id),
    tags: r.tags ?? [],
    bytes: r.bytes ?? 0,
    width: r.width ?? null,
    height: r.height ?? null,
    created_at: r.created_at,
    synced_at: new Date().toISOString(),
  };
}

export function rowToAsset(row: MediaAssetRow): MediaAsset {
  return {
    public_id: row.public_id,
    url: row.url,
    tags: row.tags ?? [],
    created_at: row.created_at,
    bytes: Number(row.bytes ?? 0),
    resource_type: row.resource_type === "video" ? "video" : "image",
    filename: filenameOf(row.public_id),
  };
}

/**
 * Every asset under the club root. Pages to the end of the cursor — the old
 * listing stopped at 200, hiding everything past it.
 */
async function fetchAllResources(): Promise<CloudinaryResource[]> {
  const all: CloudinaryResource[] = [];

  for (const resourceType of ["image", "video"] as const) {
    let nextCursor: string | undefined;
    do {
      const result = await cloudinary.api.resources({
        type: "upload",
        prefix: `${MEDIA_ROOT}/`,
        resource_type: resourceType,
        tags: true,
        max_results: 500,
        ...(nextCursor ? { next_cursor: nextCursor } : {}),
      });
      all.push(...((result.resources ?? []) as CloudinaryResource[]));
      nextCursor = result.next_cursor as string | undefined;
    } while (nextCursor);
  }

  return all;
}

/** Rebuilds the mirror: initial backfill, and repair after a missed webhook. */
export async function syncAllMedia(): Promise<{ synced: number; removed: number }> {
  const resources = await fetchAllResources();
  const rows = resources.map(toRow);

  // Chunked so a large library stays inside the request body limit.
  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabaseAdmin
      .from("media_assets")
      .upsert(rows.slice(i, i + CHUNK) as unknown as Record<string, unknown>[], {
        onConflict: "public_id",
      });
    if (error) throw new Error(`Kunne ikke gemme medier: ${error.message}`);
  }

  // Rows Cloudinary no longer lists were deleted elsewhere, e.g. its console.
  const keep = new Set(rows.map((r) => r.public_id));
  const { data: existing, error: readError } = await supabaseAdmin
    .from("media_assets")
    .select("public_id");
  if (readError) throw new Error(`Kunne ikke læse medier: ${readError.message}`);

  const stale = ((existing ?? []) as { public_id: string }[])
    .map((r) => r.public_id)
    .filter((id) => !keep.has(id));

  if (stale.length > 0) {
    const { error } = await supabaseAdmin.from("media_assets").delete().in("public_id", stale);
    if (error) throw new Error(`Kunne ikke rydde op i medier: ${error.message}`);
  }

  return { synced: rows.length, removed: stale.length };
}

/** Mirrors one asset, e.g. after an upload. */
export async function syncOne(publicId: string, resourceType: "image" | "video" = "image") {
  const resource = (await cloudinary.api.resource(publicId, {
    resource_type: resourceType,
    tags: true,
  })) as CloudinaryResource;

  const { error } = await supabaseAdmin
    .from("media_assets")
    .upsert(
      toRow({ ...resource, resource_type: resource.resource_type ?? resourceType }) as unknown as Record<
        string,
        unknown
      >,
      { onConflict: "public_id" }
    );
  if (error) throw new Error(`Kunne ikke gemme medie: ${error.message}`);
}

/** Write-through after a tag edit, so the grid updates without waiting for the webhook. */
export async function updateMirrorTags(publicId: string, tags: string[]) {
  const { error } = await supabaseAdmin
    .from("media_assets")
    .update({ tags, synced_at: new Date().toISOString() })
    .eq("public_id", publicId);
  if (error) throw new Error(`Kunne ikke opdatere tags: ${error.message}`);
}

export async function removeFromMirror(publicId: string) {
  const { error } = await supabaseAdmin.from("media_assets").delete().eq("public_id", publicId);
  if (error) throw new Error(`Kunne ikke slette medie: ${error.message}`);
}
