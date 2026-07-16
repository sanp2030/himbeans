# HimBean v3.0 — Production Release Checklist

Rule for this document: a box may only be ticked when the condition is **verified in the
production environment**, not assumed from staging. Owner and date go next to every tick.

---

## 0. Go / No-Go gates (all must pass)

- [ ] `GET /api/health` returns `200 { status: "ok" }` in production
- [ ] All 16 unit tests green in CI on the release commit
- [ ] `pnpm build` succeeds with zero type errors on the release commit
- [ ] Environment validation passes at boot (no fail-fast crash in prod logs)
- [ ] One real end-to-end order executed on production: create → POS Start → Ready →
      QR verify → COMPLETED → Vertical Meters visible via `/api/rewards/me`
- [ ] Rollback procedure (§9) rehearsed once, by name, this week

**Known launch constraint (state it, don't hide it):** payment capture is not yet wired
(Stripe is v3.1 #1). v3.0 goes live as **counter-payment mode** — orders are placed online,
paid at pickup, marked PAID by staff. This is a valid launch shape for a single flagship;
do not enable delivery fulfilment until Stripe lands.

---

## 1. Infrastructure

- [ ] Production Postgres provisioned (Neon/Supabase/RDS), **not** the docker-compose instance
- [ ] Automated daily backups enabled + one restore actually tested into a scratch DB
- [ ] Connection pooling configured (PgBouncer / provider pooler) — Prisma `connection_limit` set
- [ ] Redis provisioned (Upstash) if running >1 instance — required before in-memory
      rate limiting is trusted at scale
- [ ] `prisma migrate deploy` runs in the release pipeline (never `migrate dev` in prod)
- [ ] Custom domain + HTTPS live; HTTP→HTTPS redirect verified
- [ ] DNS TTL lowered to 300s one day before launch (fast rollback lever)

## 2. Environment & secrets

- [ ] Every variable in `.env.example` set in production — boot validation is the proof
- [ ] `AUTH_SECRET` freshly generated for prod (never reused from staging)
- [ ] `SEED_ADMIN_PASSWORD` changed; seed admin password rotated after first login
- [ ] No secrets in the repo, build logs, or client bundles (`grep` the built output)
- [ ] Separate OAuth credentials (Google/Apple) for prod with correct redirect URIs

## 3. Security

- [ ] CSP header present on production responses (curl and check)
- [ ] `/admin` and `/pos` unreachable when logged out and as CUSTOMER role (test all three)
- [ ] Rate limits verified by hammering `/api/newsletter` (expect 429)
- [ ] POS APIs return 403 for CUSTOMER-role session (defense-in-depth check)
- [ ] State machine verified: `PATCH /api/pos/orders` with `PAID → COMPLETED` returns 409
- [ ] Dependency audit clean or triaged: `pnpm audit --prod`
- [ ] Staff accounts created with least role needed (baristas = STAFF, not ADMIN)

## 4. Data & operations readiness

- [ ] Production seed reviewed: real prices, real hours, real phone, correct location lat/lng
- [ ] Menu proofread by a human (allergens especially — this is a liability surface)
- [ ] Coupon `FIRSTPOUR` limits confirmed intentional (15%, 1,000 uses)
- [ ] At least two staff trained on the POS flow incl. QR verify and the 409 error meaning
- [ ] Loyalty spot-check: one completed order awards exactly `round(total × 10)` meters, twice
      completed = awarded once (idempotency verified in prod)

## 5. Observability

- [ ] Log drain connected (Vercel → Datadog/Axiom/Logtail) — structured JSON lines visible
- [ ] Uptime monitor pointed at `/api/health` with 60s interval, alerting to a phone, not email
- [ ] Alert fires when health returns 503 (test by pausing the DB for 60s in a window)
- [ ] `order.created` and `order.status` events visible in the drain after the E2E order
- [ ] Error boundary verified: force a render error on a staging route, confirm digest logged

## 6. Performance

- [ ] Lighthouse on prod URL: Performance ≥ 95, LCP < 2s, FCP < 1s (Home and Menu)
- [ ] ISR confirmed: two requests to `/menu` within 5 min hit cache (check `x-vercel-cache`)
- [ ] Images served as AVIF/WebP via `next/image` (inspect response content-type)
- [ ] Fonts self-hosted via `next/font` — zero external font requests in the network tab
- [ ] Cold-start acceptable: first request after idle < 3s

## 7. Accessibility & SEO

- [ ] Keyboard-only pass: nav → menu tabs → diet filters → add buttons → newsletter (no traps)
- [ ] Skip-to-content link works and is first focusable element
- [ ] axe scan on Home + Menu: zero critical violations
- [ ] `prefers-reduced-motion` verified (OS setting on → no animations)
- [ ] JSON-LD validates in Google Rich Results test (CafeOrCoffeeShop)
- [ ] `robots`: marketing pages indexable; `/admin`, `/pos` noindex (already set — verify)
- [ ] Sitemap generated and submitted to Search Console; canonical URLs correct
- [ ] OG image exists at `/og.jpg` (currently referenced — **ship a real one**)

## 8. Legal & trust

- [ ] Privacy policy and Terms pages exist with real content (footer links currently point
      to routes that must not 404 at launch)
- [ ] Allergen disclaimer near menu ("prepared in a kitchen that handles gluten, nuts, dairy")
- [ ] Business identity in footer accurate (HimBean Coffee Pvt. Ltd., address, phone)
- [ ] Newsletter double-opt-in email wired via Resend before heavy list-building

## 9. Launch day & rollback

- [ ] Deploy at low-traffic hour; one engineer + one operator on watch for 2 hours
- [ ] Smoke script run post-deploy: health, home, menu, one order E2E, admin login, POS queue
- [ ] **Rollback lever:** Vercel "Promote previous deployment" (instant) — DB migrations for
      v3.0 are additive only, so rolling back the app does not require rolling back the schema
- [ ] Incident channel named and staffed; POS fallback agreed (paper tickets if the queue dies)
- [ ] First 24h review scheduled: error rate, p95 latency, orders completed vs abandoned

---

## Post-launch (first two weeks)

1. **Stripe integration** (v3.1 #1) — the moment money flows, revisit §3 and §5 in full
2. Watch the loyalty ledger for anomalies (idempotency working under real concurrency)
3. Collect barista feedback on POS timers/columns before adding the extended states
4. Baseline analytics before adding GA4/PostHog so before/after is measurable

> The shift this checklist represents: HimBean is no longer a website being built —
> it is a commerce system being operated. From here, truth is infrastructure.
