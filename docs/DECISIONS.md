# DECISIONS.md — Architecture Decision Records

Six months from now, this file answers "why does it work this way?" One entry per decision
that shaped the system. Newest additions at the bottom; entries are never deleted, only
superseded by a later ADR that references them.

---

**ADR-001 — Customer brand palette is separate from the Ops palette**
Why: the HimBean identity (espresso/cream/forest/gold, Playfair) is part of the customer
experience; staff tools prioritize clarity and speed over brand expression.
Alternative: single shared palette (the v3 brief's slate/red everywhere).
Trade-off: slight duplication of design tokens, scoped via a `.ops` CSS class.

**ADR-002 — Guest checkout is the default**
Why: requiring accounts to buy coffee hurts conversion; rewards can attach later.
Alternative: mandatory account creation. Trade-off: lower customer identification;
loyalty earning requires sign-in, which the tracker page can upsell later.

**ADR-003 — Additive-only schema evolution; reuse columns under new display names**
Why: rollback safety — app version N−1 must always run against schema N.
Example: `RewardAccount.points` displays as "Vertical Meters" without a rename.
Alternative: rename migrations. Trade-off: occasional naming mismatch between DB and UI,
documented in the schema comments. Formalized in MIGRATION_POLICY.md.

**ADR-004 — Loyalty awards are idempotent via a ledger reason key**
Why: the same `awardMeters(userId, total, orderId)` call is reachable from two paths (POS
completion and the Stripe webhook) and webhooks retry; a transaction + `order:{id}` ledger
key guarantees single award. Alternative: award only from one path. Trade-off: none
meaningful; the ledger doubles as an audit trail of earning.

**ADR-005 — Order lifecycle has optional gates (ACCEPTED, QUALITY_CHECK)**
Why: the backend supports the full pipeline for analytics and future stores; the flagship POS
skips the gates to keep three columns and two taps per order. Alternative: enforce every
state. Trade-off: prep-time analytics must tolerate skipped states (OrderEvent records
whatever actually happened).

**ADR-006 — Counter-payment fallback when online payment is unavailable**
Why: a payment-provider failure must not stop the café; orders survive with
`paymentFallback: "COUNTER"` and are settled at the till. Alternative: fail the order.
Trade-off: staff must collect payment at pickup; the POS shows these in Incoming as PENDING.

**ADR-007 — Order tracking uses capability URLs, not authentication**
Why: guests need live tracking without accounts; cuids are unguessable, and the endpoint
returns no PII beyond first name. Alternative: auth-gated tracking. Trade-off: anyone holding
the link can view the order status — acceptable for coffee, revisit for delivery addresses.

**ADR-008 — Pickup codes are human-first (HB-XXXXXX, no 0/O/1/I/L), shown as text**
Why: codes get read aloud at a loud counter and by screen readers; QR is an addition, never
the only representation. Alternative: QR-only. Trade-off: 6 chars of a 31-symbol alphabet
(~890M combinations) — ample for a single café, unique-indexed.

**ADR-009 — Stripe is the source of truth for money state**
Why: our REFUNDED/PAID statuses for online payments flip only when the signed webhook
confirms — never optimistically. Alternative: flip on API response. Trade-off: a minute of
status lag after a refund; in exchange, our books can never disagree with the processor.

**ADR-010 — Transactional email via HTTP, gated, fire-and-forget**
Why: no SDK dependency, and email must never block or fail an order; without RESEND_API_KEY
sends are logged and skipped. Alternative: queue with retries. Trade-off: a dropped email is
possible — acceptable because the tracker link and pickup code also live on the confirmation
screen.

**ADR-011 — The Truth Invariant governs all status claims**
Why: documentation drift is a production risk. Nothing is "Implemented" unless code exists,
is wired into runtime, is reachable in production, and has no TODO in core behavior;
otherwise Partial or Planned. Enforced in every CHANGELOG entry since v3.0.

**ADR-012 — Architecture freeze from Launch 1.0 until flagship data exists**
Why: the next improvement should be chosen by operational evidence, not aesthetics.
Scope: no redesigns, no new navigation, no new loyalty mechanics, no new payment providers,
no major schema changes. Allowed: bug fixes, reliability, responses to operational findings.
Alternative: keep shipping features. Trade-off: slower visible progress — deliberately.
