// Builds Cloudinary delivery URLs, or passes stock (Unsplash) URLs through unchanged.
//
// A Cloudinary URL carries its own cloud name, so once an image has a saved
// `url` its rendering never depends on NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME --
// that variable is inlined at BUILD time, and if it was missing or wrong when
// the app was last built, any image saved as publicId-only would silently
// fall back to the placeholder forever, even though the upload itself
// succeeded. Only a publicId-only row (pre-dating this fix, or added before
// Cloudinary was configured) still needs that fallback; see
// scripts/backfill-image-urls.mjs to fix existing rows.
const FALLBACK_CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;

export type ImageFit = "cover" | "contain" | "thumb" | "limit";

function transformFor(fit: ImageFit, width: number, ar?: string): string {
  const parts = ["f_auto", "q_auto"];
  if (fit === "cover" && ar) parts.push("c_fill", "g_auto", `ar_${ar}`);
  else if (fit === "contain" && ar) parts.push("c_pad", "b_auto:predominant", `ar_${ar}`);
  else if (fit === "thumb") parts.push("c_fill", "g_auto", "ar_1:1");
  else parts.push("c_limit"); // no ar given: cap width only, never crop unexpectedly
  parts.push(`w_${width}`);
  return parts.join(",");
}

const CLOUDINARY_URL_RE = /^https:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(.+)$/;

// Cloudinary URLs look like .../upload/<transform-1>/<transform-2>/.../<version>/<public_id>.<ext>,
// or without a version or transform at all. Public IDs can themselves contain slashes (folders), so
// we only strip LEADING segments that are clearly a version (v123) or a transform param (comma-joined,
// or a short letter code with an underscore like f_auto/c_fill/w_800) -- never the final segment.
function stripCloudinaryPrefix(tail: string): string {
  const segments = tail.split("/");
  let i = 0;
  while (i < segments.length - 1) {
    const seg = segments[i];
    if (/^v\d+$/.test(seg) || seg.includes(",") || /^[a-z]{1,3}_[\w.:%-]+$/.test(seg)) {
      i++;
      continue;
    }
    break;
  }
  return segments.slice(i).join("/");
}

/** Re-derives the delivery transformation on an existing Cloudinary URL (any cloud); passes any other URL through unchanged. */
export function cloudinaryUrl(url: string, width: number, opts: { fit?: ImageFit; ar?: string } = {}): string {
  const m = url.match(CLOUDINARY_URL_RE);
  if (!m) return url;
  const transform = transformFor(opts.fit ?? "cover", width, opts.ar);
  return `https://res.cloudinary.com/${m[1]}/image/upload/${transform}/${stripCloudinaryPrefix(m[2])}`;
}

export function imageSrc(
  img: { publicId?: string | null; url?: string | null },
  width = 1200,
  opts: { fit?: ImageFit; ar?: string } = {},
) {
  if (img.url) return cloudinaryUrl(img.url, width, opts);
  if (img.publicId && FALLBACK_CLOUD) {
    return `https://res.cloudinary.com/${FALLBACK_CLOUD}/image/upload/${transformFor(opts.fit ?? "cover", width, opts.ar)}/${img.publicId}`;
  }
  return "/placeholder.svg";
}

/** Unsplash helper for seed/stock images, always requests a compressed size. */
export const unsplash = (id: string, w = 1400) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;
