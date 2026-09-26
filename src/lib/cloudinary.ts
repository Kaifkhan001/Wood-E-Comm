import "server-only";
import { createHash } from "node:crypto";
import { env } from "./env";

export const UPLOAD_FOLDER = "wood-and-wonders/products";
export const PROJECTS_UPLOAD_FOLDER = "wood-and-wonders/projects";
const ALLOWED_UPLOAD_FOLDERS = [UPLOAD_FOLDER, PROJECTS_UPLOAD_FOLDER];
// Downscale on ingest so originals never exceed 2400px (keeps storage + bandwidth low).
export const UPLOAD_TRANSFORMATION = "c_limit,w_2400,h_2400";
export const ALLOWED_FORMATS = "jpg,jpeg,png,webp,avif";

export const cloudinaryConfigured = () => Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

/** Signs an upload so only authenticated admins can write to our Cloudinary account. */
export function signUpload(folder: string = UPLOAD_FOLDER) {
  const timestamp = Math.floor(Date.now() / 1000);
  const params: Record<string, string | number> = {
    allowed_formats: ALLOWED_FORMATS,
    folder,
    timestamp,
    transformation: UPLOAD_TRANSFORMATION,
  };
  const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
  const signature = createHash("sha1").update(toSign + env.CLOUDINARY_API_SECRET).digest("hex");
  return { ...params, signature, api_key: env.CLOUDINARY_API_KEY, cloud_name: env.CLOUDINARY_CLOUD_NAME };
}

/** Deletes an asset (used when an admin removes an image). Best-effort. */
export async function destroyAsset(publicId: string) {
  if (!cloudinaryConfigured() || !ALLOWED_UPLOAD_FOLDERS.some((f) => publicId.startsWith(f + "/"))) return;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash("sha1").update(`public_id=${publicId}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`).digest("hex");
  try {
    await fetch(`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/destroy`, {
      method: "POST",
      body: new URLSearchParams({ public_id: publicId, timestamp: String(timestamp), api_key: env.CLOUDINARY_API_KEY, signature }),
    });
  } catch (e) {
    console.error("cloudinary destroy failed", e);
  }
}
