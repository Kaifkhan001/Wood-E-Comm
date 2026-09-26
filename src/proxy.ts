import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { db } from "@/db";
import { categories } from "@/db/schema";

const PROTECTED = /^\/(admin|account|checkout)(\/|$)/;
const CATEGORY = /^\/furniture\/([^/]+)\/?$/;

// Category listings stream (for skeletons + filters), and a streamed response can't
// change its status later. So unknown category slugs are rejected here, before
// rendering, to return a real 404 instead of a "soft 404". Cached for 60 seconds.
let slugCache: { at: number; slugs: Set<string> } | null = null;
async function categorySlugs() {
  if (slugCache && Date.now() - slugCache.at < 60_000) return slugCache.slugs;
  const rows = await db.select({ slug: categories.slug }).from(categories);
  slugCache = { at: Date.now(), slugs: new Set(rows.map((r) => r.slug)) };
  return slugCache.slugs;
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

  const m = pathname.match(CATEGORY);
  if (m) {
    try {
      const slugs = await categorySlugs();
      if (!slugs.has(decodeURIComponent(m[1]))) {
        return NextResponse.rewrite(new URL("/__not-found__", request.url), { status: 404 });
      }
    } catch {
      // DB hiccup: fall through and let the page handle it.
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/checkout/:path*", "/furniture/:slug"],
};
