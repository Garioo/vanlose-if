import Image from "next/image";
import { thumbnailUrl } from "@/lib/media-url";

type Props = {
  src: string;
  alt: string;
  /** Widest size the image is rendered at, in CSS pixels. Cloudinary derives at 2x. */
  width: number;
  /** Responsive hint for next/image. Without it, Next requests a 3840px render. */
  sizes: string;
  className?: string;
  priority?: boolean;
  "aria-hidden"?: boolean;
};

/**
 * Fills its (positioned) parent with a correctly sized image.
 *
 * Cloudinary resizes on its own CDN, so those URLs get a derived size and skip
 * Next's optimizer, which would otherwise download the multi-megabyte original
 * to re-encode it. Everything else — Supabase storage, files in /public — goes
 * through next/image as usual.
 */
export default function SiteImage({ src, alt, width, sizes, className, priority, ...rest }: Props) {
  const fromCloudinary = src.includes("res.cloudinary.com");

  return (
    <Image
      src={fromCloudinary ? thumbnailUrl(src, width) : src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={fromCloudinary}
      className={className}
      {...rest}
    />
  );
}
