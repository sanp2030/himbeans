# Root-Cause Report — P0: Core Commerce Flow

**Method:** debug only, per directive. Full dependency install, `prisma generate`,
`tsc --noEmit`, `next build`, then runtime smoke against the compiled server (`next start`
+ curl of every page and API, including failure paths). No features added; no refactors of
working code. Six defects found; six minimal fixes applied; all verified.

**Confession first:** prior releases were verified by unit tests and structural checks but the
app had **never been compiled end-to-end**. That gap is where all of this hid. The truth
invariant now includes: no release without a passing `next build`.

---

## First failing point
`next build` fails on a type error in `src/app/api/orders/route.ts` — meaning **the site
cannot be built or deployed at all**. Cart and checkout are "broken" because in a production
deploy, nothing ships. (In `pnpm dev`, which ignores type errors, the flow fails later — see
Finding 4.)

## Findings (in discovery order)

**F1 — Build-blocking type error in order creation** *(the first failing point)*
`customization: Record<string, unknown>` is not assignable to Prisma's `InputJsonValue`.
Fix: one-line cast in the items map. File: `src/app/api/orders/route.ts`.

**F2 — Build-blocking: `mobile/` inside the web typecheck scope**
`tsconfig.json` included `**/*.ts(x)`, so the Expo app (react-native imports the web app
doesn't install) failed the web build. Fix: `"exclude": ["node_modules", "mobile"]`.

**F3 — Edge-runtime crash: middleware imported Prisma + bcrypt**
`middleware.ts` imported the full Auth config (PrismaAdapter, credentials/bcrypt). PrismaClient
cannot run in the Edge runtime → `/admin` and `/pos` would 500 in production. Fix: the
standard Auth.js v5 split — new edge-safe `src/lib/auth.config.ts` (JWT + OAuth providers
only) used by middleware; `auth.ts` composes it with the adapter and credentials for Node
routes. Verified: middleware bundles at 87.6 kB and `/pos` correctly 307-redirects anonymous
users at runtime.

**F4 — Checkout's location dependency was unguarded** *(the likely dev-mode symptom)*
`/api/locations` had no error handling: a DB hiccup (or an unmigrated/unseeded database)
crashed it — which also **failed the build** at prerender. Downstream, an empty locations list
let checkout submit `locationId: ""` → 400 "Invalid input" with no useful message. Fixes:
try/catch returning `{ locations: [], degraded: true }`; checkout blocks submit and shows
"Online ordering isn't available right now…" when no location is configured.

**F5 — `/api/health` was statically prerenderable**
A GET using no request data gets prerendered — a health check cached forever would defeat
uptime monitoring. Fix: `export const dynamic = "force-dynamic"`. Verified at runtime: with
the DB down it returns `503 {"status":"degraded","database":"unreachable"}` live.

**F6 — (UX guard, part of F4)** clear customer-facing message on the degraded path.

## Most likely real-world cause for "customers can't order"
Two paths, matching the two ways to run the app:
- **Deployed / `pnpm build`:** F1–F3 → build fails → nothing serves.
- **`pnpm dev`:** builds are lax, cart works (client-side), but if the database was never
  migrated/seeded, menu shows no products (nothing to add) and checkout fails via F4.
  **Verify on your machine:** `.env` has a reachable `DATABASE_URL`; then
  `pnpm db:migrate && pnpm db:seed && pnpm build && pnpm start`.

## Verified in this environment
✅ `tsc --noEmit`: 0 errors ✅ `next build`: succeeds, full route table
✅ Runtime smoke (compiled server): home/menu/checkout/tracker 200 with expected content;
orders API rejects garbage 400; locations degrade gracefully; health 503 when DB down;
`/pos` 307 → login; `/api/pos/orders` 403 anonymous ✅ 27 unit tests passing
**Not verifiable here (environment limits, not code):** live DB queries (Prisma engine
binaries and Google Fonts hosts are blocked in this sandbox — both work in normal deploys).
The full DB-backed order E2E remains the checklist §0 gate on your infrastructure.
