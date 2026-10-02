import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { getSession } from "@/lib/session";
import { safeNext } from "@/lib/safe-redirect";

const AUTH_PATHS = /^\/(login|signup|forgot-password|reset-password)(\/|$|\?)/;

/**
 * Single place that decides where to send someone right after sign-in/sign-up,
 * admin-aware. The role is re-read from the database (never trusted from the
 * client or the cached session), same approach as requireAdmin.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  const noStore = { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } };
  if (!session) return NextResponse.redirect(new URL("/login", request.url), noStore);

  const [row] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id)).limit(1);
  const isAdmin = row?.role === "admin";
  const next = safeNext(request.nextUrl.searchParams.get("next"), isAdmin ? "/admin" : "/");

  let dest: string;
  if (isAdmin) {
    dest = next.startsWith("/admin") ? next : "/admin";
  } else {
    dest = next && !AUTH_PATHS.test(next) && !next.startsWith("/admin") ? next : "/";
  }

  return NextResponse.redirect(new URL(dest, request.url), noStore);
}
