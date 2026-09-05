import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Tag suggestions from scripts/face_tagger, awaiting review. Accepting one adds
 * the tag to the draft; the normal save path is what writes it to Cloudinary.
 */

interface SuggestionRow {
  public_id: string;
  tag: string;
  confidence: number;
  /** 'face', 'number', or 'face+number' when both signals agreed. */
  source: string;
}

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdminApi(req);
  if (unauthorized) return unauthorized;

  try {
    const { data, error } = await supabaseAdmin
      .from("media_tag_suggestions")
      .select("public_id,tag,confidence,source")
      .eq("status", "pending")
      .order("confidence", { ascending: false });

    if (error) throw new Error(error.message);

    // Keyed by asset, for direct lookup from the tag panel.
    const byAsset: Record<string, { tag: string; confidence: number; source: string }[]> = {};
    for (const row of (data ?? []) as unknown as SuggestionRow[]) {
      (byAsset[row.public_id] ??= []).push({
        tag: row.tag,
        confidence: row.confidence,
        source: row.source ?? "face",
      });
    }

    return NextResponse.json(byAsset);
  } catch (error) {
    // Before the face-tagging migration is applied, show no suggestions.
    console.warn("[media/suggestions] unavailable:", error);
    return NextResponse.json({});
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdminApi(req);
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => null);
  const publicId = typeof body?.publicId === "string" ? body.publicId : null;
  const tags: string[] = Array.isArray(body?.tags) ? body.tags.filter((t: unknown) => typeof t === "string") : [];
  const status = body?.status === "accepted" ? "accepted" : body?.status === "rejected" ? "rejected" : null;

  if (!publicId || tags.length === 0 || !status) {
    return NextResponse.json({ error: "publicId, tags og status er påkrævet." }, { status: 400 });
  }

  try {
    const { error } = await supabaseAdmin
      .from("media_tag_suggestions")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("public_id", publicId)
      .in("tag", tags);

    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
