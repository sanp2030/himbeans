# Roadmap — Remaining Items & Why They're Not Built Yet

Status of the full ambition list, honestly. Items marked ✅ shipped in v7.2 or earlier;
items marked ⏸ need something only you can provide (credentials, product decisions, or
real-world data), and faking them would be worse than waiting.

## ✅ Already shipped (verify, don't rebuild)
- **Stripe PaymentIntents + Apple/Google Pay** — `automatic_payment_methods` enabled;
  Apple/Google Pay appear automatically in the PaymentElement on supported devices once
  your domain is registered in the Stripe dashboard. Webhook fulfilment flips PAID and
  awards loyalty meters (`metersForOrder` at the webhook seam). Needs only your keys —
  see `docs/STRIPE_SANDBOX_TEST.md`.
- **Extended POS states** — `ACCEPTED` and `QUALITY_CHECK` already exist in the enum as
  optional gates; the three-column POS skips them today and extends without breaking.
- **Inventory decrement + oversell guard** — atomic in the order transaction; 409 on
  out-of-stock; `inventory.oversell_blocked` logged.
- **Admin menu CRUD** (v7.2) — `/api/admin/products` GET/POST/PATCH, MANAGER+ only,
  every mutation audit-logged, soft-deactivate only (orders reference products, so hard
  deletes are forbidden by design). UI on `/admin`: inline price editing, 86'ing,
  featuring.
- **POS low-stock strip** (v7.2) — `/api/pos/low-stock` (BARISTA+), 60s poll, advisory
  strip above the queue.
- **Analytics** (v7.2) — GA4 + PostHog components, each activating only when its
  `NEXT_PUBLIC_*` key exists. CSP updated to allowlist their domains (they were being
  silently blocked before — the old CSP only allowed 'self').
- **PWA / offline** (v7.2) — `@serwist/next` service worker: precached shell + offline
  menu; orders, checkout, POS and admin deliberately bypass all caching (a stale order
  queue is worse than an offline error). `public/sw.js` generated at build.

## ⏸ Needs your input before building

### Firebase push notifications (order-ready, loyalty milestones)
**Blocker:** a Firebase project + FCM server key + VAPID keys only you can create.
**Seam already in place:** the order-status transition handler (where SMS fires today)
is the exact hook point; push becomes a third channel beside SMS/email, gated by
`FIREBASE_*` env keys like every other integration. ~half-day build once keys exist.

### AI personalization (time / weather / order history / store traffic)
**Blockers:** weather needs an API key (OpenWeather or similar); order-history
personalization needs real customer data that doesn't exist pre-launch; store traffic
needs a data source (POS order density is the honest proxy).
**Recommendation:** ship time-of-day personalization first (zero dependencies — morning
menu emphasis before 11am, iced emphasis after 2pm heat, decaf after 6pm), add weather
when you pick a provider, add history-based only after 4–6 weeks of real order data.
Building a "personalization engine" against imagined data is how you get confidently
wrong recommendations.

### Inventory forecasting, smart recommendations, store heatmaps
All three are models trained on operational data you don't have yet. Pre-launch, any
"forecast" would be fiction. Revisit at 8+ weeks of real orders; the AuditLog and
OrderEvent tables are already capturing everything these will need.

### Wholesale portal, corporate accounts
Product decisions first: pricing tiers, credit terms, approval workflow, who owns the
relationship. The schema extends additively (per MIGRATION_POLICY.md) once those are
decided — no rework risk in waiting.
