import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, subcategories } from "@/db/schema";

const PROTECTED = /^\/(admin|account|checkout)(\/|$)/;
const CATEGORY = /^\/furniture\/([^/]+)\/?$/;
const SUBCATEGORY = /^\/furniture\/([^/]+)\/([^/]+)\/?$/;

// Category (and subcategory) listings stream (for skeletons + filters), and a
// streamed response can't change its status later. So unknown slugs are
// rejected here, before rendering, to return a real 404 instead of a "soft
// 404". Cached for 60 seconds. Subcategories are keyed by category slug, so a
// subcategory slug that's valid under one category but not the requested one
// still 404s.
let slugCache: { at: number; categories: Set<string>; subcategories: Map<string, Set<string>> } | null = null;
async function catalogSlugs() {
  if (slugCache && Date.now() - slugCache.at < 60_000) return slugCache;
  const [catRows, subRows] = await Promise.all([
    db.select({ slug: categories.slug }).from(categories),
    db.select({ slug: subcategories.slug, categorySlug: categories.slug }).from(subcategories).innerJoin(categories, eq(subcategories.categoryId, categories.id)),
  ]);
  const subsByCategory = new Map<string, Set<string>>();
  for (const r of subRows) {
    if (!subsByCategory.has(r.categorySlug)) subsByCategory.set(r.categorySlug, new Set());
    subsByCategory.get(r.categorySlug)!.add(r.slug);
  }
  slugCache = { at: Date.now(), categories: new Set(catRows.map((r) => r.slug)), subcategories: subsByCategory };
  return slugCache;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /**
   * Optimistic redirect only: sends signed-out visitors to /login before rendering.
   * It checks that a session cookie EXISTS, not that it's valid. The real checks
   * (requireUser / requireAdmin / assertAdmin) run on the server for every page,
   * action and API route.
   */
  if (PROTECTED.test(pathname)) {
    if (!getSessionCookie(request)) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const subMatch = pathname.match(SUBCATEGORY);
  const catMatch = !subMatch ? pathname.match(CATEGORY) : null;
  if (subMatch || catMatch) {
    try {
      const slugs = await catalogSlugs();
      if (subMatch) {
        const categorySlug = decodeURIComponent(subMatch[1]);
        const subSlug = decodeURIComponent(subMatch[2]);
        if (!slugs.categories.has(categorySlug) || !slugs.subcategories.get(categorySlug)?.has(subSlug)) {
          return NextResponse.rewrite(new URL("/__not-found__", request.url), { status: 404 });
        }
      } else if (catMatch && !slugs.categories.has(decodeURIComponent(catMatch[1]))) {
        return NextResponse.rewrite(new URL("/__not-found__", request.url), { status: 404 });
      }
    } catch {
      // DB hiccup: fall through and let the page handle it.
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/checkout/:path*", "/furniture/:slug", "/furniture/:slug/:subslug"],
};
