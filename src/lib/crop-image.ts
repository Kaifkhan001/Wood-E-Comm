export type PixelCrop = { x: number; y: number; width: number; height: number };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Crops an image to the given pixel rect, downscaling so the long edge never exceeds maxEdge. */
export async function getCroppedImageBlob(imageSrc: string, crop: PixelCrop, maxEdge = 2400, quality = 0.9): Promise<Blob> {
  const img = await loadImage(imageSrc);
  const scale = Math.min(1, maxEdge / Math.max(crop.width, crop.height));
  const outW = Math.round(crop.width * scale);
  const outH = Math.round(crop.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, outW, outH);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Crop failed"))), "image/jpeg", quality);
  });
}
