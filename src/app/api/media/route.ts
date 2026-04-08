import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function GET(req: NextRequest) {
  const tag = req.nextUrl.searchParams.get("tag");
  const folder = req.nextUrl.searchParams.get("folder"); // subfolder name, e.g. "spillere"
  const prefix = folder ? `vanlose-if/${folder}/` : "vanlose-if/";

  try {
    let resources;

    if (tag) {
      const result = await cloudinary.api.resources_by_tag(tag, {
        resource_type: "image",
        tags: true,
        max_results: 200,
      });
      // Filter by folder when both tag and folder are specified
      resources = folder
        ? result.resources.filter((r: { public_id: string }) => r.public_id.startsWith(`vanlose-if/${folder}/`))
        : result.resources;
    } else {
      const result = await cloudinary.api.resources({
        type: "upload",
        prefix,
        resource_type: "image",
        tags: true,
        max_results: 200,
        direction: "desc",
      });
      resources = result.resources;
    }

    const items = resources.map((r: { public_id: string; secure_url: string; tags: string[]; created_at: string; bytes: number }) => ({
      public_id: r.public_id,
      url: r.secure_url,
      tags: r.tags ?? [],
      created_at: r.created_at,
      bytes: r.bytes,
      filename: r.public_id.split("/").pop() ?? r.public_id,
    }));

    return NextResponse.json(items);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
