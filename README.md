# Wood & Wonders

Furniture store and interior-design studio website. Next.js 16 (App Router), Postgres (Neon) with Drizzle, Better Auth, Cloudinary, Tailwind CSS v4.

Business details (contact, socials, WhatsApp number) live in `src/lib/site.ts`; the wordmark is in `src/components/layout/header.tsx` and `footer.tsx`.

## What's in it

**Storefront**: home page, furniture listing with category, material, price, stock and text filters (all in the URL, so filtered pages can be shared and bookmarked), product pages with gallery, cart, order requests, account page with order and quote status.

**Interior design**: project gallery, project pages, a three-step quote form, WhatsApp shortcuts with prefilled messages throughout.

**Admin** (`/admin`): dashboard with 30-day sales, products (add, edit, hide, delete, image upload and ordering), categories, orders (status workflow that reserves and releases stock), interior quote pipeline, contact messages, offer sign-ups with CSV export.

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

## Services to set up

| Service | Needed for | Notes |
|---|---|---|
| **Neon** (required) | Database | Use the **pooled** connection string. See "Lock down the database" below. |
| **Google Cloud** | "Continue with Google" | OAuth client, type Web. Authorised redirect URI: `https://yourdomain.in/api/auth/callback/google` (and `http://localhost:3000/...` for dev). The button only appears when both Google env vars are set. |
| **Cloudinary** | Admin image uploads | Uploads are signed server-side, admin-only, limited to jpg/png/webp/avif, stored in `wood-and-wonders/products` (and `wood-and-wonders/projects` for the portfolio), downscaled to max 2400px on ingest and served as AVIF/WebP automatically. |
| **Upstash Redis** | Rate limiting on forms and orders | **Required in production.** Without it limits are per server instance only. Login/signup limits use the database and work without it. |
| **Resend** | Password-reset emails, new-lead notifications | Verify your sending domain. Then set `requireEmailVerification: true` in `src/lib/auth.ts`. |
| **Cloudflare Turnstile** | Bot protection on forms | Optional; honeypot + rate limits run regardless. |
| **GA4** | Analytics | Loads only after "Accept all". |

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
- Home page stats ("140+ homes", "Jodhpur workshop", "1 year warranty"), delivery promises and project write-ups are placeholder copy. Replace with real facts.
- Privacy policy and terms are templates. Have a lawyer review them.
- Add `public/og.png` (1200×630) for social sharing previews.
- Project (portfolio) pages are seeded; editing them in the admin panel is a planned next step. For now edit via the database or `src/db/seed.ts`.

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
