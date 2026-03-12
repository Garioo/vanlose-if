import type { MetadataRoute } from "next";
import { toAbsoluteUrl } from "@/lib/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: toAbsoluteUrl("/sitemap.xml"),
  };
}
