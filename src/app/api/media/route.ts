import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function GET(req: NextRequest) {
  const tag = req.nextUrl.searchParams.get("tag");
  const folder = req.nextUrl.searchParams.get("folder"); // subfolder name, e.g. "spillere"
  const prefix = folder ? `vanlose-if/${folder}/` : "vanlose-if/";

  try {
    let resources;

    if (tag) {
      const [imageResult, videoResult] = await Promise.all([
        cloudinary.api.resources_by_tag(tag, {
          resource_type: "image",
          tags: true,
          max_results: 200,
        }),
        cloudinary.api.resources_by_tag(tag, {
          resource_type: "video",
          tags: true,
          max_results: 200,
        }),
      ]);

      resources = [...imageResult.resources, ...videoResult.resources];

      // Filter by folder when both tag and folder are specified
      resources = folder
        ? resources.filter((r: { public_id: string }) => r.public_id.startsWith(`vanlose-if/${folder}/`))
        : resources;
    } else {
      const [imageResult, videoResult] = await Promise.all([
        cloudinary.api.resources({
          type: "upload",
          prefix,
          resource_type: "image",
          tags: true,
          max_results: 200,
          direction: "desc",
        }),
        cloudinary.api.resources({
          type: "upload",
          prefix,
          resource_type: "video",
          tags: true,
          max_results: 200,
          direction: "desc",
        }),
      ]);

      resources = [...imageResult.resources, ...videoResult.resources];
    }

    const items = resources
      .map((r: { public_id: string; secure_url: string; tags: string[]; created_at: string; bytes: number; resource_type: "image" | "video" }) => ({
        public_id: r.public_id,
        url: r.secure_url,
        tags: r.tags ?? [],
        created_at: r.created_at,
        bytes: r.bytes,
        resource_type: r.resource_type,
        filename: r.public_id.split("/").pop() ?? r.public_id,
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json(items);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
