// Generates every derived brand asset from public/brand/logo-master.png.
// Re-runnable: always reads the master, never modifies it.
//
// Allowed operations only (the logo is a registered trademark): trim empty
// outer margin, scale proportionally, remove the plain white background
// OUTSIDE the badge, and place the result on a plain background/panel.
// Never redrawn, recoloured, distorted, cropped into parts, or altered.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import QRCode from "qrcode";

const ROOT = path.dirname(fileURLToPath(import.meta.url)) + "/..";
const MASTER = path.join(ROOT, "public/brand/logo-master.png");
const WHITE_THRESHOLD = 245; // RGB channel value considered "near-white"

async function loadMaster() {
  const img = sharp(MASTER).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

/** Flood fill from the four edges over near-white pixels. Returns a Uint8Array mask (1 = outside/background). */
function floodFillOutside({ data, width, height, channels }) {
  const isWhiteish = (x, y) => {
    const i = (y * width + x) * channels;
    return data[i] >= WHITE_THRESHOLD && data[i + 1] >= WHITE_THRESHOLD && data[i + 2] >= WHITE_THRESHOLD;
  };
  const outside = new Uint8Array(width * height);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (outside[idx] || !isWhiteish(x, y)) return;
    outside[idx] = 1;
    stack.push(idx);
  };
  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }
  while (stack.length) {
    const idx = stack.pop();
    const x = idx % width;
    const y = (idx / width) | 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }
  return outside;
}

/** Builds the transparent-background logo: RGB unchanged, alpha = 0 outside (softened), 255 inside. */
async function makeTransparentRaw(master) {
  const { data, width, height, channels } = master;
  const outside = floodFillOutside(master);

  const hardAlpha = Buffer.alloc(width * height);
  for (let i = 0; i < outside.length; i++) hardAlpha[i] = outside[i] ? 0 : 255;

  // Blur just the alpha mask to turn the hard cutout into a soft 1-2px edge.
  // sharp upconverts a 1-channel raw buffer to 3 during blur; force it back to one.
  const softAlpha = await sharp(hardAlpha, { raw: { width, height, channels: 1 } })
    .blur(1.1)
    .toColourspace("b-w")
    .raw()
    .toBuffer();

  const out = Buffer.alloc(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    const si = p * channels;
    const di = p * 4;
    out[di] = data[si];
    out[di + 1] = data[si + 1];
    out[di + 2] = data[si + 2];
    out[di + 3] = softAlpha[p];
  }
  return { data: out, width, height };
}

/** Bounding box of pixels that are either non-transparent (alpha img) or non-whiteish (opaque img), plus padding. */
function boundingBox({ data, width, height, channels }, isContent) {
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      if (isContent(data, i)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

function padBox(box, width, height, paddingFrac) {
  const w = box.maxX - box.minX + 1;
  const h = box.maxY - box.minY + 1;
  const padX = Math.round(w * paddingFrac);
  const padY = Math.round(h * paddingFrac);
  return {
    left: Math.max(0, box.minX - padX),
    top: Math.max(0, box.minY - padY),
    width: Math.min(width, box.maxX + padX + 1) - Math.max(0, box.minX - padX),
    height: Math.min(height, box.maxY + padY + 1) - Math.max(0, box.minY - padY),
  };
}

async function main() {
  console.log("Reading master:", MASTER);
  const master = await loadMaster();
  console.log(`Master: ${master.width}x${master.height}`);

  // ── Transparent logo (trimmed, background outside the badge removed) ──
  const transparent = await makeTransparentRaw(master);
  const alphaBox = boundingBox(
    { data: transparent.data, width: transparent.width, height: transparent.height, channels: 4 },
    (d, i) => d[i + 3] > 8,
  );
  const alphaCrop = padBox(alphaBox, transparent.width, transparent.height, 0.02);
  console.log("Transparent content box:", alphaBox, "-> crop", alphaCrop);

  const transparentSharp = sharp(transparent.data, { raw: { width: transparent.width, height: transparent.height, channels: 4 } }).extract(alphaCrop);
  const targetWidth = 600; // ~2x largest display size
  const targetHeight = Math.round((alphaCrop.height / alphaCrop.width) * targetWidth);

  await mkdir(path.join(ROOT, "public/brand"), { recursive: true });
  await transparentSharp.clone().resize(targetWidth, targetHeight).png().toFile(path.join(ROOT, "public/brand/logo.png"));
  await transparentSharp.clone().resize(targetWidth, targetHeight).webp({ quality: 95 }).toFile(path.join(ROOT, "public/brand/logo.webp"));
  console.log(`Wrote logo.png / logo.webp at ${targetWidth}x${targetHeight} (aspect ${(alphaCrop.width / alphaCrop.height).toFixed(3)})`);

  // ── On-white logo (trimmed, background kept) ──
  const opaqueBox = boundingBox(master, (d, i) => !(d[i] >= WHITE_THRESHOLD && d[i + 1] >= WHITE_THRESHOLD && d[i + 2] >= WHITE_THRESHOLD));
  const opaqueCrop = padBox(opaqueBox, master.width, master.height, 0.02);
  console.log("Opaque content box:", opaqueBox, "-> crop", opaqueCrop);
  const onWhiteSharp = sharp(MASTER).extract(opaqueCrop);
  await onWhiteSharp.clone().resize(targetWidth).png().toFile(path.join(ROOT, "public/brand/logo-on-white.png"));
  console.log("Wrote logo-on-white.png");

  // ── Next.js file-convention icons: full logo, unchanged, centred on white with ~6% padding ──
  async function squareIcon(size, outPath) {
    const pad = Math.round(size * 0.06);
    const inner = size - pad * 2;
    const resized = await onWhiteSharp.clone().resize(inner, inner, { fit: "inside" }).toBuffer();
    const meta = await sharp(resized).metadata();
    await sharp({ create: { width: size, height: size, channels: 3, background: "#ffffff" } })
      .composite([{ input: resized, left: Math.round((size - meta.width) / 2), top: Math.round((size - meta.height) / 2) }])
      .png()
      .toFile(outPath);
  }
  await squareIcon(512, path.join(ROOT, "src/app/icon.png"));
  await squareIcon(180, path.join(ROOT, "src/app/apple-icon.png"));
  console.log("Wrote src/app/icon.png (512) and apple-icon.png (180)");

  // ── Open Graph image: logo on the plaster background, ~70% canvas height ──
  const ogW = 1200, ogH = 630;
  const logoH = Math.round(ogH * 0.7);
  const logoW = Math.round((alphaCrop.width / alphaCrop.height) * logoH);
  const ogLogo = await transparentSharp.clone().resize(logoW, logoH).png().toBuffer();
  await sharp({ create: { width: ogW, height: ogH, channels: 3, background: "#e7e8e2" } })
    .composite([{ input: ogLogo, left: Math.round((ogW - logoW) / 2), top: Math.round((ogH - logoH) / 2) }])
    .png()
    .toFile(path.join(ROOT, "src/app/opengraph-image.png"));
  console.log("Wrote src/app/opengraph-image.png");

  // ── Instagram QR code ──
  await QRCode.toFile(path.join(ROOT, "public/brand/instagram-qr.svg"), "https://www.instagram.com/woodandwonders.in/", {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    color: { dark: "#211f1b", light: "#ffffff" },
  });
  console.log("Wrote public/brand/instagram-qr.svg");

  console.log("\nAspect ratio for <Image> width/height props:", { width: targetWidth, height: targetHeight, ratio: targetWidth / targetHeight });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
