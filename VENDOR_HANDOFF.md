# HimBean — Vendor Handoff (v7.2)

Complete production codebase for the HimBean specialty-coffee platform.
Next.js 15 · TypeScript · Tailwind · Prisma/PostgreSQL · Auth.js · Stripe.

## Start here
1. `QUICKSTART.md` — local setup (Windows/PowerShell steps incl. Docker Postgres)
2. `.env.example` — every integration key, documented inline (Stripe, Resend, Twilio, GA4, PostHog)
3. `docs/API.md` — API surface for external integration
4. `docs/INTEGRATION_BASE44.md` — CORS bridge pattern for embedding/linking from another site
   (`PUBLIC_CORS_ORIGINS` env allowlists your domain; ops routes deliberately excluded)

## Operational docs
- `docs/RUNBOOK.md` — day-to-day operations, outage procedures
- `docs/RELEASE_GATE.md` — 16-step go-live checklist (**includes a legal blocker:
  the social-proof press quotes/reviews are placeholders and must be replaced with real,
  permissioned content before launch**)
- `docs/STRIPE_SANDBOX_TEST.md` — end-to-end payment test runbook
- `docs/ROADMAP.md` — what's built vs. what awaits credentials/data
- `docs/DECISIONS.md` — 12 ADRs explaining why things are the way they are
- `docs/MIGRATION_POLICY.md` — schema is additive-only; no renames/drops

## Verified state at packaging
typecheck 0 errors · production build passing (incl. service worker generation) ·
33/33 unit tests · 0 axe-core accessibility violations across all public pages ·
Lighthouse CI workflow ready (`.github/workflows/lighthouse-ci.yml`, activates on GitHub push).

## Integration contact points
- Orders API: `POST /api/orders` (CORS-enabled when origin allowlisted)
- Order status: `GET /api/orders/[id]` (capability URL)
- Locations: `GET /api/locations`
- Webhooks in: `/api/webhooks/stripe` (signature-verified)
