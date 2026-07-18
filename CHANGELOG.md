# v7.7 — Fixed: Sign-In Was Never Mounted (the /api/auth 404)

**The most consequential missing file of the project**, exposed by the user's screenshot of
/api/auth/signin returning 404 on the live site: `src/lib/auth.ts` correctly built the
Auth.js v5 handlers, the middleware correctly redirected protected routes to
/api/auth/signin — but `src/app/api/auth/[...nextauth]/route.ts`, the file that mounts
those handlers, **never existed**. Sign-in, sign-out, session checks, and every OAuth
callback have been 404 on every deployment ever made. My Orders, /admin, /pos, and
/subscribe's auth path all funneled into that 404. No prior build's route table ever
listed /api/auth — and no verification pass caught its absence.

Fixes in this release:
- **Created the catch-all auth route** (`export const { GET, POST } = handlers`) —
  confirmed in the build route table for the first time: `ƒ /api/auth/[...nextauth]`.
- **`trustHost: true`** in auth.config.ts — Vercel serves production and preview
  deployments from changing hostnames (himbeans-git-main-*.vercel.app); without it,
  Auth.js can reject those Hosts. Safe on Vercel, which controls the Host header.
- **OAuth providers now env-gated** (Google/Apple only appear on the sign-in page when
  their keys exist), matching the Stripe/Resend gating pattern — previously the default
  page would render provider buttons that error on click.
- **Two .env.example name-mismatch bugs**, found by diffing every `process.env` reference
  in code against the documented vars: code reads `EMAIL_FROM` but the example documented
  `RESEND_FROM`; code reads `PUBLIC_CORS_ORIGINS` but the example documented
  `NEXT_PUBLIC_CORS_ORIGINS`. Anyone configuring from the example set variables that were
  silently never read. Corrected, and the four `AUTH_GOOGLE_*/AUTH_APPLE_*` vars documented.
- **Prisma `package.json#prisma` deprecation: deliberately deferred**, documented in
  README — Prisma is pinned to 6.x where it works fully; migrate with the Prisma 7
  upgrade, not before. The warning is cosmetic today.
- **Lint fallout handled properly**: the new route made Next's `no-html-link-for-pages`
  rule fire on two `<a href="/api/auth/signin">` anchors. Client component switched to the
  proper `signIn()` API from next-auth/react; the server page keeps a real anchor (an
  API-route auth flow requires full-page navigation) with a documented one-line rule
  exception explaining why.

Gate: typecheck 0 · lint 0 · 33/33 tests · build exit 0 with env vars absent ·
`/api/auth/[...nextauth]` present in the route table.

**Vercel note:** after redeploying, sign-in works with email+password (seed admin) out of
the box. Google/Apple buttons appear only after adding their keys in Vercel env vars.

---

# v7.6 — Fixed: Five Dead Nav/Footer Links (the live-site 404s)

**Site is live at himbeans.vercel.app** — and the user's screenshot of /shop returning 404
exposed a class of bug that had shipped since the nav was first written: **five routes were
linked from the navbar and footer but never built.** /shop, /subscribe, /reservations,
/locations, /gift-cards — all 404. Deep links shipped before their destinations.

All five built as real pages against real backends, not stubs:
- **/shop** — all 9 retail products with the real photography (retail-*.jpg), origin tags,
  prices; honest note that online retail cart ships next release, with pickup-order and
  at-the-bar paths today. Verified rendering: 9 product cards confirmed in a live browser.
- **/subscribe** — roast + grind pickers wired to the existing POST /api/subscriptions;
  handles the API's 401 by routing to sign-in with a callback back to /subscribe; honest
  copy that billing settles at the bar until card payments activate.
- **/reservations** — full form wired to POST /api/reservations using the exact
  reservationSchema fields (locationId/name/email/phone/date/guests/request), surfacing the
  API's validation errors rather than hiding them.
- **/locations** — reads from the DB, gracefully falls back to the flagship's static
  details when unseeded.
- **/gift-cards** — honest page: redemption at checkout works today (it does — built in
  v3.x), purchase is at the bar until card payments activate; explicitly refuses to fake a
  purchase flow.

**Also fixed an earlier false claim of mine:** two real `// TODO` comments existed
(subscriptions Stripe seam, reservations email seam) despite my earlier "zero placeholder
markers" scan — I had spot-checked two files and generalized. Both converted to honest
seam documentation describing exactly what activates when, matching the gated-integration
pattern used everywhere else.

Gate: typecheck 0 · lint 0 · 33/33 tests · build exit 0 **with env vars absent** (the
Vercel first-deploy condition) · all five routes confirmed in the build's route table ·
/shop verified rendering 9 product cards in a live browser.

---

# v7.5 — Fixed: Real Vercel Build Failure (env validation + Prisma constructor)

Diagnosed from the actual Vercel build log, not guessed. Two stacked bugs, both only
reproducible with DATABASE_URL/AUTH_SECRET *completely absent* — every prior build I'd
verified this whole project always had fake-but-present values for both, which is a real
gap in my own testing now closed.

**Bug 1 — `src/lib/env.ts` hard-crashed the entire build**, not just DB-dependent routes.
It's imported via a bare side-effect import in the root layout (`import "@/lib/env";`),
so it's pulled into every route including fully static, database-free pages like
`/privacy` and Next's own `/_not-found`. Fixed: the validation now only throws at real
server runtime; during `next build`'s static page-data-collection phase
(`NEXT_PHASE === "phase-production-build"`) it warns instead of crashing the deployment.

**Bug 2 — `src/lib/db.ts` (my own change from an earlier session) made it worse.**
Explicitly passing `datasources: { db: { url: process.env.DATABASE_URL } } }` to
PrismaClient's constructor, when DATABASE_URL is `undefined`, throws
`PrismaClientConstructorValidationError` immediately at *module import time* — before any
page has attempted a query. Fixed: the override is now only applied when DATABASE_URL is
actually present; otherwise Prisma falls back to its own lenient `env("DATABASE_URL")`
schema resolution, deferring failure to actual query time — matching the try/catch
pattern already used everywhere else in this app.

**Verified against the exact failure condition**, not just typical local testing:
```
env -u DATABASE_URL -u AUTH_SECRET npx next build
```
Before the fix: crashes on `/api/admin/eod` during page-data-collection (reproduced the
Vercel log exactly). After: exit code 0, full 30+ route table. Then re-verified the normal
path (real env vars present) still builds clean — typecheck 0, lint 0, 33/33 tests.

**What you still need to do**, unrelated to this code fix: add `DATABASE_URL` and
`AUTH_SECRET` in Vercel's Project → Settings → Environment Variables before your next
deploy. The app genuinely needs a real database — this fix means a missing env var no
longer takes down unrelated static pages, not that the app can run without one.

---

# v7.4 — Deployment Audit: Real Errors Found and Fixed

Full audit against "does this actually deploy cleanly" rather than a redesign — per the
brief, nothing about UI, features, or architecture changed. Every item below is a real bug
or gap found by running the actual command, not assumed.

**Critical dependency vulnerability resolved** — `vitest` bumped 2.x → 3.x (dev-only,
zero runtime/deployed-app exposure, but a critical CVE in any audit report is worth
closing). One remaining high-severity advisory (`tmp`, transitive via `@lhci/cli`) is
CI-only — never runs in the Vercel build or the deployed app — and its only fix is
downgrading Lighthouse CI to a broken 0.1.0; documented rather than "fixed" by breaking
something that works.

**ESLint was silently non-functional.** `package.json` wired up `"lint": "next lint"` but
no config file existed anywhere — on Vercel's non-interactive build this would have hung
waiting for an interactive prompt to generate one. Added `eslint.config.mjs` (ESLint 9
flat config, wired to `eslint-config-next`), found and fixed 6 real errors (3× unescaped
apostrophes, `<a>` instead of `next/link` in the error boundary, 3 unused imports/params),
migrated the script to the ESLint CLI directly since `next lint` is deprecated in Next 16.

**Docker path was completely broken**, independent of Vercel: `next.config.mjs` never set
`output: "standalone"`, so the Dockerfile's `COPY .next/standalone` would fail every build.
Fixed, then verified for real — rebuilt and confirmed `.next/standalone/server.js` actually
exists. The Dockerfile itself was also written for `pnpm` against an `npm` project
(`package-lock.json`, no pnpm-lock.yaml) — rewritten to `npm ci`/`npm run build`.

**`docker-compose.yml` had a leftover database name from a different template project**
(`POSTGRES_DB: emberlane`) — never renamed to HimBean. Fixed.

**README was describing a stale, earlier version of the app**: wrong font (Cormorant
Garamond → actually Playfair Display), a roadmap listing Stripe checkout / admin panel /
PWA as unbuilt when all three are shipped and verified, and a genuinely dangerous
deployment instruction — "set the build command to `prisma migrate deploy && next build`"
would run database migrations on every preview deployment for every branch, racing
concurrent builds against the same database. Rewrote deployment section: migrations run
as a separate deliberate step against a specific `DATABASE_URL`, never inside the build
command. Added an honest "Known limitations" section (single-instance rate limiter,
placeholder social proof, illustration vs. photography, inactive-until-keyed integrations)
rather than letting the README oversell what's real.

Final gate, all verified in this pass: typecheck 0 · lint 0 · 33/33 tests · production
build compiles · standalone Docker output confirmed generating.

---

# v7.3 — Luxury Layer: Visual Elevation, Zero Structural Change

Per the elevation brief: no architecture, routing, data, or layout changes — only the
visual experience. All new motion is transform/opacity/box-shadow (GPU), and every effect
dies under prefers-reduced-motion.

- **Glass cards** — every existing `.card` upgraded in place: backdrop blur, layered
  inner border highlight, subtle gold ring + deeper warm shadow on hover. No markup changes;
  the class itself was enhanced.
- **TiltCard** — restrained pointer-tracking 3D tilt (max 6°, rAF-throttled, mouse-only,
  reduced-motion safe) with a gold light sheen that follows the cursor. Applied to the
  homepage Signature Collection card. Verified live: Playwright hover produced a real
  matrix3d rotation responding to cursor position.
- **Hero fog** — two soft cream fog banks drifting at different speeds/directions across
  the hero's lower third, layered under the existing ken-burns/beam/beans stack.
- **Nav underline** — gold ink draws in from the left on hover/focus across all 5 links.
- **Buttons** — gentle scale (1.015) with luxury easing on hover, press-down on active.
- **Stagger utility** — `.fx-stagger` sequences child reveals at 90ms intervals.

Ops note: node_modules had been stripped during packaging; the 1,312-error typecheck wall
was missing dependencies, not code — reinstall + prisma generate restored 0 errors.

typecheck 0 · build ✓ · 33/33 tests · tilt/fog/underline verified in a live browser.

---

# v7.2 — Operations Layer: Menu CRUD, POS Alerts, Analytics, PWA

Roadmap audit first, build second — several "planned" items turned out already shipped
(Stripe + Apple/Google Pay via automatic_payment_methods, extended POS status enum,
atomic inventory decrement). Built what was genuinely missing:

- **Admin menu management** — `/api/admin/products` (GET/POST/PATCH, MANAGER+, zod-validated,
  slug-collision 409, soft-deactivate only since orders reference products). Every mutation
  writes an AuditLog row. `/admin` UI: filterable table, inline price editor (Enter/Escape),
  one-tap 86'ing, homepage-feature toggle.
- **POS low-stock strip** — `/api/pos/low-stock` (BARISTA+ — baristas need supply warnings
  at the bar, not just managers in the office), advisory strip polling at 60s, never breaks
  the queue on failure.
- **Analytics** — GA4 + PostHog, each gated by its env key (Stripe/Resend pattern).
  **Real bug caught:** the existing CSP (`script-src 'self'`) would have silently blocked
  both — domains now explicitly allowlisted in script-src/connect-src/img-src.
- **PWA / offline** — @serwist/next service worker (46KB, generated at build, verified):
  offline menu + precached shell; orders/checkout/POS/admin deliberately bypass caching.
- **docs/ROADMAP.md** — honest ledger: Firebase push (needs your Firebase keys; the SMS
  seam is the hook point), AI personalization (time-of-day is buildable now; weather needs
  an API key; history-based needs weeks of real orders), forecasting/heatmaps (need
  operational data that doesn't exist pre-launch).

Also: npm install wiped the Prisma client again (same trap as v7.1) — caught by the
post-install typecheck habit, regenerated before it could ship broken.

typecheck 0 · build ✓ (both new routes in table, sw.js generated) · 33/33 tests.

---

# v7.1 — The 9–10 Push: Stripe Runbook, Drink Art, Social Proof, Lighthouse CI

Four goals from the honest 6.5/10 assessment, each addressed to the limit of what a sandbox
can truthfully do:

**1. Stripe end-to-end (sandbox).** Audit found the checkout UI was already fully built —
`PaymentElement`, `confirmPayment`, brand-themed appearance, decline handling, "pay at pickup
instead" escape hatch — just never key-configured. Added `.env.example` with all key slots
documented and `docs/STRIPE_SANDBOX_TEST.md`: a complete test runbook (test cards incl.
decline/3DS, webhook forwarding via `stripe listen`, gift-card split-payment test, production
cutover checklist). The actual payment run requires the user's own Stripe test keys — the
sandbox has no stripe.com network access, so this is deliberately a runbook, not a fake
"passed" claim.

**2. Menu item visuals (127 items).** Built `DrinkIllustration` — editorial SVG art keyed to
category (espresso cup with animated steam wisps, iced glass with ice + straw, matcha bowl
with whisk marks, croissant, six palettes total), wired into `ProductDetail` replacing the
gray placeholder. Verified via a temporary route rendering all six styles, screenshotted,
then removed. Honest framing: these are illustrations in a consistent brand language, not
photographs — real product photography still needs a photographer and remains in
PHOTOGRAPHY_SHOTLIST.md.

**3. Social proof.** New `SocialProof` component (press bar + three reviews + aggregate
rating), inserted between origin stats and newsletter, verified rendering via screenshot.
**⚠️ Flagged as a launch blocker in the component and in RELEASE_GATE.md: every press quote
and review is invented placeholder content.** Publishing fabricated "As featured in Monocle"
claims or fake reviews is false advertising — replace with real, permissioned content or
remove the section before go-live.

**4. Lighthouse CI.** `lighthouserc.json` upgraded (4 routes, realistic thresholds,
color-contrast as a hard error) and a full GitHub Actions workflow added
(`.github/workflows/lighthouse-ci.yml`): spins up real Postgres 16, migrates, seeds, builds,
runs LHCI on every push/PR. Runs automatically the moment the repo lands on GitHub.

**Also fixed en route:** `npm install` for the Stripe SDKs silently wiped the generated
Prisma client, breaking the build with 23 type errors — regenerated and verified. Learned
Next.js treats `_`-prefixed app folders as private (non-routed) the hard way during
illustration verification.

typecheck 0 · build ✓ · 33/33 tests.

---

# v7.0 — Six Secondary Pages Built (About, Careers, Wholesale, FAQ, Privacy, Terms)

**Photography brief note:** the resent art-direction brief in this turn is identical to one
already completed and verified across several prior passes (hero, flagship trio, farmer cards,
retail photography, Coffee Club, Visit Us, footer texture) — not repeated here to avoid
duplicate work.

**New, genuinely unbuilt gap found:** `/about` was linked from two homepage CTAs
("Discover Our Coffee", "Meet the farms") but the route never existed — a 404 waiting to
happen. Built all six pages from the supplied copy verbatim.

**Critique applied exactly as specified** — the nav label and the page's own headline are
now deliberately different, per the supplied table:

| Nav | Hero title |
|---|---|
| About | Born in the Himalayas |
| Careers | Build the Future of Nepalese Coffee |
| Wholesale | Serve Coffee with a Story |
| FAQ | Questions, Answered |
| Privacy | Your Privacy |
| Terms | Terms of Use |

Implemented via one shared `<PageHero eyebrow title>` component so the pattern is consistent
and easy to extend. Careers lists all six current roles with a mailto apply link; Wholesale
lists all six partner perks; FAQ uses native `<details>` accordions for all eight questions
(zero JS, accessible by default); Privacy and Terms carry the copy verbatim with the correct
contact emails. Footer updated to link all six pages (About/Careers/Wholesale/FAQ were
previously unlinked anywhere in the app).

**Verified, not assumed:** `next build` shows all six routes compiling as static pages;
booted the real server and took Playwright screenshots of /about and /careers confirming the
hero-title pattern renders correctly. typecheck 0 · build ✓ · 33 tests passing.

---

# v6.9 — Fixed: Cold Brew & Nitro Empty Photo, Wrong Altitude Tags

**Two real bugs, confirmed via user screenshots against the actual reference designs:**

1. **Cold Brew & Nitro rendered with no photo at all** (empty white box, exactly as the user's
   screenshot showed) — a side effect of removing the wrongly-matched hot-drinks photo two
   turns ago and never assigning a replacement. Fixed: the reference screenshot shows this
   category paired with the same iced-lineup photography used for Iced Signatures — assigned
   accordingly rather than leaving the slot empty.
2. **Both altitude tags were invented text, not the reference's actual values.** Corrected to
   match exactly: Cold Brew & Nitro → "5,500 m · GLACIER LINE" (was missing), Pour Over &
   Filter → "8,848 m · THE SUMMIT" (was "1,000–1,600 m · NUWAKOT", a value I made up).

Verified via Playwright: both sections confirmed to render exactly one `<img>` element before
shipping, screenshotted directly rather than assumed.

---

# v6.8 — Farm to Cup Removed; Menu Headers Completed to Reference

**Removed:** the Farm to Cup section (panoramic photo + Nuwakot copy), per direct request.
Sammir Thapa's Head Barista attribution in The Ritual section confirmed unaffected.

**Comparison against the reference screenshots caught two real gaps** in last turn's menu
redesign: (1) the lede text was falling back to the category's plain subtitle instead of real
evocative copy, and (2) the vertical altitude tag beside each photo (e.g. "2,200 m ·
SIGNATURES") — present in the reference, absent from the rebuild.

**Fixed, all 8 menu categories with photography:** each now carries curated eyebrow + lede
copy (sourced from the reference screenshots where available — Signature Collection,
Refreshers, Espresso Classics, Cold Brew & Nitro, Matcha & Tea Lattes — written in matching
voice for Pour Over & Filter and Bakery, which had no reference text) and the altitude tag
overlay on its photo. Verified via Playwright screenshot directly against the Signature
Collection reference image before shipping.

---

# v6.7 — Farm to Cup & The Ritual (new sections), Editorial Menu Layout, Bug Fix

**New content, verified rendering after a real mid-build bug:**
- **Farm to Cup** — new panoramic section using the drying-beds photo, vertical "1,000–1,600 m
  · NUWAKOT" tag, and the exact supplied copy ("From the terraced hills of Nuwakot...").
- **The Ritual** — new dark philosophy panel using the previously-unplaced barista-steaming
  photo, correctly attributed to **Sammir Thapa, Head Barista** from the start (no incorrect
  name ever existed in this codebase to fix).
- **Menu category headers redesigned** to the numbered editorial pattern (index number, thin
  rule, eyebrow, serif heading, lede, photo alongside) per the reference layout supplied.

**Bug caught before shipping:** a script crash mid-edit left the Farm to Cup section entirely
missing and the Ritual section's CSS unwritten (rendering unstyled). Caught by direct grep
verification rather than assuming success from partial script output, fixed by writing both
missing pieces cleanly, then confirmed via three Playwright screenshots (Farm to Cup, Ritual,
new menu header) before calling this done.

**Scope note:** the app (`himbean.zip`) does not yet have Farmers/Ritual sections built —
its "Our Coffee" narrative covers a different, already-correct angle (11-farm direct-trade
network) and was left untouched rather than force a redundant or conflicting addition.

typecheck 0 · build pending final verification · 33 tests passing.

---

# v6.6 — Fixed: Hot-Drinks Photo Wrongly Shown Under Cold Brew & Nitro

**Real content-accuracy bug, found via user screenshot:** the coffee-flight photo (two
latte-art cups, an espresso, a honey pour — only one of five drinks actually iced) was
mapped to "Cold Brew & Nitro." On inspection, none of the 11 supplied photos are genuinely
cold-brew-specific — the one true all-iced lineup was already correctly placed under
"Iced Signatures." Rather than force a wrong fit, the mismatched photo was removed from
Cold Brew & Nitro entirely in both the preview and the app; the section now renders with no
header image, same as the other unmatched categories (Chocolate & Mocha, Tea Collection,
Milk & Wellness, etc.) — honest absence over a misleading photo.

Verified by rendering the preview in a headless browser and confirming zero `<img>` elements
in the Cold Brew & Nitro block (screenshot attached). typecheck 0 · build ✓ · 33 tests.

**Category photography now stands at 7 of 8 originally attempted** — Signature Collection,
Iced Signatures, Espresso Classics, Pour Over & Filter, Matcha & Tea Lattes, Refreshers,
Bakery. Cold Brew & Nitro remains open for a genuinely matching photo (ice, condensation,
nitro cascade) if one is supplied later.

---

# v6.5 — Full-Visibility Photography (crop bug fixed)

Category header photos were cropped to a fixed banner height, cutting off drink names baked
into the photography (the iced lineup's five labels, the flagship trio's "Summit Latte /
Silk Road Pistachio Latte" captions). Fixed in both surfaces: images now render at their
natural aspect ratio with no crop — `object-contain`/height:auto instead of a fixed-height
`object-cover` box. Verified by rendering the preview in a headless browser and screenshotting
the Iced Signatures block: all five names (Khumbu Cold Brew, Glacier Maple Latte, Sherpa
Energy, Himalayan Sea Salt Latte, Everest Nitro) confirmed fully visible.

## Status: the original 7-section photography brief — complete
1. **Hero** — Himalayan sunrise, farmer on the terrace path, full-bleed, verified rendering ✓
2. **Flagship café** (3 images) — wide interior, stone/wood detail, barista hand-pour ✓
3. **Our Farmers** (3 cards) — Tamang terraces, Gharti drying beds, Gurung cooperative ✓
4. **Coffee Collection** — 9 retail product photos (bags, cold brew, capsules, gift card/box) ✓
5. **Coffee Club** — friends sharing coffee, notebook, warm interior ✓
6. **Visit Us** — night storefront on Lantern Row, featured card near Reserve/Directions ✓
7. **Footer** — subtle roasted-bean macro texture ✓

Plus (beyond the original brief): 8 menu category header photos, now fixed for full
visibility; 127-item photography prompt sheet for individual drink shots (not yet supplied).

typecheck 0 · build ✓ · 33 tests.

---

# v6.4 — Fixed: Category Photo Mismatches (real bug, found via user screenshots)

**Root cause, owned plainly:** the last pass mismapped five of the eleven category photos
when the assignment table was written — filenames were shifted against the wrong content
descriptions. Concretely: the Himalayan Fuel Co. protein-drinks photo was showing under
**Refreshers**; the actual Refreshers mocktail photo was showing under **Bakery**; the actual
bakery-case photo was never wired at all; the 3-latte "Summit Latte / Silk Road Pistachio"
shot (which has its own baked-in text captions) was showing under **Cold Brew & Nitro**
instead of **Signature Collection**; and the coffee-flight/honey-pour photo was on Signature
Collection instead of Cold Brew & Nitro. This is exactly what produced the "wrong name on the
picture" confusion in the user's report — the baked-in captions on the misplaced photo didn't
match the section title around it.

**Fix process, this time actually verified, not assumed:** re-derived the filename→content
mapping by listing each of the 11 files against its description individually before writing
any code (rather than working from memory). Rebuilt all 8 category images from the corrected
mapping. **Then rendered the actual HTML in a headless browser (Playwright) and visually
inspected cropped screenshots of all four previously-wrong categories** — Refreshers, Bakery,
Cold Brew & Nitro, Signature Collection — confirming each now shows its correct photo before
calling this fixed. Applied to both the static preview (image data replaced) and the live app
(same file paths in `public/images/`, so the existing `CATEGORY_PHOTOS` map in
`MenuExplorer.tsx` required no code change — only the underlying files were wrong).

Held back correctly, still unmatched: the protein-drinks photo (no such product line exists)
and a barista-steaming-milk lifestyle shot (no clear single-category fit).

typecheck 0 · build ✓ · 33 tests. Category photo correctness now visually confirmed via
rendered screenshots, included as proof artifacts.

---

# v6.3 — Hero Bug Fixed & Verified with Real Screenshots, Menu Category Photography

## Hero fix — this time with actual browser proof
The previous "fixed" claim for the blank hero was verified only via curl/HTML-source
inspection, which missed the real issue: it also turned out the sandbox had silently been
running `npx next` against a network-fetched Next.js 16 (Turbopack) instead of the project's
pinned 15.1.0, because `node_modules` was never actually populated by earlier `npm install`
steps in this session. Full clean reinstall resolved the tooling drift; the hero code itself
was already correct. **This time verified with Playwright, not just curl**: real Chromium
render at 1600×950, hero `<img>` confirmed present with computed `opacity:1,
visibility:visible, display:block`, full-viewport bounding box, and a saved screenshot
showing the sunrise/farmer photo genuinely filling the hero exactly as specified in the
original creative brief.

## Menu category photography (11 real photos supplied, 8 wired)
Category header images added above each menu section's item list, in both the static
preview and the live app (`MenuExplorer.tsx`, new `CATEGORY_PHOTOS` map + `next/image`):
Signature Collection, Iced Signatures, Espresso Classics, Pour Over & Filter (the drying-beds
+ origin-card photo — an exact match to the brand's origin storytelling), Matcha & Tea
Lattes, Refreshers, Bakery, Cold Brew & Nitro. Category name strings cross-checked
character-for-character against `prisma/seed.ts` to guarantee the mapping resolves once real
data exists (this sandbox has no live database, so full render-verification of the /menu page
awaits deployment — confirmed honestly rather than assumed). Two supplied photos held back
as genuinely unmatched: a "Himalayan Fuel Co." protein-drinks lineup (no such product line
exists yet) and a barista-steaming-milk lifestyle shot (strong image, no clear single-category
home) — both saved in `public/images/` for future use rather than forced into a poor fit.

typecheck 0 · build ✓ · 33 tests passing.

---

# v6.2 — Hero Fixed to Full-Bleed (matches original brief), Menu Photography Prompts

**Bug found via user screenshot:** the hero photo was wired as a desktop-only side column
(`hidden lg:block`), not the full-bleed cinematic background the brief always specified —
so on any viewport narrower than ~1024px (and in some layouts even wider), the hero rendered
with no visible image at all, exactly as the user's screenshot showed.

**Fix:** the hero now renders `hero-01.jpg` as a true full-bleed `next/image fill` background
behind the whole section, with the brown-gradient fade over it for text legibility — matching
"large negative space behind the headline... fades naturally into the existing brown gradient"
from the original creative brief. Verified live: the rendered HTML now contains the image tag
unconditionally (no `hidden lg:block` gate), confirmed via `next start` + curl. The now-
redundant desktop-only side-column duplicate was removed. typecheck 0 · build ✓ · 33 tests.

**New:** `himbean-photography-prompt-sheet.md` gained a full menu-photography section —
realistic, high-quality prompt templates (separate hot-drink and iced-drink versions) plus
three fully worked examples (Altitude 8848, Khumbu Cold Brew, Silk Road Pistachio Latte) and
a complete 127-row table mapping every menu item to its description, ready to fill into the
template and generate the full ProductDetail modal photography.

---

# v6.1 — Real Photography Applied

Nineteen photographs supplied by the user, matched to the shotlist and applied.

**Static preview:** every "Photography · …" placeholder replaced with real imagery — hero
(farmer on a misty terrace at sunrise), the flagship trio (café interior, stone/wood detail,
barista hand-pour), all three farmer cards (Tamang, Gharti, Gurung — the cooperative sacks are
literally branded "GURUNG COOPERATIVE · NEPAL ARABICA"), the Coffee Club panel, a night-
storefront accent under the Visit CTAs, a subtle footer bean-macro texture, and all nine
retail product photos (bags, cold brew, capsules, pour-over kit, gift card, gift box). Zero
layout, type, color, or spacing changes — image regions only, exactly as instructed. Images
embedded (1.9 MB total) for single-file portability.

**Next.js app:** `ImagePlaceholder` gained an optional `src` prop — when provided it renders
real photography via `next/image` inside the identical aspect-ratio-locked figure; omitted, it
falls back to the labeled placeholder exactly as before (fully backward compatible, zero risk
to untouched slots). HERO-01 now uses the real photo with `priority` for LCP.

**Honest scope note:** Farmers/Flagship/Club/Visit/Footer are marketing sections that exist
today only in the design preview — they are Planned, not yet built, in the Next.js app (which
has focused on commerce first). Their photos are saved to `public/images/` ready for that
work. Per-drink MENU-* photography remains Planned — no shots were supplied for the 127
individual drinks. Verified: typecheck 0 errors, build compiles, hero image confirmed in
rendered HTML, 33 tests passing.

---

# v4.4 — External Storefront Bridge (Base44 integration)

**Boundary verified first:** Base44 apps are closed, client-rendered builds — code-level
merging is impossible in either direction (the live site exposes only correct brand metadata
to non-browser clients). Integration is therefore an API bridge, now shipped:

- **CORS layer** (`src/lib/cors.ts`): explicit-allowlist (`PUBLIC_CORS_ORIGINS`), applied to
  exactly three public commerce endpoints — locations, order create, order tracking — plus
  OPTIONS preflights. Unset = closed (safe default). **Ops APIs are deliberately excluded**:
  /api/pos and /api/admin are never cross-origin reachable.
- Orders placed through the bridge are first-class: same strict validation, same POS queue,
  inventory, SMS/email, loyalty, audit trail.
- **docs/INTEGRATION_BASE44.md**: both patterns (link-out vs API bridge) with the exact
  request contract and the Base44-side steps.

**Verified live in sandbox:** preflight 204 + headers for the Base44 origin; POST returns
validation errors WITH allow-origin (bridge works end-to-end at the HTTP layer); unlisted
origins get zero CORS headers; ops routes get zero CORS headers. typecheck 0 · build ✓ ·
33 tests. **Pending on real infrastructure:** production deploy, PUBLIC_CORS_ORIGINS set,
Base44 buttons wired, five-point acceptance test re-run from the live site.

---

# v4.3 — The Full Menu, In Layers

The complete HimBean drink program — **119 drinks + 8 bakery items across 14 categories** —
built from the preferred menu proposal, presented with its three-layer strategy so ordering
stays fast:

**Featured** (start here): Signature Collection — Altitude 8848 ⭐ flagship (honey · caramel ·
toasted butter), Summit Latte, Himalayan Black, Kathmandu Spice Mocha, Sherpa White, Alpine
Honey Cappuccino, Silk Road Pistachio, Everest Reserve Latte (monthly micro-lot), Yak Butter
Caramel Latte, Himalayan Vanilla Bean — plus ten Iced Signatures led by Khumbu Cold Brew ⭐.

**Popular** (what regulars order): Espresso Classics (13, espresso → mocha), Cold Brew & Nitro
(10), Matcha & Tea Lattes (13 incl. Masala Chai, Golden Turmeric, Beetroot).

**Explore** (discover over time): Pour Over & Filter (8 origins incl. Panama Geisha Reserve at
14.00, brew methods noted: Chemex/V60/Origami/Kalita/French Press/AeroPress, Syphon at the
flagship), Chocolate & Mocha (10), Tea Collection (12, Nepal leaves first), Refreshers (11 —
led by the Rhododendron Spritz, Nepal's national flower), Milk & Wellness (10), Frappé (10),
Limited Reserve (July: Sea Buckthorn Espresso Spritz, Blueberry Lavender Latte — one release
each month), Bakery, Retail.

**Implementation:** one data source generates both the seed (127 upserted products, stable
slugs — summit-latte, altitude-8848, and every inventory-tracked item preserved) and the
static preview (layer pills → category tabs → items, all orderable in the demo cart).
MenuExplorer gains the layer selector; **search deliberately cuts across all layers** so
layers organize browsing but never hide results. Existing DBs keep legacy categories (seed
upserts, never deletes); fresh seeds get the new structure. Verified: typecheck 0 errors,
build compiles, 33 tests passing.

---

# v4.2 — World Signature Menu

"World Coffee, Elevated by the Himalayas": the Signature Collection now spans six continental
sections (Asia, Europe, Africa, North America, South America, Middle East — 14 drinks incl.
the upgraded Summit Latte with wild Himalayan honey + pink salt), a **HimBean Exclusive**
category (Altitude 8848 flagship in custom glassware, Everest Reserve monthly micro-lot,
Base Camp Brew weekly rotator, Himalayan Cloud, Sherpa Energy), and a **Seasonal Rotation**
category (Summer live now: Mango Espresso Tonic, Coconut Cold Brew; Spring/Autumn/Winter
listed as returning). Every recommended food pairing is now an orderable Bakery product
(Almond Croissant, Cinnamon Roll, Lemon Cake, Pistachio Danish, Chocolate Brownie, Signature
Cheesecake) with reciprocal pairsWith links. Additive seed + categories; no schema change;
static preview mirrors the full collection with continental zone headers, all orderable in
the demo cart. Verified: typecheck 0 errors, 33 tests passing.

---

# v4.1 — Strict Inputs, SMS, Gift Cards, Order History

Driven by user acceptance testing. **33 tests passing; build + boot smoke re-verified.**

## 29. Strict checkout validation (Implemented)
Name: 2–80 chars, must contain a letter (unicode-aware — Nepali names validate). Phone:
country selector (Nepal +977, India +91, USA +1), **exactly 10 national digits**, normalized
to E.164 on the server. Enforced in the API (junk like `aaaasd1234` / `aaa4444444` now returns
400 with named field errors — verified live) and mirrored client-side with inline messages.
Files: `src/lib/validators.ts`, `CheckoutForm.tsx`, `tests/checkout-validation.test.ts`.

## 30. SMS order notifications (Partial — live when Twilio keys configured)
Three lifecycle texts to the E.164 number: **confirmed** (with pickup code, ETA, tracking
link) on order creation, **ready** when the POS marks Ready, **collected** on pickup/QR
verify. Twilio via plain HTTP, gated exactly like email: without `TWILIO_*` env the send is
logged and skipped — messaging never blocks an order. Files: `src/lib/sms.ts`, orders route,
POS route, verify route, `.env.example`.

## 31. Gift card payment (redemption Implemented; purchase flow Planned)
Third payment method alongside pay-at-pickup and credit/debit/prepaid (Stripe). Server-
authoritative: balance looked up, applied before card charges, **decremented atomically**
(guarded update — a raced card returns 409 and the order rolls back). Fully-covered orders go
straight to PAID with a gift_card Payment record and earn loyalty; partial coverage charges
only the remainder via Stripe or falls to counter. Additive schema (`giftCardId`,
`giftCardApplied`); seed includes `HB-GIFT-DEMO` ($25). Buying gift cards online is Planned.

## 32. Customer order history (Implemented for signed-in customers)
**Where to track orders:** customers — "My Orders" in the nav → `/account/orders` (status,
items, totals, tap through to the live tracker); guests — the capability link sent by
SMS/email; system side — Admin recent orders + POS queue, as before. Guest→account order
claiming is Planned.

## 33. Demo preview parity
The static preview now enforces the same name/phone rules, offers all three payment methods
(demo gift card included), simulates the three SMS messages visibly, and keeps a local demo
history — labeled honestly on every screen as a mockup that sends nothing.

---

# HOTFIX — P0 build blockers resolved (runtime verification: PARTIAL)

**Correction accepted:** the earlier claim "P0 resolved" overstated it. Build-blocking defects
are fixed and boot-level behavior is verified; the end-to-end business flow is NOT verified
until it runs against a real database. Ledger below uses that distinction.

```
P0 build blockers resolved
Runtime verification: PARTIAL

Verified:
✓ next build (zero type errors)
✓ typecheck
✓ unit tests (27)
✓ runtime boot (next start)
✓ route availability + failure paths (health 503, checkout degraded message,
  validation 400, RBAC 403/redirect)

Pending (requires real database + credentials):
□ real database (migrate + seed)
□ real order created and tracked
□ real payment (Stripe test mode)
□ real inventory decrement observed
□ POS propagation (Start → Ready → tracker updates)
□ loyalty award (once, exact amount)
□ email receipt delivered
```

**Also fixed in this pass (F7):** staff sign-in was broken — auth pointed at a `/login` page
that was never built. Middleware now redirects to the existing Auth.js sign-in page; a branded
/login remains Planned.

**Permanent additions:** docs/RELEASE_GATE.md (the 16-step gate; unchecked box = still a
release candidate) and tests/e2e/customer-order.spec.ts — the one test never skipped before a
deployment: menu → add → cart → checkout → order in DB → POS → tracker → QR collected →
status COMPLETED. Written and gate-required; auto-skips without E2E_BASE_URL; **not yet
executed against real infrastructure** — and the release stays untagged until it has.

Original findings (F1–F6) below.

Full report: docs/ROOT_CAUSE_P0.md. First failing point: a build-blocking type error meant
the site could not be deployed at all. Also fixed: mobile/ leaking into the web typecheck;
middleware importing Prisma into the Edge runtime (would 500 /admin and /pos); unguarded
locations dependency in checkout (the likely dev-mode symptom, incl. clear customer messaging);
health endpoint being statically cacheable. Verified: 0 type errors, successful `next build`,
runtime smoke of every page and API including failure paths, 27 tests passing.
**Process fix:** the truth invariant now requires a passing `next build` before any release —
this incident existed because prior verification never compiled the app end-to-end.

---

# OR1 — Operational Readiness (people & process gate before Launch 1.0)

One implemented feature, two process documents.

## 28. End-of-Day Check — "Run End-of-Day Check" button (Implemented)
**Why** — The review said "if this becomes a button, even better." It is one now: the admin
dashboard runs six checks — orders completed (lists stragglers by number + status), refunds
matched (order vs payment record disagreement), inventory sanity (negative stock = the
oversell guard's standing proof), revenue split (counter vs online totals for till/Stripe
matching), audit summary (today's actions by type), and backup confirmation.
**Honesty in the UI** — checks the platform cannot verify return `pass: null` and render as
open boxes ("requires manual confirmation") rather than false green: revenue matching and
backup confirmation stay human. **Running the check is itself audited** — that audit row is
the manager's digital sign-off record.
**Files** — `src/app/api/admin/eod/route.ts`, `src/components/admin/EodCheck.tsx`, admin page.
**Accessibility** — result icons carry sr-only text; report is a `role="status"` region.

## Documents
- **docs/OR1_CHECKLIST.md** — staff certification matrix (trainer may observe but not speak;
  if they must speak, the drill fails and the Runbook gains a sentence), training measurement,
  timed recovery drills with targets, cash reconciliation with variance policy, EOD procedure,
  and the Launch 1.0 KPI table with data sources (OrderEvents, logs, audit trail).
- **docs/DECISIONS.md** — twelve ADRs recording why the system is shaped this way, from the
  palette split (ADR-001) through the Truth Invariant (ADR-011) to the **architecture freeze**
  (ADR-012): from Launch 1.0, bugs and reliability only, until flagship data chooses v5.0.

---

# PR1 — Live Flagship Launch (process artifacts, not features)

**Goal:** one physical café operates a full business day on the platform with zero manual
workarounds. These are certification and operations artifacts — nothing here changes runtime
behavior, and per the truth invariant nothing is claimed "verified" until executed on
production infrastructure.

- **docs/RUNBOOK.md** — the centerpiece: opening/closing checklists, refunds (incl. the
  honest partial-refund gap + workaround), Stripe outage, internet outage, tablet death,
  inventory adjustments, accounts, emergency-contact table that **blocks launch until filled**.
- **docs/PR1_CHECKLIST.md** — payment certification matrix (12 scenarios incl. duplicate
  webhook delivery and double-click pay, mapped to Stripe test cards), the 150-orders/hour
  stress plan, DR rehearsals, security + accessibility audits, enforced performance budgets.
- **docs/MIGRATION_POLICY.md** — schema freeze: additive-only, no renames, no drops,
  rollback = old app on new schema. Precedent already set by v3–v4 practice.
- **scripts/load/peak-hour.js** — k6 simulation encoding the peak scenario with thresholds
  matching the §7 budgets; **scripts/load/oversell-probe.js** — concurrency probe proving the
  atomic inventory guard (exactly N succeed, stock lands on 0).
- **scripts/smoke.sh** — executable post-deploy smoke (health, pages, gating, validation).
- **lighthouserc.json + CI job** — performance budget as a merge gate on PRs.

Known gaps stated, not hidden: partial refunds (runbook workaround, v5.0), inventory
adjustment UI (manager requests, engineer executes until v5.0), browser E2E still Planned.

---

# CHANGELOG — v4.0 "Payment & Fulfillment Pipeline"

Scope taken verbatim from the product review: finish payment UI, receipts, refunds, audit
logs, the expanded order lifecycle, and monitoring around payment/inventory failures.
**27 tests passing.** All additive.

## 21. Stripe Elements payment screen
**Why** — The last mile. When "Pay online" is selected and Stripe is configured, checkout
places the order, then renders the PaymentElement (cards + Apple Pay + Google Pay) branded
with the HimBean palette; success redirects to the live tracker. Declines show the message
and offer the honest escape hatch: "pay at pickup instead — your order is already in."
**Files** — `src/components/checkout/PaymentStep.tsx` (new), `CheckoutForm.tsx` (payment phase).
**Performance** — Stripe.js loads only when the online path is taken.
**Accessibility** — decline errors via `role="alert"`; Elements provides labeled inputs.

## 22. Email receipts & order confirmations
**Why** — Customers expect a receipt with tax breakdown, order number, and pickup code.
Confirmation email (pickup code, items, ETA, live-tracking link) sends on order creation;
tax-itemized receipt sends when the payment webhook confirms. Resend via plain HTTP — no new
dependency — and gated: when `RESEND_API_KEY` is absent the send is logged and skipped, so
email can never block an order. Templates are unit-tested for required content.
**Files** — `src/lib/email.ts` (new), orders route, webhook, `tests/email.test.ts`.

## 23. Refund workflow (admin)
**Why** — Managers refund from the dashboard, with a confirm step warning "audited, cannot be
undone." Two paths: Stripe-paid orders create a provider refund and the **signed webhook flips
our status** (the provider stays the single source of truth for money state); counter-paid
orders refund directly **and restock tracked inventory**. Refund eligibility is a tested pure
function (`canRefund`) — PENDING/CANCELLED/REFUNDED are rejected with 409.
**Files** — `src/app/api/admin/refunds/route.ts`, `src/components/admin/RefundButton.tsx`,
admin table column.

## 24. Audit logs (critical operations)
**Why** — When something goes wrong, this is often the only reliable record. Every refund
(actor, amount, reason, IP) and every staff cancellation now writes to the existing `AuditLog`
model via a helper that **never throws** — an audit failure is logged loudly but cannot break
the operation it records. Menu CRUD will use the same helper when it lands.
**Files** — `src/lib/audit.ts` (new), refunds route, POS route.

## 25. Expanded order lifecycle + per-state timestamps
**Why** — The backend now supports the full pipeline:
PENDING → PAID → ACCEPTED → PREPARING → QUALITY_CHECK → READY → COMPLETED, with CANCELLED and
REFUNDED branches. ACCEPTED and QUALITY_CHECK are **optional gates** — the POS default flow
skips them, but any store can enable them without code changes elsewhere. Every transition
writes an `OrderEvent` (status, actor, timestamp), which is the raw material for prep-time,
bottleneck, and rush-hour analytics (Sprint 4). Customers still see five steps: the tracker
maps backend states via `customerStepIndex()` — QUALITY_CHECK shows as "Preparing".
**Files** — `prisma/schema.prisma` (enum values + `OrderEvent` — additive), `src/lib/order-status.ts`
(rewritten map, fully tested incl. all skip/reversal/terminal cases), POS route + board, tracker.

## 26. Payment & inventory failure monitoring
**Why** — The two failure classes that cost money are now first-class log events for alerting:
`payment.failed` (with decline reason), `payment.intent_failed`, `refund.requested/completed`,
and `inventory.oversell_blocked` (a customer hit the atomic guard — a demand signal, not a bug).
Wire these event names to log-drain alerts per the release checklist.
**Files** — orders route, webhook, refunds route.

## 27. End-to-end testing — honest status
Unit coverage grew to **27 passing tests** (lifecycle incl. optional gates, refund eligibility,
customer step mapping, email template content, plus all prior suites). Browser E2E of the full
journey requires a running app + database and remains **Planned** (Playwright; the release
checklist's §0 manual E2E gate covers go-live until then). Listed here so the ledger cannot
drift.

---

# CHANGELOG — v3.5 "Commerce Loop"

The core business loop now exists end to end:
**Browse → Add → Cart → Checkout → Track → Pickup**, with atomic inventory and a live Stripe seam.
All changes are layers on v3.0 — nothing replaced.

## 15. Cart system
**Why** — The Add buttons existed but connected to nothing. Now: persisted Zustand store
(survives refresh via localStorage), identical line items merge, quantity capped at 50 to match
the server validator. Floating bottom bar (hidden when empty: "2 items · $11.75 · View Cart →")
and a slide-over drawer with quantity editing — no new page, per spec.
**Files** — `src/lib/cart-math.ts` (pure, tested), `src/store/cart.ts`,
`src/components/cart/CartUI.tsx`, `src/app/layout.tsx` (mount), `MenuExplorer.tsx` (wired).
**Performance** — client-only state; zero server cost. **Accessibility** — drawer is a labeled
`role="dialog"` with aria-modal, body scroll lock, labeled quantity controls; bar announces
count and total.

## 16. Checkout + guest ordering
**Why** — Ordering coffee must not require an account. Guest fields (name, phone, optional
email for receipts, optional pickup time) added to the Order schema and validator — additive.
Payment method selector: **Pay at pickup** (live today) or **Pay online** (auto-enables when
Stripe keys are configured; greyed with "coming online soon" otherwise — the UI never lies
about capability).
**Files** — `src/app/checkout/page.tsx`, `src/components/checkout/CheckoutForm.tsx`,
`prisma/schema.prisma` (guestName/guestPhone), `src/lib/validators.ts`,
`src/app/api/locations/route.ts` (new).
**Performance** — one locations fetch, ISR-cached 5 min. **Accessibility** — every field
labeled, radio group in a fieldset, errors via `role="alert"`.

## 17. Order tracking (customer notifications, v0)
**Why** — Before email/SMS lands, the confirmation page IS the notification channel:
capability URL (unguessable cuid), pickup code in large text (accessible alongside any future
QR render), five-step progress (Received → Confirmed → Preparing → Ready → Collected) polling
every 15 s, and the item summary. The POS advancing status is what the customer sees move.
**Files** — `src/app/order/[id]/page.tsx`, `src/components/order/OrderTracker.tsx`,
`src/app/api/orders/[id]/route.ts` (returns tracking fields only — no PII beyond first name).
**Performance** — 15 s polling on one lightweight endpoint. **Accessibility** — `aria-live`
status region, ordered-list progress.

## 18. Inventory engine (Sprint 2)
**Why** — The POS was blind. Now: stock check before pricing, **atomic decrement inside the
order transaction** (guarded `updateMany where stock >= qty` — concurrent orders cannot
oversell; a race returns "just sold out" 409 and the order rolls back). Menu **auto-hides**
tracked items at zero stock (untracked made-to-order drinks always show). Admin shows an
Inventory Alerts panel (out-of-stock in ops accent red, low stock with thresholds). Seed
tracks bakery + retail bags.
**Files** — `src/app/api/orders/route.ts`, `src/app/menu/page.tsx` (query filter),
`src/app/admin/page.tsx`, `prisma/seed.ts`.
**Performance** — one extra indexed read + guarded update per tracked line.
**Accessibility** — alerts are text + color, never color alone.

## 19. Stripe payments (Sprint 1)
**Why** — Money flow. The payment architecture is complete; runtime payment processing
remains disabled until production Stripe credentials are configured. With `payOnline` + keys,
order creation returns a
PaymentIntent `clientSecret` (automatic payment methods = cards + Apple Pay + Google Pay;
`receipt_email` set for Stripe receipts). The **webhook** verifies signatures and handles:
`payment_intent.succeeded` → order PAID + Payment record + Vertical Meters (same idempotent
call as the counter path); `payment_intent.payment_failed` → logged, order stays PENDING for
retry or counter payment; `charge.refunded` → order + payment REFUNDED. If online payment is unavailable (intent creation fails), the system falls back to
pay-at-pickup mode so operations can continue — the order survives with `paymentFallback`.
**Files** — `src/lib/stripe.ts`, `src/app/api/webhooks/stripe/route.ts`,
`src/app/api/orders/route.ts`; `@stripe/stripe-js` + `@stripe/react-stripe-js` added for the
Elements increment.
**Performance** — webhook is O(1) per event. **Accessibility** — n/a.

## 20. Trust & conversion signals
**Why** — Small, honest nudges: menu header line ("Freshly roasted this week · Limited batches
daily · Pickup in 7–12 min"), hero social proof ("⭐ 4.8 — rated by Kathmandu coffee lovers" —
**replace with your real rating before launch**), checkout reassurance line. Navbar/footer
"Order ahead" now targets `/menu` (was a dead route).
**Files** — `src/app/menu/page.tsx`, `src/app/page.tsx`, `Navbar.tsx`.

---

# CHANGELOG — v3.0 "Ecosystem"

Every change below is additive and backward compatible. No page, route, component,
animation, or schema column was removed or renamed. Format per change: **Why → Files →
Performance → Accessibility.**

---

## 1. Branding decision: consumer palette preserved, Ops palette introduced
**Why** — The upgrade spec's palette (#1E232A / #E63946 accent) conflicts with rule #1
(preserve existing branding). Applying it to the storefront would be a redesign. Resolution:
customer surfaces keep the HimBean identity; the new neutral high-contrast system becomes a
**scoped `.ops` token set for Admin + POS**, where utilitarian clarity beats brand warmth.
**Files** — `src/app/globals.css` (appended `.ops` block only).
**Performance** — none (CSS variables, no new assets).
**Accessibility** — Ops contrast: #FDFBF7 on #1E232A ≈ 15.6:1 (AAA).

## 2. Loyalty engine — Altitude Perks
**Why** — Turns the placeholder rewards tables into a working engine. Tiers renamed to
Base Camp (0–999 m) → Langtang (1,000–2,999 m) → Annapurna (3,000–8,847 m) → Everest (8,848 m+ —
the summit height, a detail regulars will notice). Ranges are exposed via `tierRange()` and the
rewards API's `ladder`, so every UI can show tangible progress. `points` column kept, displayed
as "Vertical Meters" (no migration risk).
Earning is idempotent per order (transaction + ledger reason key) and **wired into both live
completion paths** — POS status advance and QR verify — so counter-paid orders earn today;
the future Stripe webhook shares the same idempotent call.
**Files** — `src/lib/loyalty.ts` (new), `src/app/api/rewards/me/route.ts` (new),
`prisma/schema.prisma` (comments only).
**Performance** — single transaction per award; reads are one indexed upsert.
**Accessibility** — n/a (API layer).

## 3. Subscription engine
**Why** — The Coffee Club needed persistence: roast preference, grind preference,
pause/resume/cancel with ownership checks. Stripe billing hook marked at the TODO seam.
**Files** — `prisma/schema.prisma` (new `Subscription` model + `User.subscriptions`),
`src/app/api/subscriptions/route.ts` (new).
**Performance** — indexed on `(userId, status)`.
**Accessibility** — n/a.

## 4. QR pickup
**Why** — Order-ahead needs a handoff proof. Orders now get an unambiguous 6-char code
(`HB-XXXXXX`, alphabet excludes 0/O/1/I/L to prevent misreads at the counter). Staff verify at
the POS; verification enforces the state machine (only READY orders can be handed off).
**Files** — `src/lib/pickup.ts` (generation + validation, unit-tested),
`src/app/api/orders/route.ts` (code returned in response),
`src/app/api/pos/verify/route.ts` (new), `prisma/schema.prisma` (`Order.pickupCode`, unique).
**Performance** — one unique-index lookup.
**Accessibility** — code is also displayed as text, not QR-only, so screen-reader users can
read it aloud at the counter.

## 5. POS / Kitchen Display
**Why** — Baristas need a queue, not an admin table: three columns (Incoming → Preparing →
Ready), per-order prep timers that turn red past the ETA, one-tap status advance, and the QR
verify form at the top. Polls every 10 s (upgradeable to SSE/websockets later without UI change).
**Files** — `src/app/pos/page.tsx`, `src/components/pos/PosBoard.tsx`,
`src/app/api/pos/orders/route.ts` (all new); `src/lib/order-status.ts` — server-enforced state
machine (PAID → PREPARING → READY → COMPLETED; skips, reversals, and terminal changes rejected
with 409). Extended states (Accepted, Quality Check, Collected) are additive rows in one map.
**Performance** — 10 s polling with `cache: no-store`; payload capped at 40 orders.
**Accessibility** — columns are labeled sections; verify result uses `role="status"`;
buttons have visible focus (inherited tokens); tab targets ≥ 44 px.

## 6. Admin dashboard
**Why** — Managers get revenue-today, order counts, queue depth, active subscriptions, and a
recent-orders table — server-rendered from real aggregates, not mock data.
**Files** — `src/app/admin/page.tsx` (new).
**Performance** — `Promise.all` aggregates; `dynamic = "force-dynamic"` scoped to this route
only, so marketing pages keep ISR.
**Accessibility** — semantic `<table>` with header row; `robots: noindex`.

## 7. RBAC middleware
**Why** — `/admin` (MANAGER+) and `/pos` (STAFF+) are now gated at the edge, before render,
with redirect-to-login carrying the return path. API routes additionally re-check the role
(defense in depth).
**Files** — `src/middleware.ts` (new; matcher limited to those two prefixes, so the public
site pays zero middleware cost).
**Performance** — JWT check only on protected paths.
**Accessibility** — n/a.

## 8. Menu information architecture
**Why** — Categories extended per spec: Origin Filter → **Origin Coffee** (clearer noun),
plus **Tea** (First Flush, Masala Chai) and **Retail Coffee** (bags purchasable from the menu,
with full origin education data). "Barista Favorite" promoted from italic nudge to a proper
badge so it participates in the scanning system.
**Files** — `prisma/seed.ts`, `src/components/menu/MenuExplorer.tsx`, `src/app/page.tsx`
(badge map parity).
**Performance** — none.
**Accessibility** — badges remain text (not color-only meaning).

## 9. PWA foundation
**Why** — Installable app shell for the mobile web experience; groundwork for offline mode.
**Files** — `public/manifest.webmanifest`, `public/icon-192.png`, `public/icon-512.png`
(real rendered assets — the manifest references no missing files), `src/app/layout.tsx`.
**Performance** — no runtime cost. Service worker (offline caching) is the next increment —
recommend `@serwist/next`.
**Accessibility** — theme color matches brand for consistent OS chrome.

## 10. Cross-Platform Mobile Foundation
**Why** — The foundation of the production mobile app (iOS + Android), sharing the same backend
and design tokens: personalized Home, Order, Altitude Perks (tier ladder with visible ranges +
QR pickup code), and Account tabs. Phased milestones are defined in `mobile/README.md`
(Phase 1 foundation → Phase 2 commerce → Phase 3 engagement) so expectations stay realistic.
**Files** — `mobile/App.tsx`, `mobile/theme.ts`, `mobile/package.json`, `mobile/README.md` (all new).
**Performance** — 8-point spacing grid; no heavy nav dependency yet.
**Accessibility** — tab bar uses `accessibilityRole="tab"` + selected state; touch targets ≥ 48 px.

---

## 11. Security
**Why** — Protect customer data and operational systems; make the posture auditable.
**Implemented** — CSRF protection (Auth.js built-in tokens); rate limiting on public POST
endpoints incl. credential auth; input validation on every mutation (Zod); secure HTTP-only
session cookies (Auth.js defaults); role-based authorization (edge middleware + per-route
re-checks); server-side session validation on protected APIs; SQL-injection protection via
Prisma parameterized queries; **Content Security Policy** + nosniff/frame-deny/referrer/
permissions headers (`next.config.mjs`); bcrypt cost 12; env-based secrets with boot-time
validation (`src/lib/env.ts`).
**Planned** — CSP nonces when GA4 lands; Redis-backed rate limiting for multi-instance;
secrets rotation runbook.
**Performance** — header-level; negligible. **Accessibility** — no impact.

## 12. Monitoring & Observability
**Why** — Production systems need visibility into failures before customers report them.
**Implemented** — Structured JSON logging with request IDs (`src/lib/logger.ts`); order
lifecycle logs (`order.created`, `order.status`) on the commerce path; customer-facing error
boundary with digest reference (`src/app/error.tsx`); health check with DB reachability and
query timing (`GET /api/health`, returns 503 when degraded — wire to your load balancer);
Prisma query logging in development.
**Planned** — Sentry (error boundary + logger are drop-in seams), OpenTelemetry traces,
Grafana dashboards.
**Performance** — one JSON.stringify per event. **Accessibility** — error page uses the
brand design system with focus-visible controls.

## 13. Testing
**Why** — Quality is maintained by executable checks, not intentions. Documented honestly:
only what runs is listed as implemented.
**Implemented** — Unit tests for the loyalty engine (tier boundaries incl. the 8,848 m summit
edge, earn math, range rendering), all commerce validators, QR pickup-code generation
(500-iteration alphabet fuzz), and the order state machine — **16 tests, passing**
(`tests/`, `vitest.config.ts`); loyalty core refactored to pure functions (DB imported lazily)
specifically to make it testable; CI runs lint → typecheck → tests → build on every PR.
**Planned** — API integration tests against the CI Postgres service; Playwright E2E ordering
flow + axe accessibility smoke; load testing (k6); visual regression.
**Performance** — n/a. **Accessibility** — E2E plan includes automated axe checks.

## 14. Deployment
**Why** — Production systems should describe how they are released.
**Infrastructure** — Multi-stage Docker (non-root runtime user); docker-compose for local
web + Postgres + Redis; GitHub Actions CI on every push/PR; preview deployments per PR and
production deploys on main via Vercel; database migrations via `prisma migrate deploy` in the
build step; boot-time environment validation that fails fast with readable errors.
**Planned** — Blue/green deployment, canary releases, automated rollback on failed health
checks (the `/api/health` endpoint is the probe).
**Performance** — standalone output keeps the runtime image small. **Accessibility** — n/a.

---

## SYSTEM RELIABILITY LAYER (v3.0 Core)

Sections 11–14 are foundational production safeguards, not product features — operational
guarantees that the platform stays observable, secure, and releasable. They are listed
separately so nobody mistakes CSP or logging for a customer-facing capability.

---

## v3.0 Status Ledger (Truth Invariant)

Nothing below is marked Implemented unless the code exists in the repo, is wired into runtime,
is reachable through a production path, and has no TODO placeholder in its core behavior.

**IMPLEMENTED (real, wired, runnable)**
✔ Loyalty engine — Altitude Perks (earn on POS/QR completion, tiers with visible ranges, read API)
✔ QR pickup (generation, validation, staff verify, unit-tested)
✔ POS / Kitchen Display (queue, timers, server-enforced state machine)
✔ Admin dashboard (live aggregates)
✔ RBAC (edge middleware + per-route re-checks)
✔ PWA manifest with rendered icon assets
✔ Cross-Platform Mobile Foundation (Phase 1)
✔ Structured logging + request IDs (order lifecycle instrumented)
✔ Health endpoint (DB reachability + timing, 503 on degradation)
✔ CSP + security headers
✔ Error boundary
✔ Environment validation (fail-fast at boot)
✔ End-of-Day Check (six checks, honest manual boxes, audited sign-off)
✔ Strict guest validation (name pattern, country-based 10-digit phone → E.164)
✔ Gift card redemption (atomic balance decrement, full/partial coverage)
✔ Customer order history page (/account/orders)
✔ Unit tests — 33 passing (lifecycle, refund eligibility, customer mapping, email templates, loyalty, validators, pickup codes, cart math)
✔ Cart → Checkout → Track loop (guest ordering, persisted cart, capability-URL tracking)
✔ Refund workflow (admin, audited, restocks counter-paid orders)
✔ Audit logs on refunds and cancellations (never-throw helper)
✔ Expanded order lifecycle with per-state timestamps (OrderEvent)
✔ Inventory engine (atomic decrement, oversell-proof, auto-hide at zero, admin alerts)
✔ Stripe webhook (signature-verified: paid / failed / refunded → loyalty + Payment records)

**PARTIAL (real but incomplete)**
• Subscriptions — CRUD, preferences, pause/resume/cancel with ownership checks are live;
  Stripe billing not yet attached (TODO at the seam)
• Online payments — architecture complete end to end (PaymentIntent → Elements screen →
  signed webhook → receipt); runtime processing remains disabled until production Stripe
  credentials are configured ("Pay online" stays greyed out until then)
• Email notifications — confirmation + receipt wired into the commerce path; sends activate
  when RESEND_API_KEY is configured (logged and skipped otherwise)
• Mobile — Phase 1 only; auth and ordering land in Phases 2–3 (`mobile/README.md`)
• PWA — installable manifest only; offline service worker not yet built

**PLANNED (no runtime behavior yet)**
• Stripe Elements payment screen · Email/SMS order notifications · Push notifications · Offline support · AI personalization
• Inventory forecasting · Admin menu CRUD · Campaign management · Analytics (GA4/PostHog)

---

## Roadmap — v3.1 (prioritized: operations first)

1. **Stripe payment integration** — PaymentIntents, Apple/Google Pay, webhook fulfilment
   (critical for commerce; the `awardMeters` hook is already at the webhook seam)
2. **Admin menu management** — CRUD with audit logging (operational efficiency)
3. **Inventory management** — stock decrement on order, low-stock alerts on the POS
4. **Firebase push notifications** — order-ready, loyalty milestones
5. **Offline / full PWA** — service worker (`@serwist/next`), offline menu
6. **Analytics** — GA4 + PostHog with CSP nonces
7. **AI personalization** — homepage by time, weather, order history, store traffic
8. Then: inventory forecasting, smart recommendations, store heatmaps, wholesale portal,
   corporate accounts, extended POS states (Incoming → Accepted → Preparing → Quality Check →
   Ready → Collected — the status enum extends without breaking the current three-column UI)

**Ambition statement** — Deliver a fast, premium ordering experience suitable for a modern
specialty coffee brand, rooted in Himalayan craftsmanship and operational excellence.
