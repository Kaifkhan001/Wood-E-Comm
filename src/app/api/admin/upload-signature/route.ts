import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/session";
import { cloudinaryConfigured, signUpload, UPLOAD_FOLDER, PROJECTS_UPLOAD_FOLDER } from "@/lib/cloudinary";
import { checkLimit, limiters } from "@/lib/ratelimit";

const ALLOWED_FOLDERS = [UPLOAD_FOLDER, PROJECTS_UPLOAD_FOLDER];

export async function POST(req: NextRequest) {
  try {
    const s = await assertAdmin();
    if (!(await checkLimit(limiters.upload, s.user.id))) return NextResponse.json({ error: "Too many uploads. Wait a few minutes." }, { status: 429 });
  } catch {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  if (!cloudinaryConfigured()) return NextResponse.json({ error: "Image uploads are not configured yet." }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  const folder = ALLOWED_FOLDERS.includes(body?.folder) ? body.folder : UPLOAD_FOLDER;
  return NextResponse.json(signUpload(folder));
}
