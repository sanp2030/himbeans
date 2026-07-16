# API Reference

Base URL: `/api`. All mutations accept and return JSON. Errors follow
`{ "error": string, "issues"?: ZodFlattenedError }`. Public POST routes are rate-limited per IP
(429 with a retry hint when exceeded).

## POST /api/orders

Create an order. Pricing is computed **server-side** from the database — the client never sends prices.

Request:
```json
{
  "locationId": "loc_123",
  "fulfilment": "PICKUP",            // PICKUP | DELIVERY | DINE_IN
  "addressId": "addr_1",             // required for DELIVERY
  "couponCode": "FIRSTPOUR",         // optional
  "notes": "extra hot please",       // optional, ≤500 chars
  "items": [
    { "productId": "prod_1", "quantity": 2,
      "customization": { "Size": "Large", "Milk": "Oat" } }
  ]
}
```

Response `201`:
```json
{ "id": "ord_abc", "number": 1042, "total": "13.61", "etaMinutes": 16 }
```

Errors: `400` invalid input · `409` item unavailable · `429` rate limit.

Next step for the client: create a Stripe PaymentIntent for `total` (webhook flips
`Order.status` to `PAID`, then the kitchen board moves it through `PREPARING → READY`).

## POST /api/reservations

```json
{
  "locationId": "loc_123",
  "name": "Priya R.",
  "email": "priya@example.com",
  "phone": "+9779800000000",
  "date": "2026-07-12T18:30:00Z",   // must be in the future
  "guests": 4,
  "request": "window table if possible"
}
```

Response `201`: `{ "id": "res_abc", "status": "PENDING" }` — confirmation email is queued.

## POST /api/newsletter

```json
{ "email": "you@example.com" }
```

Response `200`: `{ "ok": true }`. Idempotent — re-subscribing an unsubscribed address re-activates it.

## Auth

Auth.js handles `/api/auth/*` (Google, Apple, credentials). The session JWT carries `role`
(`CUSTOMER | STAFF | MANAGER | ADMIN | SUPER_ADMIN`); protect admin APIs by checking
`session.user.role` in middleware.

## Planned endpoints (schema-ready)

`GET /api/products` (filter/sort/paginate) · `POST /api/reviews` · `GET/POST /api/gift-cards` ·
`POST /api/coupons/validate` · `GET /api/rewards/me` · `POST /api/webhooks/stripe` ·
admin CRUD under `/api/admin/*` (audit-logged).

---

## v3 additions

### GET /api/rewards/me *(auth)*
Altitude Perks summary: `{ verticalMeters, tier, benefits[], nextTier: { name, metersToGo } | null, recent[] }`.
Tiers: Base Camp → Langtang (1,500 m) → Annapurna (4,500 m) → Everest (8,848 m). Earn rate: 10 m per $1, awarded idempotently on payment.

### POST /api/subscriptions *(auth)*
`{ roastPref: "light"|"medium"|"espresso", grindPref: "whole-bean"|"filter"|"espresso" }` → `201` subscription.

### PATCH /api/subscriptions *(auth)*
`{ id, action: "PAUSE"|"RESUME"|"CANCEL", pausedUntil? }` — ownership enforced.

### GET /api/pos/orders *(STAFF+)*
Live queue (PAID/PREPARING/READY, max 40) with items and pickup codes.

### PATCH /api/pos/orders *(STAFF+)*
`{ id, status: "PREPARING"|"READY"|"COMPLETED" }` — advance an order.

### POST /api/pos/verify *(STAFF+)*
`{ code: "HB-XXXXXX" }` → hands off a READY order (`409` if not ready, `404` if unknown).

Orders (`POST /api/orders`) now return `pickupCode` alongside `id/number/total/etaMinutes`.

---

## v3.5 additions

### GET /api/locations
Active pickup locations (id, name, address). ISR 5 min.

### GET /api/orders/[id]
Order tracking via capability URL (unguessable cuid). Returns number, status, pickupCode,
etaMinutes, items, total, first name only.

### POST /api/orders (extended)
Now accepts `guestName`, `guestPhone`, `guestEmail` (receipt), `scheduledFor`, `payOnline`.
Inventory is checked and decremented atomically — `409` with the item name if sold out.
With `payOnline: true` + Stripe configured, response includes `clientSecret`; on Stripe
failure the order survives with `paymentFallback: "COUNTER"`.

### POST /api/webhooks/stripe
Signature-verified. Handles `payment_intent.succeeded` (→ PAID + loyalty),
`payment_intent.payment_failed` (logged, retryable), `charge.refunded` (→ REFUNDED).
Returns `501` when Stripe is not configured.

---

## v4.0 additions

### POST /api/admin/refunds *(MANAGER+)*
`{ orderId, reason? }`. Stripe-paid → provider refund created, webhook completes status.
Counter-paid → REFUNDED immediately + tracked inventory restocked. Fully audited (actor,
amount, reason, IP). `409` when status isn't refundable.

### Order lifecycle
Backend statuses now: PENDING → PAID → ACCEPTED* → PREPARING → QUALITY_CHECK* → READY →
COMPLETED (+ CANCELLED, REFUNDED). *Optional gates. Every transition writes an OrderEvent
timestamp. POS PATCH accepts all forward transitions; invalid moves return `409`.
