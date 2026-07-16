# Release Gate — permanent, every release

If any box is unchecked, the release candidate stays a release candidate. No exceptions,
no "just this once." The gate exists because v3–v4 shipped without ever compiling the app.

```
Release Gate
✓ Install                (pnpm install)
✓ Database migrate       (pnpm db:migrate / migrate deploy)
✓ Database seed          (pnpm db:seed — or verified prod data)
✓ Build                  (pnpm build — zero type errors)
✓ Start production server(pnpm start, /api/health → 200 ok)
✓ Create order           (real POST /api/orders → 201 with pickupCode)
✓ Complete checkout      (browser: menu → add → cart → checkout → tracker)
✓ Verify POS             (order visible; Start → Ready works)
✓ Verify inventory       (tracked item stock decremented by exactly the qty)
✓ Verify loyalty         (signed-in order: Vertical Meters = round(total × 10), once)
✓ Verify audit log       (refund/cancel rows present when exercised)
✓ Verify email           (confirmation received, or skip-log present if unconfigured)
✓ Run smoke tests        (BASE=<url> ./scripts/smoke.sh)
✓ Run unit tests         (pnpm test — all green)
✓ Run the E2E            (tests/e2e/customer-order.spec.ts against the live stack)
✓ Tag release
```

The E2E spec is the automation of this gate's middle section — it is the one test you
never skip before a deployment.


## Added — Social Proof
- [ ] **Social proof content is REAL** — the press quotes and reviews in
  `src/components/site/SocialProof.tsx` ship as invented placeholders. Replace with
  genuine press mentions and reviews (with permission), or remove the section.
  Fabricated press claims on a live site are false advertising.
