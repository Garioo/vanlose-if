import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { requireAdminApi } from "@/lib/api-auth";
import { captureApiError, captureApiMessage } from "@/lib/observability";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export async function POST(req: NextRequest) {
  try {
    const unauthorized = await requireAdminApi(req);
    if (unauthorized) return unauthorized;

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Ingen fil modtaget." }, { status: 400 });
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: "Filen er tom." }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      captureApiMessage("upload_rejected", "warning", {
        reason: "too_large",
        size: file.size,
        type: file.type,
      });
      return NextResponse.json({ error: "Filen er for stor. Maksimum er 5 MB." }, { status: 413 });
    }

    const extension = MIME_TO_EXTENSION[file.type];
    if (!extension) {
      captureApiMessage("upload_rejected", "warning", {
        reason: "invalid_mime",
        type: file.type,
        size: file.size,
      });
      return NextResponse.json({ error: "Ugyldig filtype. Kun billeder er tilladt." }, { status: 415 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${randomUUID()}.${extension}`;
    const uploadsDir = join(process.cwd(), "public", "uploads");
    const uploadPath = join(uploadsDir, filename);

    await mkdir(uploadsDir, { recursive: true });
    await writeFile(uploadPath, buffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    captureApiError(error, { route: "/api/upload" });
    return NextResponse.json({ error: "Kunne ikke uploade filen." }, { status: 500 });
  }
}
