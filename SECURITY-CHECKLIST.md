# Ship checklist

Every item from the original requirements, with where it's handled and how it was verified. Tests were run against a production build (`next build && next start`) with a local Postgres 16 database.

Status key: **Done** = built and tested. **You** = needs an action from you before launch (accounts, keys, content, legal).

## Security

| # | Item | Status | How it's handled | Verified by |
|---|---|---|---|---|
| 1 | Secure API keys | Done | All secrets are server-only env vars, validated at boot (`src/lib/env.ts`). Only `NEXT_PUBLIC_*` values (site URL, WhatsApp number, GA ID, Turnstile site key, Cloudinary cloud name) reach the browser, and none of them are secret. | Grepped `.next/static` for the DB URL, auth secret, Cloudinary secret: 0 matches. |
| 2 | Hide .env files | Done | `.gitignore` ignores `.env*` except `.env.example` (which has no values). | `git ls-files` shows only `.env.example`. |
| 3 | No hardcoded secrets | Done | No keys in source. Cloudinary signing happens on the server (`src/lib/cloudinary.ts`). | gitleaks over source and history: no leaks. |
| 4 | Authentication | Done | Better Auth: email/password (8+ chars) and Google OAuth. Sessions in HTTP-only cookies, Secure in production, 7-day expiry, all sessions revoked on password reset. | Signup, login, wrong password, short password tested. |
| 5 | Server-side permission checks | Done | `requireUser`, `requireAdmin`, `assertAdmin` in `src/lib/session.ts`. Every admin page (via layout), every admin server action and both admin API routes check independently. The admin check re-reads the role from the database, not the cached session. | Customer calling admin actions directly: "no permission". Demoting an admin revoked access on the next request. |
| 6 | Don't trust user IDs from the frontend | Done | Orders and quotes take the user ID from the verified session only. Client-sent `userId`, `price`, `subtotal` are ignored; prices are re-read from the database inside a locked transaction. | Sent `price: 1`, `subtotal: 1`, spoofed `userId`: order saved at the real ₹85,998 under the real user. |
| 7 | Isolate user data | Done | Account page queries are filtered by the session user's ID. There is no endpoint that takes an order ID from a customer. | Customer sees their order; a different user's account shows none of it. |
| 8 | Lock down the database | Done / **You** | App uses a server-only connection; no public database key exists. **You:** create the least-privilege role in the README and use it for `DATABASE_URL`. | Code review; SQL provided. |
| 9 | Secure DB, storage and auth | Done / **You** | Neon requires TLS. Cloudinary uploads are signed, admin-only, format-restricted, folder-restricted, rate-limited. Auth rate limits stored in DB. **You:** enable 2FA on Neon, Cloudinary, Vercel, Google Cloud and GitHub accounts. | Unauthenticated and customer requests to the upload-signature route: 403. |
| 10 | Protect admin routes | Done | Three layers: proxy redirect (convenience), `requireAdmin` in the admin layout, and `assertAdmin` inside every action and API route. Admin pages are `noindex` and `no-store`. | Signed out: 307 to login. Customer: 307 to home. Forged cookie: 307 to login. |
| 11 | Disable debug in production | Done | `productionBrowserSourceMaps: false`, `poweredByHeader: false`, dev-only logging in error boundary. | 0 `.map` files in `.next/static`; no `X-Powered-By` header. |
| 12 | Hide detailed errors | Done | Actions return generic messages and log details server-side. `error.tsx` and `global-error.tsx` show a friendly message and only an opaque reference code. | Read through all `catch` blocks. |
| 13 | Server-side input validation | Done | Zod schemas for every form, order, filter and admin input (`src/lib/validators.ts`): lengths, Indian mobile format, PIN code, enums, UUIDs, quantity 1 to 10, image host allowlist. | Bad phone, no consent, invalid enum, bad PIN, quantity 999: all rejected. |
| 14 | Sanitise user content | Done | HTML tags and control characters stripped before storage; React escapes on output; JSON-LD escapes `<`; CSV export neutralises spreadsheet formulas. No `dangerouslySetInnerHTML` with user content. | Submitted `<script>` and `<img onerror>`: stored as plain text. |
| 15 | Secure file uploads | Done | Browser uploads straight to Cloudinary with a short-lived server signature. Admin-only, 60 per 10 min, jpg/png/webp/avif only, 8 MB client limit, resized to 2400 px max on ingest. Files never touch the app server. | Signature route returns 403 for non-admins. |
| 16 | Prevent SQL/NoSQL injection | Done | All queries through Drizzle with bound parameters. Search text has LIKE wildcards escaped. | `' OR 1=1--` and `%` searches returned 0 results. |
| 17 | Rate-limit login and signup | Done | Sign-in 5/min, sign-up 5/10 min, password reset 3/10 min (Better Auth, stored in DB). Forms 5/10 min per IP, orders 5/hour per user (Upstash). | Wrong password repeatedly: 401s then 429. Seventh contact form from one IP: refused. |
| 18 | Check git history for secrets | Done / **You** | `npm run secrets:scan` runs gitleaks over all history. **You:** run it on your real repo before pushing and after any merge from other machines. | gitleaks on the delivered history: no leaks. |
| 19 | Security headers, restrict CORS | Done | CSP (allowlisted third parties only, `frame-ancestors 'none'`, `object-src 'none'`), HSTS with preload, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP. No CORS headers are sent, so browsers block cross-origin reads. Auth rejects foreign origins. | `curl -I` shows all headers. Login from `Origin: https://evil.example`: 403. |
| 20 | Test as an untrusted user | Done | See rows 5, 6, 7, 10, 13, 14, 16, 17. | Direct server-action calls with forged and missing cookies, tampered payloads. |

Known trade-off: the CSP allows `'unsafe-inline'` for scripts, because Next.js injects inline bootstrap scripts and switching to nonces would make every page render on demand (slower and worse for SEO). React's escaping and input sanitising are the main XSS defences. Revisit if you ever render user-supplied HTML.

Rate limits rely on the client IP from `X-Forwarded-For`, which Vercel sets itself. If you self-host, put the app behind a proxy that overwrites that header.

## Product and SEO

| # | Item | Status | How it's handled | Verified by |
|---|---|---|---|---|
| 21 | Custom 404 page | Done | `src/app/not-found.tsx`. Unknown products, projects and categories return a real 404 status, not a "soft 404". | `/nope`, `/product/nope`, `/furniture/nope`, `/interior-design/nope`: all 404 with the custom page. |
| 22 | Meta title and description on every page | Done | `pageMeta()` sets title, description, canonical, Open Graph and Twitter tags. Products and categories generate theirs from data. Private pages are `noindex`. | Present on every route. |
| 23 | sitemap.xml | Done | `src/app/sitemap.ts`: static pages, categories, active products, published projects. Refreshed hourly and on admin edits. robots.txt blocks private areas. | `/sitemap.xml` and `/robots.txt` return 200. |
| 24 | Mobile breakpoints | Done / **You** | Mobile-first layouts, filters in a bottom drawer on small screens, 44 px touch targets, safe-area insets. **You:** check on a real phone; this environment had no browser for visual testing. | Code review only. |
| 25 | Sticky CTA on mobile | Done | Bottom bar with WhatsApp and "Get a free quote" on phones; floating WhatsApp button on desktop. Hidden on checkout, login and admin. | Code review. |
| 26 | Skeletons instead of spinners | Done | Skeletons for listings, cart, checkout and admin. No spinners anywhere. | Code review. |
| 27 | Thank-you, privacy and terms pages | Done / **You** | `/thank-you` (quote, contact, order variants), `/privacy-policy` (written with India's DPDP Act in mind), `/terms`. **You:** have a lawyer review both legal pages. | All return 200. |
| 28 | Cookie banner | Done | Accept all / Essential only. Choice stored for 180 days. GA4 never loads before "Accept all". | Code review. |
| 29 | Analytics | Done / **You** | Vercel Analytics (cookieless, always on) plus GA4 after consent. **You:** set `NEXT_PUBLIC_GA_ID` and enable Vercel Analytics in the dashboard. | Code review. |
| 30 | Compressed images | Done | next/image serves AVIF/WebP at the right size; Cloudinary uploads use `f_auto,q_auto` and are capped at 2400 px; fonts are self-hosted woff2 subsets. | Build output. |
| 31 | "Remove side scrollbar" | Done | Read as "no sideways scrolling": `overflow-x: clip` on the page (keeps sticky elements working) and wide rows scroll inside their own containers. The vertical scrollbar is kept but thin and themed, since hiding it hurts usability and accessibility. **You:** tell me if you meant something else. | Code review. |

## Before you go live

1. Create Neon, Upstash, Cloudinary, Resend and Google OAuth credentials and add them in Vercel.
2. Create the least-privilege database role from the README.
3. Run `npm run secrets:scan` on your repo.
4. Run migrations on production, sign up, run `make-admin`.
5. Turn on email verification once Resend works (`requireEmailVerification: true` in `src/lib/auth.ts`).
6. Replace stock photos, placeholder stats and project write-ups; add `public/og.png`.
7. Legal review of privacy policy and terms.
8. Check the site on an Android phone and an iPhone.
9. Submit the sitemap in Google Search Console.
