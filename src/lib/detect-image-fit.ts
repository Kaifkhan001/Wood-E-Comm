/**
 * Guesses whether a photo is a studio/cutout shot (plain light background --
 * show the whole product, "contain") or a lifestyle/room photo (busy edges --
 * fill the frame, "cover"). Samples a thin band of border pixels on a small
 * canvas: if at least 85% of them are near-uniform and light, it's "contain".
 */
export function detectImageFit(img: HTMLImageElement): "contain" | "cover" {
  try {
    const size = 80;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return "contain";
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);

    const band = 3; // border thickness to sample, in pixels
    const samples: [number, number, number][] = [];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const onBorder = x < band || x >= size - band || y < band || y >= size - band;
        if (!onBorder) continue;
        const i = (y * size + x) * 4;
        samples.push([data[i], data[i + 1], data[i + 2]]);
      }
    }
    if (!samples.length) return "contain";

    const n = samples.length;
    const mean = samples.reduce((acc, [r, g, b]) => [acc[0] + r / n, acc[1] + g / n, acc[2] + b / n], [0, 0, 0]);
    const brightness = (mean[0] + mean[1] + mean[2]) / 3;

    let nearUniformAndLight = 0;
    for (const [r, g, b] of samples) {
      const dist = Math.sqrt((r - mean[0]) ** 2 + (g - mean[1]) ** 2 + (b - mean[2]) ** 2);
      const pixelBrightness = (r + g + b) / 3;
      if (dist < 28 && pixelBrightness > 225) nearUniformAndLight++;
    }

    const ratio = nearUniformAndLight / n;
    return ratio >= 0.85 && brightness > 225 ? "contain" : "cover";
  } catch {
    return "contain";
  }
}
