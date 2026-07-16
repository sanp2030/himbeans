# OR1 — Operational Readiness

PR1 verified the software. OR1 verifies the people and the processes. Nothing here is code —
every item is a human performing a task, timed and recorded. Owner + date next to every tick.

**Exit criterion:** every role completes every drill without assistance, and no drill produces
a question that isn't answered by the Runbook. A repeated question is a documentation bug —
fix RUNBOOK.md, not the person.

---

## 1. Staff certification (each person, each role, unassisted)

| Drill | Barista | Cashier | Manager |
|---|---|---|---|
| Opening (Runbook §1) | ☐ | ☐ | ☐ |
| Peak hour (live queue, 30+ orders) | ☐ | ☐ | ☐ |
| Refund (Runbook §4, incl. counter cash return) | — | ☐ | ☐ |
| Inventory issue (sold-out mid-rush, §9) | ☐ | ☐ | ☐ |
| Customer complaint (wrong drink / missing order / charge dispute) | ☐ | ☐ | ☐ |
| Closing (Runbook §2, incl. stuck-order policy) | ☐ | ☐ | ☐ |

Rule: the trainer may observe but not speak. If they must speak, the drill fails and the
Runbook gains a sentence.

## 2. Training measurement (first real new hire is the test)
- [ ] Onboarding time recorded: docs-only start → first unassisted shift: ______ hours
- [ ] Every question asked during onboarding logged verbatim
- [ ] Each question triaged: answered by Runbook (trainee missed it) vs gap (Runbook updated)
- [ ] Same question asked twice by different people = mandatory documentation fix

## 3. Store recovery drills (timed, with a stopwatch, during a quiet hour)

| Drill | Target | Actual | Steps missed | Doc change? |
|---|---|---|---|---|
| Internet disconnected (Runbook §6) | < 5 min to hotspot POS | ____ | ____ | ☐ |
| POS tablet replaced (§7) | < 2 min | ____ | ____ | ☐ |
| Printer offline → paper tickets | < 2 min | ____ | ____ | ☐ |
| Stripe unavailable (§5) | 0 min (auto-fallback observed) | ____ | ____ | ☐ |
| Coffee grinder down (86 espresso drinks, keep filter/cold) | < 5 min to updated ordering | ____ | ____ | ☐ |
| Staff member absent (run peak with n−1) | Queue stays < 15 min wait | ____ | ____ | ☐ |

## 4. Cash reconciliation (daily, even with digital payments)
- [ ] Opening float counted and recorded (two people)
- [ ] Closing balance = float + counter-paid orders − cash refunds; formula on the sheet
- [ ] Every cash refund cross-checked against an audit-log row (Refund actions are audited)
- [ ] Variance policy written: < $2 note it; ≥ $2 investigate same day; recurring → owner
- [ ] Manager signs the paper sheet; sheet retained (this is the reconciliation source if the
      database is ever restored from backup — Runbook §2 explains why paper is deliberate)

## 5. End-of-Day validation
- [ ] Manager runs **Run End-of-Day Check** in /admin (now a real button — checks orders
      completed, refunds matched, inventory sanity, revenue split for provider matching,
      audit summary; the run itself is audited and is the digital sign-off record)
- [ ] The two honest manual boxes completed: revenue matched against till + Stripe dashboard;
      backup confirmed in the database provider console
- [ ] Any FAILED check resolved before the manager leaves — no exceptions in week one

## 6. Launch 1.0 KPIs (measured weekly, from OrderEvents, logs, and the EOD audit trail)

| Metric | Target | Source |
|---|---|---|
| Checkout completion rate | > 95% | analytics (v5.0) / order.created vs cart adds |
| Successful payment rate | > 99% | payment.succeeded vs payment.failed logs |
| Average order time (Paid → Ready) | < 60 s bar time per drink | OrderEvent timestamps |
| Order accuracy | > 99% | complaint log (paper, week one) |
| Inventory oversells | 0 | inventory.oversell_blocked + negative-stock EOD check |
| Unhandled application errors | 0 critical | error boundary digests + log drain |
| Mean time to recover (operational) | < 15 min | drill log + incident notes |
| Uptime | > 99.9% | /api/health monitor |

## 7. Architecture freeze (Launch 1.0 → data-informed v5.0)
In force per DECISIONS.md ADR-012: no redesigns, no new navigation, no new loyalty mechanics,
no new payment providers, no major schema changes. Bugs, reliability, and operational findings
only. The next feature is chosen by flagship data, not by taste.
