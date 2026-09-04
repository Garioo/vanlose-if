import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { syncOne, removeFromMirror, MEDIA_ROOT } from "@/lib/media-sync";

/**
 * Cloudinary notification endpoint, so changes made outside this app (the
 * Cloudinary console, a bulk upload, a future tagging script) reach the
 * Supabase mirror without a full resync.
 *
 * Configure the URL under Settings -> Webhook notifications in Cloudinary.
 * Optional: the in-app paths already write through, and POST /api/media/sync
 * repairs anything a missed notification left stale.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-cld-signature");
  const timestamp = req.headers.get("x-cld-timestamp");

  // Unauthenticated endpoint, so the payload is only trusted once Cloudinary's
  // signature over it verifies against the API secret.
  if (!signature || !timestamp) {
    return NextResponse.json({ error: "Manglende signatur." }, { status: 401 });
  }

  const valid = cloudinary.utils.verifyNotificationSignature(
    body,
    Number(timestamp),
    signature,
    // Cloudinary signs with a 1-hour validity window by default.
    3600
  );
  if (!valid) {
    return NextResponse.json({ error: "Ugyldig signatur." }, { status: 401 });
  }

  let payload: { notification_type?: string; public_id?: string; resource_type?: string };
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Ugyldig payload." }, { status: 400 });
  }

  const publicId = payload.public_id;
  // Notifications cover the whole cloud; ignore anything outside the club root.
  if (!publicId || !publicId.startsWith(`${MEDIA_ROOT}/`)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const resourceType = payload.resource_type === "video" ? "video" : "image";

  try {
    if (payload.notification_type === "delete") {
      await removeFromMirror(publicId);
    } else {
      await syncOne(publicId, resourceType);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
