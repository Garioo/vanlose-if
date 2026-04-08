import cloudinary from "@/lib/cloudinary";

/**
 * Extracts the Cloudinary public_id from a Cloudinary URL and destroys the asset.
 * Silently ignores errors — image cleanup is best-effort.
 *
 * Cloudinary URL format:
 *   https://res.cloudinary.com/{cloud}/image/upload/v{version}/{public_id}.{ext}
 *   https://res.cloudinary.com/{cloud}/image/upload/{public_id}.{ext}
 */
export async function deleteUploadedImage(imageUrl: string | null | undefined) {
  if (!imageUrl) return;

  try {
    // Match everything after /image/upload/ (optionally skip version segment v123456)
    const match = imageUrl.match(/\/image\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    if (!match) return;

    const publicId = match[1];
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // Best-effort — don't fail the main operation
  }
}
