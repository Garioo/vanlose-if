/**
 * Cloudinary delivery URLs for the admin media library.
 *
 * Uploads are full-size originals (2-6 MB is normal for phone and match
 * photos). Rendering those straight into a grid means every thumbnail pulls
 * the whole original across the wire, so all list views ask Cloudinary for a
 * derived size instead. Cloudinary builds the derivative once and serves it
 * from its CDN afterwards.
 */

/** Injects a transformation segment into an existing Cloudinary delivery URL. */
function withTransform(url: string, transform: string) {
  // Keeping the version and extension from the original URL avoids having to
  // reconstruct the delivery URL (and re-derive the cloud name) by hand.
  const marker = "/upload/";
  const index = url.indexOf(marker);
  if (index === -1) return url;

  const head = url.slice(0, index + marker.length);
  const tail = url.slice(index + marker.length);
  return `${head}${transform}/${tail}`;
}

/** Swaps the file extension, e.g. when deriving a JPEG poster from a video. */
function withExtension(url: string, extension: string) {
  return url.replace(/\.[^./?]+($|\?)/, `.${extension}$1`);
}

/**
 * A cropped thumbnail at `width` device pixels.
 *
 * `g_auto` lets Cloudinary pick the crop window, which keeps faces in frame on
 * the 4:3 grid tiles — most of the library is match and squad photography.
 */
export function thumbnailUrl(url: string, width: number) {
  return withTransform(url, `f_auto,q_auto,c_fill,g_auto,w_${width},dpr_2.0`);
}

/** A contained preview at `width` device pixels, without cropping. */
export function previewUrl(url: string, width: number) {
  return withTransform(url, `f_auto,q_auto,c_limit,w_${width},dpr_2.0`);
}

/**
 * A still frame from a video, used as a poster so the grid does not have to
 * fetch video metadata (and therefore part of the file) for every tile.
 */
export function videoPosterUrl(url: string, width: number) {
  return withExtension(withTransform(url, `so_0,f_jpg,q_auto,c_fill,g_auto,w_${width},dpr_2.0`), "jpg");
}

/**
 * Cloudinary uploads land straight in Cloudinary, so the Supabase mirror has
 * to be told about the new asset before it will show up in any listing.
 */
export async function syncUploadedAsset(info: unknown) {
  const asset = info as { public_id?: string; resource_type?: string } | undefined;
  if (!asset?.public_id) return;

  await fetch("/api/media/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicId: asset.public_id, resourceType: asset.resource_type }),
  }).catch(() => {});
}
