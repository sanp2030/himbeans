# Integrating the Base44 Site with the HimBean Platform

**The boundary, stated plainly:** Base44 generates and hosts a closed React app. Its code
cannot be merged into this repo, and this repo cannot be deployed onto Base44. Verified
2026-07-06: the app at `classic-peak-bean-brew.base44.app` exposes only head metadata to
non-browser clients (correct brand: title, tagline, description, theme #2B1B14).

Integration therefore means one of two patterns. Both keep this platform as the single
source of truth for orders, inventory, payments, and the POS.

---

## Pattern A — Link-out (recommended to start; zero code on either side)

The Base44 site is the public brochure; ordering happens on the deployed platform.

1. Deploy this repo (Vercel + managed Postgres; follow docs/RELEASE_GATE.md).
2. In the Base44 editor, point every ordering CTA ("Order ahead", menu "Add" buttons,
   footer "Order") at `https://<your-app-domain>/menu`.
3. Optional domain split: `www.himbean.coffee` → Base44 brochure,
   `order.himbean.coffee` → this platform.

Pros: nothing to maintain. Cons: a visible hop from brochure to ordering.

## Pattern B — API bridge (Base44 UI, HimBean engine) — SHIPPED in this repo

The Base44 front end calls this platform's public commerce API directly, cross-origin.

**Server side (done, verified):** three public endpoints are CORS-enabled behind an
explicit allowlist — `GET /api/locations`, `POST /api/orders`, `GET /api/orders/{id}` —
plus their OPTIONS preflights. Ops APIs (`/api/pos/*`, `/api/admin/*`) are deliberately
NOT cross-origin reachable. Configure:

    PUBLIC_CORS_ORIGINS="https://classic-peak-bean-brew.base44.app"

(comma-separate additional origins; unset = bridge closed, the safe default).

**Base44 side (yours to wire in its editor/AI):** on checkout, call:

    POST https://<your-app-domain>/api/orders
    Content-Type: application/json
    {
      "locationId": "<from GET /api/locations>",
      "fulfilment": "PICKUP",
      "guestName": "Priya Rai",
      "guestPhoneCountry": "NP",          // NP | IN | US
      "guestPhone": "9812345678",         // exactly 10 digits
      "guestEmail": "optional@example.com",
      "payOnline": false,                  // true → response includes Stripe clientSecret
      "giftCardCode": "HB-GIFT-DEMO",      // optional
      "items": [{ "productId": "<id>", "quantity": 1 }]
    }

    201 → { id, number, total, amountDue, giftCardApplied, pickupCode, etaMinutes }
    Then link the customer to https://<your-app-domain>/order/{id}  (live tracker)
    400 → field errors (same strict validation as first-party checkout)
    409 → sold out / gift card issues

Every order placed this way lands in the same POS queue, decrements the same inventory,
sends the same SMS/email, and earns the same audit trail as a first-party order.

## Verification record (sandbox, 2026-07-06)
✓ OPTIONS /api/orders with Origin=base44 → 204 + full CORS headers
✓ POST /api/orders with Origin=base44 → 400 validation WITH allow-origin (bridge live)
✓ Unlisted origin → zero CORS headers (browser-blocked)
✓ GET /api/locations with Origin=base44 → 200 + allow-origin
✓ /api/pos/* with Origin=base44 → zero CORS headers (ops stay same-origin)
✓ typecheck 0 errors · build compiled · 33 unit tests

**Pending (requires your infrastructure):** deploying this repo to a public URL, setting
PUBLIC_CORS_ORIGINS in production, and wiring the Base44 buttons — then re-run the five-point
acceptance test from the live site.
