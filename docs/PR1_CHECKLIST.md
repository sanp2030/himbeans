# PR1 — Live Flagship Launch

**Goal:** one physical HimBean café operates entirely on this platform for a full business day
without manual workarounds. Verified in production, owner + date next to every tick.

Supersedes nothing — RELEASE_CHECKLIST.md remains the deploy-day gate; PR1 is the operational
certification around it. RUNBOOK.md must be complete (incl. §11 contacts) before launch.

---

## 1. Production infrastructure
- [ ] Managed Postgres + daily automated backups + **one restore actually performed** into a
      scratch DB, row counts compared
- [ ] Redis provisioned; rate limiting migrated off in-memory before scaling past 1 instance
- [ ] CDN/edge in front (Vercel default) — verify cache headers on /menu
- [ ] Domain + DNS (TTL 300s pre-launch) + HTTPS with auto-renewal verified (check cert expiry)
- [ ] Uptime monitor on /api/health, alerting to a phone; alert tested by inducing a 503
- [ ] Secrets in the platform vault only; rotation owner named

## 2. Payment certification (Stripe test mode, then one live-mode pass)
Run every row; record result. Test cards: https://docs.stripe.com/testing

| # | Scenario | How to test | Expected |
|---|---|---|---|
| P1 | Success | 4242 4242 4242 4242 | PAID, receipt email, meters awarded (if signed in) |
| P2 | Generic decline | 4000 0000 0000 0002 | Error shown, order stays PENDING, "pay at pickup" offered |
| P3 | Insufficient funds | 4000 0000 0000 9995 | Same as P2, decline reason in `payment.failed` log |
| P4 | Expired card | 4000 0000 0000 0069 | Same as P2 |
| P5 | Customer closes browser after order, before pay | Close tab at Elements screen | Order PENDING; collectable at counter; no charge |
| P6 | Double-click Pay | Click twice fast | Single charge (Stripe idempotent per intent); one PAID event |
| P7 | Webhook retry / duplicate delivery | Stripe CLI: resend event twice | Status PAID once; **meters awarded once** (ledger idempotency) |
| P8 | Network timeout mid-confirm | Throttle to offline during confirm | No double charge; intent resolves; tracker reflects truth |
| P9 | Full refund (online) | Admin → Refund | Stripe refund created; webhook flips REFUNDED; audit row exists |
| P10 | Full refund (counter) | Admin → Refund on counter order | Immediate REFUNDED + restock + audit row |
| P11 | Partial refund | — | **Known gap:** not in dashboard; runbook §4 workaround documented. Ship in v5.0 |
| P12 | Stripe outage fallback | Break STRIPE_SECRET_KEY in staging | Order survives with paymentFallback: COUNTER |

## 3. Operational stress test (staging, production-shaped data)
Scenario: 8:00 AM, 100 customers, 4 baristas, 2 cashiers, 1 manager. Peak 150 orders/hour.
- [ ] Run `k6 run scripts/load/peak-hour.js` against staging (script encodes the 150/hr peak
      with a browse:order mix); thresholds must pass
- [ ] During the run, a human works the POS: queue stays responsive (<250 ms perceived),
      status advances don't error under load
- [ ] Inventory race: run `scripts/load/oversell-probe.js` — stock N item, fire 3×N concurrent
      orders → exactly N succeed, rest get 409, final stock is exactly 0
- [ ] DB utilization < 60% at peak; no lock waits > 1s in pg_stat_activity
- [ ] Record: checkout success rate, payment latency p95, queue depth over time

## 4. Disaster recovery (each has a runbook section + one rehearsal)
- [ ] Stripe offline → RUNBOOK §5 rehearsed (counter fallback observed end-to-end)
- [ ] Café internet offline → RUNBOOK §6 rehearsed (hotspot recovery < 5 min)
- [ ] Database restarted → app reconnects (Prisma) with no manual action; verified
- [ ] POS tablet dies → RUNBOOK §7 rehearsed (spare device live < 2 min)
- [ ] "Manager deletes menu" → confirmed impossible from dashboard; Prisma Studio access
      restricted to engineers; restore procedure documented
- [ ] Inventory corrupted → restore-from-backup procedure walked through on scratch DB

## 5. Security review
- [ ] RBAC: all three roles tested against /admin, /pos, and every /api/admin + /api/pos route
- [ ] SQLi: confirmed no raw SQL outside `$queryRaw\`SELECT 1\`` health check
- [ ] XSS: no dangerouslySetInnerHTML beyond static JSON-LD; email templates take no
      user-controlled HTML (name is text-interpolated — verify escaping in client renders)
- [ ] CSRF: Auth.js token flow verified; state-changing routes reject cross-origin form posts
- [ ] Rate limits verified per route class; Redis-backed if >1 instance
- [ ] Session expiration + logout verified; departed-staff deactivation drill run
- [ ] Audit log spot check: refund + cancellation rows contain actor, action, meta, IP

## 6. Accessibility audit (customer flow + POS)
- [ ] Keyboard-only: menu → add → cart drawer → checkout → payment → tracker (no traps;
      drawer traps focus correctly and Escape/close works)
- [ ] Screen reader pass (VoiceOver or NVDA) on the same flow; tracker announces status
      changes (aria-live)
- [ ] Contrast: automated axe scan zero critical on Home, Menu, Checkout, Tracker, POS
- [ ] Touch targets ≥ 44px on POS (baristas tap fast with wet hands — test on the real tablet)
- [ ] Reduced motion honored (OS setting on → no animation)

## 7. Performance budget (enforced, not aspirational)
| Surface | Budget |
|---|---|
| Homepage LCP | < 1.2 s |
| Menu render | < 600 ms |
| Checkout interactive | < 800 ms |
| POS queue update | < 250 ms |
| API p95 | < 150 ms |

- [ ] `lighthouserc.json` budgets wired into CI (`.github/workflows/ci.yml` lighthouse job) —
      a PR that exceeds budget does not merge until the impact is understood and accepted
- [ ] Budgets measured once on production hardware, numbers recorded as the baseline

## 8. Schema freeze (in force from PR1 onward)
See docs/MIGRATION_POLICY.md. Summary: additive-only migrations; no renames; no drops;
no breaking API changes; every migration reversible by ignoring, never by down-migration.

---

**Exit criterion:** the flagship runs one full open-to-close day on the platform. Every manual
workaround used that day is written down; zero workarounds = PR1 complete → Launch 1.0.
