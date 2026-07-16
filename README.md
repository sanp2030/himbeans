# HimBean

Production café platform for a premium Himalayan specialty-coffee brand: storefront,
online ordering, checkout with Stripe, loyalty and gift cards, reservations, an admin
dashboard, and a POS queue — built on Next.js 15 (App Router), TypeScript, Tailwind,
Prisma, and PostgreSQL.

## Quick start

```bash
npm install
cp .env.example .env             # fill in DATABASE_URL and AUTH_SECRET at minimum
npx prisma migrate deploy        # create schema
npm run db:seed                  # load menu (127 items), demo location, gift card, admin
npm run dev                      # http://localhost:3000
```

Seed admin: `admin@himbean.coffee` / value of `SEED_ADMIN_PASSWORD` in `.env`.

Prefer Docker? `docker compose up -d db redis` starts local Postgres, then run the
three commands above against it before `npm run dev`. (Redis is provisioned for future
horizontal-scale rate limiting — the current in-memory limiter in `src/lib/rate-limit.ts`
doesn't require it; see **Known limitations** below.)

## Architecture

```
src/
  app/
    page.tsx, menu/, checkout/, order/[id]/, account/orders/
    about/, careers/, wholesale/, faq/, privacy/, terms/
    admin/                 # menu CRUD, refunds, EOD check (MANAGER+)
    pos/                   # order queue + low-stock strip (BARISTA+)
    api/
      orders/               # POST — server-authoritative pricing, atomic inventory
      admin/products/       # GET/POST/PATCH — menu CRUD, audit-logged
      pos/low-stock/        # GET — inventory alerts for the bar
      webhooks/stripe/      # signature-verified payment fulfilment
      reservations/, newsletter/, subscriptions/, rewards/me/
    sw.ts                   # Serwist service worker source (offline menu)
    sitemap.ts, robots.ts
  components/
    site/                   # Navbar, Footer, Analytics, SocialProof
    menu/                   # MenuExplorer, ProductDetail
    checkout/               # CheckoutForm + Stripe PaymentElement
    admin/, pos/, fx/        # animation/depth components (Reveal, TiltCard, Ambient)
  lib/
    db.ts                   # Prisma singleton
    auth.ts                 # Auth.js — credentials + RBAC in JWT
    stripe.ts                # lazy client, stripeEnabled() guard
    validators.ts            # Zod schemas shared client/server
    rate-limit.ts             # in-memory; see Known limitations
    audit.ts, logger.ts
prisma/
  schema.prisma             # Users, catalog, orders, payments, loyalty, gift cards,
                             # reservations, audit log — additive-only from PR1
  seed.ts
docs/
  API.md, RUNBOOK.md, RELEASE_GATE.md, DECISIONS.md, MIGRATION_POLICY.md,
  STRIPE_SANDBOX_TEST.md, ROADMAP.md
.github/workflows/ci.yml, lighthouse-ci.yml
```

**Design tokens** — `tailwind.config.ts`: himwhite `#F5F3EE`, coffee `#2B1B14`,
alpine `#1F4D3A`, gold `#C8A951`, night `#161210`. Fonts: Playfair Display (display),
Inter (body), Poppins (buttons) via `next/font` — zero layout shift, self-hosted.
Dark mode is class-based; `prefers-reduced-motion` disables all animation site-wide.

## Security posture

- **Server-authoritative pricing** — clients send product IDs only; totals computed server-side.
- **Input validation** — every mutation passes a Zod schema before touching the DB.
- **SQL injection** — Prisma parameterized queries throughout; no raw SQL.
- **XSS** — React escaping; no `dangerouslySetInnerHTML` except the static JSON-LD block.
- **CSRF** — Auth.js built-in CSRF tokens; API mutations are same-origin JSON.
- **Rate limiting** — per-key in-memory limiter on public POST routes (see limitations below).
- **Headers** — nosniff, frame-deny, referrer/permissions policy, CSP in `next.config.mjs`.
- **Passwords** — bcrypt (cost 12); OAuth accounts store no password.
- **RBAC** — `Role` enum on `User`, carried in the JWT; admin/POS routes check role server-side.
- **Audit** — `AuditLog` model written on every admin mutation (menu changes, refunds).
- **Secrets** — env vars only; `.env` is gitignored; full template in `.env.example`.

## Known limitations (honest, not hidden)

- **Rate limiter is single-instance.** `src/lib/rate-limit.ts` uses an in-memory `Map` —
  correct for a single Vercel serverless instance, but each cold start resets it and it
  doesn't coordinate across concurrent instances under real traffic. Fine at launch scale;
  swap for `@upstash/ratelimit` (Redis, already provisioned in `docker-compose.yml`) before
  relying on it under sustained load.
- **Social proof content is placeholder.** `src/components/site/SocialProof.tsx` ships with
  invented press quotes and reviews for layout purposes — flagged in the component itself
  and in `docs/RELEASE_GATE.md`. Replace with real, permissioned content before launch;
  publishing fabricated press claims is false advertising.
- **Menu photography is illustration, not photography.** Each of the 127 items renders a
  brand-consistent SVG illustration (`src/components/fx/DrinkIllustration.tsx`), not a real
  product photo. `docs/STRIPE_SANDBOX_TEST.md` and the photography shot list in `docs/`
  cover the path to real photography.
- **Stripe, email, and SMS are wired but inactive until keyed.** Checkout's card payment,
  order-confirmation emails, and SMS updates all silently no-op (not error) without their
  respective API keys in `.env` — counter payment and gift-card checkout work regardless.

## Deployment — Vercel (primary target)

1. Push to GitHub; import the repo in Vercel. **Do not override the build command** —
   the default `npm run build` (defined in `package.json` as `prisma generate && next build`)
   is correct and safe to run on every deploy, including preview builds.
2. Provision Postgres (Neon, Supabase, or Vercel Postgres) and set `DATABASE_URL` in
   Vercel's environment variables, along with every value from `.env.example` you need.
3. **Run migrations as a separate, deliberate step — not inside the build command.**
   Running `prisma migrate deploy` from the build command would re-run migrations on
   every preview deployment for every branch, racing against your production database.
   Instead, run it once from your machine or CI, pointed at the target `DATABASE_URL`:
   ```bash
   DATABASE_URL="<production-url>" npx prisma migrate deploy
   DATABASE_URL="<production-url>" npm run db:seed   # first deploy only
   ```
4. Add your domain; Vercel provisions HTTPS automatically.
5. Point the Stripe webhook at `https://yourdomain.com/api/webhooks/stripe` and set
   `STRIPE_WEBHOOK_SECRET` from the Stripe dashboard. See `docs/STRIPE_SANDBOX_TEST.md`
   for the full test-mode runbook before going live with real keys.
6. Confirm `AUTH_URL` is set to your real production domain (used in metadata, sitemap,
   and canonical URLs).

## Deployment — Docker (alternative)

```bash
docker compose up --build     # web + Postgres + Redis
```
Uses the multi-stage `Dockerfile` (Next.js `output: "standalone"` — verified building
a working `.next/standalone/server.js`). Run migrations against the container's Postgres
the same way as step 3 above before first use.

**CI:** `.github/workflows/ci.yml` runs lint → typecheck → tests → build on every PR.
`.github/workflows/lighthouse-ci.yml` runs a real Lighthouse audit (spins up Postgres,
migrates, seeds, builds, tests 4 routes) on every push to `main`.

## Testing strategy

| Layer | Tool | What it covers |
|---|---|---|
| Unit | Vitest | validators, pricing math, loyalty, cart math |
| E2E | Playwright | order flow (`tests/e2e/customer-order.spec.ts`) |
| Accessibility | axe-core (via Playwright) | 0 violations verified across all public pages |
| Performance | Lighthouse CI | perf/a11y/SEO thresholds on 4 routes, GitHub Actions |

Run locally: `npm run typecheck && npm run lint && npm test && npm run build`.

## Performance

Server components by default, `next/image` (AVIF/WebP), `next/font` self-hosting,
route-level code splitting, gzip compression, and a Serwist service worker for offline
menu browsing are already wired. GA4/PostHog activate only when their env keys are set
(`src/components/site/Analytics.tsx`) — the CSP in `next.config.mjs` explicitly allowlists
both domains so they aren't silently blocked.

## What's built vs. what's next

Shipped and verified (build + tests + a11y audit, not just claimed): storefront, menu
(127 items, 14 categories), cart, checkout with Stripe PaymentIntents (Apple/Google Pay via
`automatic_payment_methods`), guest + account order history, order tracking, admin menu
CRUD with audit logging, POS queue with low-stock alerts, gift cards, loyalty ledger,
PWA/offline menu, GA4 + PostHog analytics, six content pages, and CI (lint/typecheck/test/
build + Lighthouse) on every push.

See `docs/ROADMAP.md` for what's deliberately deferred and why: Firebase push notifications
(needs your Firebase project keys), AI personalization beyond time-of-day (needs real order
history or a weather API key), and inventory forecasting (needs weeks of real operational
data — building a forecast model against data that doesn't exist yet would just be fiction).
