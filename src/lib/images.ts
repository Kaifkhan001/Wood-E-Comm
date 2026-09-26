// Builds optimised image URLs. Cloudinary assets get automatic format (AVIF/WebP)
// and quality; stock URLs pass through and are optimised by next/image.
const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export function imageSrc(img: { publicId?: string | null; url?: string | null }, width = 1200) {
  if (img.publicId && cloud) {
    return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,c_limit,w_${width}/${img.publicId}`;
  }
  return img.url || "/placeholder.svg";
}

/** Unsplash helper for seed/stock images, always requests a compressed size. */
export const unsplash = (id: string, w = 1400) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;
