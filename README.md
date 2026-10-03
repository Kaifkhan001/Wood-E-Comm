# Wood & Wonders

Furniture store and interior-design studio website. Next.js 16 (App Router), Postgres (Neon) with Drizzle, Better Auth, Cloudinary, Tailwind CSS v4.

Business details (contact, socials, WhatsApp number) live in `src/lib/site.ts`. The logo is a registered trademark (`public/brand/logo-master.png`); every place it appears (`src/app/icon.png`, `apple-icon.png`, `opengraph-image.png`, `public/brand/logo.png`, `logo-on-white.png`, `instagram-qr.svg`) is generated from it by `node scripts/brand-assets.mjs` — never edit those files by hand, edit the master and re-run the script. That script uses `sharp` (image processing) and `qrcode` (QR generation), both devDependencies since they only run at build-asset time, not in the app itself. The swipeable product galleries use `embla-carousel-react` (~6KB gzip, a runtime dependency). The admin image uploader (drag-and-drop, progress, reordering) uses `@dnd-kit/core`/`@dnd-kit/sortable`/`@dnd-kit/utilities` and `react-easy-crop` — all runtime dependencies, but only loaded by admin pages, never the public storefront.

### Cloudinary images showing as a placeholder

If an uploaded product photo appears in your Cloudinary dashboard but shows a placeholder on the site: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is almost certainly missing or wrong. It's inlined into the app at **build time** (not read at runtime), so if it was blank or misspelled the last time the site was built, every image saved before the fix below falls back to the placeholder even though the upload itself worked. Uploads now also save Cloudinary's `secure_url` directly, so newly uploaded images no longer depend on that variable at all — but any row saved before this fix (publicId only, no url) still does, until you run the backfill:

```bash
node scripts/backfill-image-urls.mjs          # dry run, prints what it would change
node scripts/backfill-image-urls.mjs --apply  # writes url for publicId-only rows
```

This reads `DATABASE_URL` and `CLOUDINARY_CLOUD_NAME` from `.env.local`. To run the equivalent directly in the Neon SQL editor instead (e.g. against production from a machine that can't reach the database), use:

```sql
UPDATE product_images
SET url = 'https://res.cloudinary.com/<your-cloud-name>/image/upload/' || public_id
WHERE public_id IS NOT NULL AND (url IS NULL OR url = '');
```

## What's in it

**Storefront**: home page, furniture listing with category, material, price, stock and text filters (all in the URL, so filtered pages can be shared and bookmarked), product pages with gallery, cart, order requests, account page with order and quote status.

**Interior design**: project gallery, project pages, a three-step quote form, WhatsApp shortcuts with prefilled messages throughout.

**Admin** (`/admin`): dashboard with 30-day sales, products (add, edit, hide, delete, image upload and ordering), categories, projects (portfolio management with cover and gallery uploads), orders (status workflow that reserves and releases stock), interior quote pipeline, a read-only customers list, contact messages, offer sign-ups with CSV export.

**Marketing**: delayed "unlock your discount" popup, cookie consent, GA4 (only after consent), Vercel Analytics (cookieless), JSON-LD for products, breadcrumbs and the business, sitemap.xml, robots.txt.

## Orders work as requests (no payment yet)

Customers sign in and place an order request. Nothing is charged. Your team calls to confirm, then moves the order through `Requested → Confirmed → In production → Shipped → Delivered`. Confirming reserves stock; cancelling a confirmed order puts it back. Add Razorpay later as a payment step after confirmation.

## Local setup

```bash
cp .env.example .env.local        # fill in DATABASE_URL and BETTER_AUTH_SECRET at minimum
openssl rand -base64 32           # use this for BETTER_AUTH_SECRET
npm install
npm run db:migrate                # creates tables
npm run db:seed                   # demo categories, 23 products, 6 projects
npm run dev
```

Create your admin account: sign up at `/signup`, then

```bash
npm run make-admin -- you@yourdomain.in
```

There is deliberately no way to become admin from the website.

### Troubleshooting sign-in ("Invalid origin")

Better Auth rejects any request whose `Origin` header isn't in its trusted-origins list — this is CSRF protection, not a bug. If you see `Invalid origin` in the server log:

- Run the dev server on port 3000: `npm run dev -- -p 3000`. If something else is already listening there, find and stop it on Windows with `netstat -ano | findstr :3000` then `taskkill /PID <pid> /F`.
- Keep `BETTER_AUTH_URL` and `NEXT_PUBLIC_SITE_URL` equal to the URL you actually open in the browser.
- If you do need another port or domain (a teammate's tunnel, a staging URL, a second apex/`www.` domain), add it to `TRUSTED_ORIGINS` (comma-separated) instead of changing `BETTER_AUTH_URL`. In development, `localhost`/`127.0.0.1` ports 3000–3010 are already trusted automatically, so ordinary dev-port switching needs no configuration.
- Email/password sign-up and sign-in work from any trusted origin regardless of `BETTER_AUTH_URL`. Google OAuth is stricter: the port in `BETTER_AUTH_URL` must match the redirect URI registered in Google Cloud Console, so switch ports there too if you change `BETTER_AUTH_URL`.
- The first sign-up can take a few seconds in dev (password hashing plus first-time route compilation) — that's expected, not a hang.

### Troubleshooting `npm run build` (generic errors during "Generating static pages")

If `next build` fails with a generic `TypeError` (e.g. `Cannot read properties of null (reading 'useState')`) while generating static pages, and this isn't reproducible with `next build --debug-prerender`, check whether `NODE_ENV` is already set in your shell before you run the build (`echo $NODE_ENV` in bash, `echo $env:NODE_ENV` in PowerShell). A leftover `NODE_ENV` from a shell profile can leak into the build and cause exactly this class of crash even on unmodified code. Run the build with it explicitly unset, e.g. `env -u NODE_ENV npm run build` (bash) or `Remove-Item Env:\NODE_ENV; npm run build` (PowerShell), and unset it in your profile so this doesn't recur. The same variable is why `drizzle-kit` can fail to install/run (see "Check the environment" above).

## Services to set up

| Service | Needed for | Notes |
|---|---|---|
| **Neon** (required) | Database | Use the **pooled** connection string. See "Lock down the database" below. |
| **Google Cloud** | "Continue with Google" | OAuth client, type Web. Authorised redirect URI: `https://yourdomain.in/api/auth/callback/google` (and `http://localhost:3000/...` for dev). The button only appears when both Google env vars are set. |
| **Cloudinary** | Admin image uploads | Uploads are signed server-side, admin-only, limited to jpg/png/webp/avif, stored in `wood-and-wonders/products` (and `wood-and-wonders/projects` for the portfolio), downscaled to max 2400px on ingest and served as AVIF/WebP automatically. |
| **Upstash Redis** | Rate limiting on forms and orders | **Required in production.** Without it limits are per server instance only. Login/signup limits use the database and work without it. |
| **Resend** | Password-reset emails, quote/order/contact notifications | See "Set up email" below. |
| **Cloudflare Turnstile** | Bot protection on forms | Optional; honeypot + rate limits run regardless. |
| **GA4** | Analytics | Loads only after "Accept all". |

## Set up email

Quote requests, order requests and contact messages email the owner instantly (as HTML with a plain-text fallback) and, for quotes, send the customer a short confirmation if they gave an email. Without Resend configured, these are logged to the console in dev instead of sent — nothing breaks.

1. Create a free account at [resend.com](https://resend.com).
2. Add and verify your sending domain (Resend gives you DNS records — SPF/DKIM — to add at your registrar; verification can take a few minutes to a few hours).
3. Create an API key (Dashboard → API Keys).
4. Set `RESEND_API_KEY`, `EMAIL_FROM` (e.g. `"Wood & Wonders <hello@yourdomain.in>"`, must use your verified domain), and `OWNER_NOTIFY_EMAIL` (where owner notifications go).
5. `OWNER_NOTIFY_EMAIL` can be a plain Gmail address (e.g. `woodwonderind@gmail.com`) — that's just the inbox notifications arrive at. `EMAIL_FROM` is different: Resend can only *send* from a domain you own and have verified with it, never from someone else's domain like `gmail.com`. Until you verify a domain, Resend's shared test sender `onboarding@resend.dev` can only deliver to the email address on your own Resend account — useful for a first smoke test, not for real customers.
6. Once `RESEND_API_KEY` is set, consider setting `requireEmailVerification: true` in `src/lib/auth.ts` so new accounts must confirm their email.

## Deploy to Vercel

1. Push to a **private** GitHub repo. Run `npm run secrets:scan` first (needs [gitleaks](https://github.com/gitleaks/gitleaks)).
2. Import in Vercel. Add every variable from `.env.example` under Project → Settings → Environment Variables (Production). Set `NEXT_PUBLIC_SITE_URL` and `BETTER_AUTH_URL` to your real `https://` domain.
3. Run migrations against production once: `DATABASE_URL=<prod url> npm run db:migrate` (from your machine or a CI step). Don't run `db:seed` in production.
4. Deploy, sign up, run `make-admin` against the production DB.
5. Submit `https://yourdomain.in/sitemap.xml` in Google Search Console.

## Lock down the database

The app only needs to read and write rows. Create a dedicated role in Neon's SQL editor instead of using the owner role:

```sql
CREATE ROLE wood_and_wonders_app WITH LOGIN PASSWORD '<long random password>';
GRANT CONNECT ON DATABASE neondb TO wood_and_wonders_app;
GRANT USAGE ON SCHEMA public TO wood_and_wonders_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO wood_and_wonders_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO wood_and_wonders_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO wood_and_wonders_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO wood_and_wonders_app;
```

Use `wood_and_wonders_app` in Vercel's `DATABASE_URL`. Keep the owner role only for running migrations. The app never exposes the database to the browser (no public anon key), so there's no RLS surface to misconfigure.

## Before launch: replace placeholder content

- Stock photos are Unsplash URLs (hotlinked, fine for demo). Upload your own photos through the admin panel. Any image that fails to load shows a neutral placeholder instead of breaking the layout.
- Delivery promises and project write-ups are placeholder copy. Replace with real facts.
- Privacy policy and terms are templates. Have a lawyer review them.
- Project (portfolio) pages are seeded; manage them at `/admin/projects` (add, edit, publish/unpublish, reorder, delete). The home page hero automatically shows your top 3 published projects (by position, then newest) — reorder them there to change what visitors see first.

## Importing from the old website

Not done yet. `scripts/import-old-site/` doesn't exist — the owner needs to supply the actual domain of the old site to migrate from before this can be built (a placeholder URL was supplied in its place, pointing to an Amazon brand storefront page rather than a scrapable site with its own sitemap and product pages). Once the real domain is confirmed, the importer should follow a three-phase flow: Phase 1 inventories pages and images read-only and writes `import/report.md` for review; Phase 2 uploads approved images to Cloudinary; Phase 3 creates hidden draft products/projects in the database (or an `import/import.sql` file if the database can't be reached directly). Re-run with `--phase=inventory|upload|db --dry-run`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Develop, build, run |
| `npm run typecheck` | TypeScript check |
| `npm run db:generate` | Create a migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Load demo data (clears catalogue and projects) |
| `npm run make-admin -- email` | Promote an existing account to admin |
| `npm run secrets:scan` | Scan all git history for leaked secrets |
| `node scripts/brand-assets.mjs` | Regenerate every derived logo/QR asset from `public/brand/logo-master.png` (re-run after replacing the master) |
| `npm run backfill-images` | Fill in `url` for product images saved before the Cloudinary fix (dry run; add `-- --apply` to write) |
| `node scripts/check-overflow.mjs` | Playwright check for horizontal overflow across every page at 320–1280px (dev-only, see below) |

## Project map

```
src/
  app/
    (shop)/      furniture listing, product, cart, checkout
    (site)/      interior design, quote, contact, account, legal, thank-you
    (auth)/      login, signup, password reset
    admin/       admin panel (every page gated by requireAdmin)
    actions/     server actions: public.ts (forms, orders), admin.ts (all admin writes)
    api/         auth handler, admin upload signature, leads CSV
    sitemap.ts robots.ts not-found.tsx error.tsx
  components/    ui, layout, shop, cart, forms, auth, admin, marketing, home
  db/            schema, client, seed, make-admin
  lib/           auth, session guards, validators, rate limits, SEO, site config
  proxy.ts       signed-out redirects + real 404s for unknown categories
```
