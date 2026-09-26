import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { db } from "@/db";
import { user } from "@/db/schema";

/** Session from the signed cookie, verified server-side. Cached per request. */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export async function requireUser(next = "/account") {
  const s = await getSession();
  if (!s) redirect(`/login?next=${encodeURIComponent(next)}`);
  return s;
}

/**
 * Admin gate. Re-reads the role from the database on every call instead of trusting
 * the (cached) session payload, so a demoted admin loses access immediately.
 * Use in EVERY admin page, server action and route handler — the proxy is only a
 * convenience redirect, never the security boundary.
 */
export async function requireAdmin() {
  const s = await getSession();
  if (!s) redirect("/login?next=/admin");
  const [row] = await db.select({ role: user.role }).from(user).where(eq(user.id, s.user.id)).limit(1);
  if (row?.role !== "admin") redirect("/");
  return s;
}

/** For server actions: throws instead of redirecting. */
export async function assertAdmin() {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHORIZED");
  const [row] = await db.select({ role: user.role }).from(user).where(eq(user.id, s.user.id)).limit(1);
  if (row?.role !== "admin") throw new Error("FORBIDDEN");
  return s;
}
