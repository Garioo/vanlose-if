import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";
import cloudinary from "@/lib/cloudinary";

export async function GET() {
  try {
    const result = await cloudinary.api.sub_folders("vanlose-if");
    const folders: string[] = (result.folders as { name: string; path: string }[]).map((f) => f.name);
    return NextResponse.json(folders);
  } catch {
    // If vanlose-if root folder doesn't exist yet, return empty list
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdminApi(req);
  if (unauthorized) return unauthorized;

  const { name } = await req.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Mappenavn er påkrævet." }, { status: 400 });
  }

  const folderName = name.trim().replace(/^\/|\/$/g, "");
  if (!folderName) {
    return NextResponse.json({ error: "Ugyldigt mappenavn." }, { status: 400 });
  }

  try {
    await cloudinary.api.create_folder(`vanlose-if/${folderName}`);
    return NextResponse.json({ name: folderName });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
