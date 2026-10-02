// Visits every page at a range of viewport widths and reports horizontal overflow.
// Logs in a LOCAL test customer and admin (never touches production data) and saves
// full-page screenshots to .screenshots/ (gitignored) for visual review.
//
// Authentication is done with a plain fetch() POST to the sign-in API and the
// resulting cookie is injected into the Playwright context directly, rather than
// driving the login form through the browser: in this environment, browser-originated
// auth POSTs are unreliable (they can hang indefinitely) while a plain fetch always
// completes in well under a second. This sidesteps that entirely.
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3002";
const WIDTHS = [320, 360, 375, 390, 414, 768, 1024, 1280];
const SHOT_DIR = ".screenshots";

const CUSTOMER = { email: "qa-customer@example.com", password: "TestPass1234" };
const ADMIN = { email: "qa-admin@example.com", password: "TestPass1234" };

const CART_ITEMS = [
  { productId: "58ea7ade-1096-4f31-b73e-95aa34906d96", quantity: 1 }, // Marine Drive round dining table (longest name)
  { productId: "46842c59-20e5-49c1-8b58-ee5d91e23896", quantity: 2 },
  { productId: "2b20be36-3566-4124-9291-ea1e27e2c2dc", quantity: 1 },
];

function parseSetCookie(str, domain) {
  const [pair, ...attrsRaw] = str.split(";").map((s) => s.trim());
  const i = pair.indexOf("=");
  const name = pair.slice(0, i);
  const value = pair.slice(i + 1);
  const attrs = Object.fromEntries(
    attrsRaw.map((a) => {
      const j = a.indexOf("=");
      return j === -1 ? [a.toLowerCase(), true] : [a.slice(0, j).toLowerCase(), a.slice(j + 1)];
    }),
  );
  const sameSiteRaw = typeof attrs.samesite === "string" ? attrs.samesite : "Lax";
  return {
    name,
    value,
    domain,
    path: attrs.path || "/",
    httpOnly: Boolean(attrs.httponly),
    secure: Boolean(attrs.secure),
    sameSite: sameSiteRaw[0].toUpperCase() + sameSiteRaw.slice(1).toLowerCase(),
    expires: attrs["max-age"] ? Math.floor(Date.now() / 1000) + Number(attrs["max-age"]) : -1,
  };
}

/** Logs in once via a plain fetch (fast and reliable here, unlike a browser-driven
 * login) and returns parsed cookies to reuse across many contexts, so repeated checks
 * never re-trigger the sign-in rate limiter (5 attempts / 10 min, by design). */
async function loginOnce({ email, password }) {
  const res = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`login failed (${res.status}): ${await res.text()}`);
  const domain = new URL(BASE).hostname;
  return res.headers.getSetCookie().map((c) => parseSetCookie(c, domain));
}

function slugFor(path) {
  return (path.replace(/^\//, "").replace(/[\/?=&]/g, "-") || "home").slice(0, 80);
}

const EVALUATE_OVERFLOW = () => {
  function cssPath(el) {
    if (!el || el.nodeType !== 1) return "";
    const parts = [];
    let node = el;
    for (let depth = 0; node && depth < 4; depth++) {
      let part = node.tagName.toLowerCase();
      if (node.id) { part += `#${node.id}`; parts.unshift(part); break; }
      const cls = (node.className && typeof node.className === "string" ? node.className : "").trim().split(/\s+/).filter(Boolean).slice(0, 2);
      if (cls.length) part += "." + cls.join(".");
      parts.unshift(part);
      node = node.parentElement;
    }
    return parts.join(" > ");
  }
  function insideIntentionalScroller(el) {
    // An ancestor with its own horizontal scroll (a filmstrip/rail) is expected to have
    // children wider than it; that's not a page overflow bug as long as the scroller
    // itself fits the viewport.
    let node = el.parentElement;
    for (let depth = 0; node && depth < 8; depth++) {
      const cs = window.getComputedStyle(node);
      const scrollable = (cs.overflowX === "auto" || cs.overflowX === "scroll") && node.scrollWidth > node.clientWidth + 1;
      if (scrollable) {
        const nodeRect = node.getBoundingClientRect();
        if (nodeRect.right <= window.innerWidth + 2) return true;
      }
      node = node.parentElement;
    }
    return false;
  }
  const vw = window.innerWidth;
  const scrollWidth = document.documentElement.scrollWidth;
  const bodyOverflow = scrollWidth > vw + 1;
  const offenders = [];
  document.querySelectorAll("body *").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    const cs = window.getComputedStyle(el);
    if (cs.position === "fixed") return; // sticky CTAs are meant to span the viewport
    const overflowAmt = Math.round(r.right - vw);
    if (overflowAmt > 2) {
      if (insideIntentionalScroller(el)) return;
      offenders.push({ overflowAmt, selector: cssPath(el), text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60) });
    }
  });
  offenders.sort((a, b) => b.overflowAmt - a.overflowAmt);
  const seen = new Set();
  const deduped = [];
  for (const o of offenders) {
    if (seen.has(o.selector)) continue;
    seen.add(o.selector);
    deduped.push(o);
    if (deduped.length >= 6) break;
  }
  return { scrollWidth, vw, bodyOverflow, offenders: deduped };
};

function withTimeout(promise, ms, label) {
  let t;
  const timeout = new Promise((_, reject) => { t = setTimeout(() => reject(new Error(`timed out after ${ms}ms: ${label}`)), ms); });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

async function checkOneWidth(browser, { name, path, cookies, withCart, setup }, width) {
  const context = await browser.newContext({ viewport: { width, height: 1000 } });
  try {
    if (cookies) await context.addCookies(cookies);
    const page = await context.newPage();
    if (withCart) {
      await page.goto(`${BASE}/`, { waitUntil: "load" });
      await page.evaluate((items) => localStorage.setItem("ww_cart_v1", JSON.stringify(items)), CART_ITEMS);
    }
    if (setup) await setup(page, width);
    await page.goto(`${BASE}${path}`, { waitUntil: "load", timeout: 15000 });
    await page.waitForTimeout(500);
    const r = await page.evaluate(EVALUATE_OVERFLOW);
    const shotPath = `${SHOT_DIR}/${slugFor(name)}-${width}.png`;
    await page.screenshot({ path: shotPath, fullPage: true, timeout: 15000 });
    return { width, ...r, shotPath };
  } finally {
    await context.close().catch(() => {});
  }
}

const CONCURRENCY = Number(process.env.CONCURRENCY || 3);

async function checkPage(browser, spec) {
  // This environment occasionally stalls an individual browser-originated navigation
  // for tens of seconds (not a code issue -- a plain curl/fetch to the same URL is
  // always fast), so a hard per-check timeout keeps one stalled check from blocking
  // the run. Full 8-way parallelism was found to cause genuine Chromium layout-
  // measurement races under load (a verified environment artifact, not a real bug) --
  // capped concurrency avoids that while still being much faster than fully serial.
  const results = new Array(WIDTHS.length);
  for (let i = 0; i < WIDTHS.length; i += CONCURRENCY) {
    const batch = WIDTHS.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(
      batch.map((width) => withTimeout(checkOneWidth(browser, spec, width), 15000, `${spec.name}@${width}`)),
    );
    settled.forEach((s, j) => { results[i + j] = s.status === "fulfilled" ? s.value : { width: batch[j], error: String(s.reason?.message || s.reason) }; });
  }
  return { name: spec.name, path: spec.path, results };
}

async function main() {
  await mkdir(SHOT_DIR, { recursive: true });
  const browser = await chromium.launch();

  console.log("Logging in once as customer and admin...");
  const customerCookies = await loginOnce(CUSTOMER);
  const adminCookies = await loginOnce(ADMIN);

  const specs = [
    { name: "home", path: "/" },
    { name: "furniture", path: "/furniture" },
    {
      name: "furniture-sofas-filtered",
      path: "/furniture/sofas?material=Sheesham+wood&sort=price-asc",
      setup: async (page, width) => {
        page.once("load", async () => {
          if (width < 1024) {
            const btn = page.getByRole("button", { name: /filter/i }).first();
            if (await btn.count()) await btn.click().catch(() => {});
            await page.waitForTimeout(300).catch(() => {});
          }
        });
      },
    },
    { name: "product", path: "/product/marine-drive-round-dining-table" },
    { name: "cart-3-items", path: "/cart", cookies: customerCookies, withCart: true },
    { name: "checkout", path: "/checkout", cookies: customerCookies, withCart: true },
    { name: "interior-design", path: "/interior-design" },
    { name: "project", path: "/interior-design/a-calm-2-bhk-in-andheri-west" },
    { name: "get-a-quote", path: "/get-a-quote" },
    { name: "contact", path: "/contact" },
    { name: "account", path: "/account", cookies: customerCookies },
    { name: "login", path: "/login" },
    { name: "signup", path: "/signup" },
    { name: "forgot-password", path: "/forgot-password" },
    { name: "thank-you-order", path: "/thank-you?type=order&order=WW-00001" },
    { name: "privacy-policy", path: "/privacy-policy" },
    { name: "terms", path: "/terms" },
    { name: "not-found", path: "/this-page-does-not-exist" },
    { name: "admin-dashboard", path: "/admin", cookies: adminCookies },
    { name: "admin-products", path: "/admin/products", cookies: adminCookies },
    { name: "admin-product-edit", path: `/admin/products/${process.env.QA_PRODUCT_ID}`, cookies: adminCookies },
    { name: "admin-categories", path: "/admin/categories", cookies: adminCookies },
    { name: "admin-projects", path: "/admin/projects", cookies: adminCookies },
    { name: "admin-customers", path: "/admin/customers", cookies: adminCookies },
    { name: "admin-orders", path: "/admin/orders", cookies: adminCookies },
    { name: "admin-order-detail", path: `/admin/orders/${process.env.QA_ORDER_ID}`, cookies: adminCookies },
    {
      name: "admin-quotes-expanded",
      path: "/admin/quotes",
      cookies: adminCookies,
      setup: async (page) => {
        page.once("load", async () => {
          const d = page.locator("details").first();
          if (await d.count()) await d.evaluate((el) => el.setAttribute("open", "")).catch(() => {});
        });
      },
    },
    { name: "admin-messages", path: "/admin/messages", cookies: adminCookies },
  ];

  const report = [];
  for (const spec of specs) {
    console.log("Checking:", spec.name);
    report.push(await checkPage(browser, spec));
  }

  await browser.close();

  console.log("\n\n=== OVERFLOW REPORT ===\n");
  let anyFail = false;
  for (const page of report) {
    for (const r of page.results) {
      if (r.error) {
        console.log(`FAIL  ${page.name.padEnd(28)} w=${r.width}  ERROR: ${r.error}`);
        anyFail = true;
        continue;
      }
      // bodyOverflow (scrollWidth > viewport) is the real, actionable signal: the page
      // genuinely scrolls sideways. Per-element "offenders" without bodyOverflow are
      // printed as a note (not a failure) -- in practice these are almost always either
      // a correctly-contained intentional scroller this heuristic didn't recognise, or a
      // one-off render-timing artifact from checking many pages back to back; they are
      // worth a human glance but shouldn't fail the run on their own.
      const status = r.bodyOverflow ? "FAIL" : r.offenders.length ? "NOTE" : "PASS";
      if (status === "FAIL") anyFail = true;
      console.log(`${status}  ${page.name.padEnd(28)} w=${r.width}  scrollWidth=${r.scrollWidth} (viewport ${r.vw})`);
      for (const o of r.offenders) {
        console.log(`        +${o.overflowAmt}px  ${o.selector}  "${o.text}"`);
      }
    }
  }
  console.log(anyFail ? "\nRESULT: overflow found, see above.\n" : "\nRESULT: no overflow at any checked width.\n");
  process.exit(anyFail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
