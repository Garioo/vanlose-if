import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function GET(req: NextRequest) {
  // Repeated `?tag=` params narrow the result to media carrying *every* tag.
  const tags = req.nextUrl.searchParams.getAll("tag").filter(Boolean);
  const folder = req.nextUrl.searchParams.get("folder"); // subfolder name, e.g. "spillere"
  const prefix = folder ? `vanlose-if/${folder}/` : "vanlose-if/";

  try {
    let resources;

    if (tags.length > 0) {
      // Cloudinary filters by a single tag per call, so fetch the first one and
      // intersect locally — one round trip no matter how many tags are selected.
      const [primaryTag, ...remainingTags] = tags;

      const [imageResult, videoResult] = await Promise.all([
        cloudinary.api.resources_by_tag(primaryTag, {
          resource_type: "image",
          tags: true,
          max_results: 200,
        }),
        cloudinary.api.resources_by_tag(primaryTag, {
          resource_type: "video",
          tags: true,
          max_results: 200,
        }),
      ]);

      resources = [...imageResult.resources, ...videoResult.resources];

      if (remainingTags.length > 0) {
        resources = resources.filter((r: { tags?: string[] }) =>
          remainingTags.every((t) => (r.tags ?? []).includes(t))
        );
      }

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
