import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/session";
import { cloudinaryConfigured, signUpload } from "@/lib/cloudinary";
import { checkLimit, limiters } from "@/lib/ratelimit";

export async function POST() {
  try {
    const s = await assertAdmin();
    if (!(await checkLimit(limiters.upload, s.user.id))) return NextResponse.json({ error: "Too many uploads. Wait a few minutes." }, { status: 429 });
  } catch {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  if (!cloudinaryConfigured()) return NextResponse.json({ error: "Image uploads are not configured yet." }, { status: 503 });
  return NextResponse.json(signUpload());
}
