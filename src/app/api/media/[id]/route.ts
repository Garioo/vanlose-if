import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";
import cloudinary from "@/lib/cloudinary";

// [id] param is the URL-encoded Cloudinary public_id (e.g. "vanlose-if%2Fmyimage")

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminApi(req);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const publicId = decodeURIComponent(id);
  const body = await req.json();
  const tags: string[] = Array.isArray(body.tags) ? body.tags : [];

  try {
    // Replace all tags on the asset
    await cloudinary.uploader.replace_tag(tags.join(","), [publicId]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminApi(req);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const publicId = decodeURIComponent(id);

  try {
    await cloudinary.uploader.destroy(publicId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
