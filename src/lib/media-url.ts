/**
 * Cloudinary delivery URLs for the admin media library.
 *
 * Uploads are full-size originals, 2-6 MB each, so list views ask Cloudinary
 * for a derived size rather than pulling the original into every thumbnail.
 */

function withTransform(url: string, transform: string) {
  // Reusing the original URL keeps its version and extension, so the delivery
  // URL does not have to be rebuilt from the cloud name.
  const marker = "/upload/";
  const index = url.indexOf(marker);
  if (index === -1) return url;

  const head = url.slice(0, index + marker.length);
  const tail = url.slice(index + marker.length);
  return `${head}${transform}/${tail}`;
}

function withExtension(url: string, extension: string) {
  return url.replace(/\.[^./?]+($|\?)/, `.${extension}$1`);
}

/** Cropped thumbnail. `g_auto` picks the crop window, keeping faces in frame. */
export function thumbnailUrl(url: string, width: number) {
  return withTransform(url, `f_auto,q_auto,c_fill,g_auto,w_${width},dpr_2.0`);
}

/** Uncropped preview, bounded by `width`. */
export function previewUrl(url: string, width: number) {
  return withTransform(url, `f_auto,q_auto,c_limit,w_${width},dpr_2.0`);
}

/** Still frame used as a video poster, so tiles do not fetch video metadata. */
export function videoPosterUrl(url: string, width: number) {
  return withExtension(withTransform(url, `so_0,f_jpg,q_auto,c_fill,g_auto,w_${width},dpr_2.0`), "jpg");
}

/** The upload widget writes to Cloudinary directly, so the mirror needs telling. */
export async function syncUploadedAsset(info: unknown) {
  const asset = info as { public_id?: string; resource_type?: string } | undefined;
  if (!asset?.public_id) return;

  await fetch("/api/media/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicId: asset.public_id, resourceType: asset.resource_type }),
  }).catch(() => {});
}
