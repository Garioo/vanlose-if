import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";
import { syncAllMedia, syncOne } from "@/lib/media-sync";

/**
 * Refreshes the Supabase mirror from Cloudinary.
 *
 * With a `publicId`, mirrors that one asset — used after an upload. Without
 * one, rebuilds everything: the initial backfill, and the repair for changes
 * made directly in the Cloudinary console.
 */
export async function POST(req: NextRequest) {
  const unauthorized = await requireAdminApi(req);
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => ({}));
  const publicId = typeof body?.publicId === "string" ? body.publicId : null;
  const resourceType = body?.resourceType === "video" ? "video" : "image";

  try {
    if (publicId) {
      await syncOne(publicId, resourceType);
      return NextResponse.json({ ok: true, synced: 1 });
    }

    const result = await syncAllMedia();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
