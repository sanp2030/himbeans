# HimBean Flagship Runbook

**Purpose:** a new manager can operate the café on this platform for a full business day using
only this document. If a procedure here doesn't work as written, that is a P1 bug — report it
and use the fallback.

**The one rule:** coffee never stops. Every digital failure below has a paper/manual fallback.
Fix the system after the rush, not during it.

---

## 1. Opening checklist (before doors, ~30 min)

1. Power on POS tablets → open `https://<domain>/pos` → sign in with your STAFF account.
2. Confirm the queue loads (empty is fine). If it shows an error → §8 Internet/System down.
3. Check **Admin → Inventory alerts** (`/admin`, MANAGER account):
   - Out-of-stock items are already hidden from the menu automatically.
   - Low-stock items: decide now — restock, or let them sell through.
4. Place one **test order** from a phone on the customer site (small item, pay at pickup).
   Confirm it appears in POS "Incoming" within 15 seconds. Advance it to Collected. Refund it
   from Admin (this also verifies the refund path daily). Cost: one audited test refund/day.
5. Verify the pickup-code flow: the test order's code verified correctly at the POS form.
6. Check yesterday's revenue on `/admin` matches the till expectation. Discrepancy → note it
   in the log book and flag to the owner; do not adjust records without an audit reason.
7. Confirm the espresso machine, grinder, and card terminal (if separate) are up — the
   platform does not monitor physical equipment.

## 2. Closing checklist (~20 min)

1. POS: every order must be in **Collected**, **Cancelled**, or **Refunded**. Orders stuck in
   Ready = customer never came → wait policy is 45 min, then Cancel (audited) and restock
   manually if the item was tracked (§9).
2. Admin: skim "Recent orders" for anything anomalous (unusually large, repeated refunds).
3. Note today's revenue + order count in the daily log book (redundant paper record — this is
   deliberate, it is your reconciliation source if the database is ever restored from backup).
4. Do NOT power off tablets mid-transition; finish or cancel queue items first.

## 3. Taking orders

- **Online / order-ahead:** appear automatically in POS "Incoming". Tap **Start** when the bar
  picks it up, **Ready** when done, then verify the customer's **pickup code** (type it into
  the POS verify box — the customer has it on their phone and in email). Codes never contain
  0/O/1/I/L, so read letters literally.
- **Walk-in (counter):** ring at the till as normal. If you also want walk-ins in the digital
  queue, place them on a tablet via the customer site with "Pay at pickup".
- **Wrong code / code not found:** ask for the order number instead (it's on the same screen),
  find it in the Ready column, confirm the name, hand off with the "Picked up" button.

## 4. Refunds

1. Only MANAGER+ accounts can refund. `/admin` → Recent orders → **Refund** → confirm.
2. The system decides the path automatically:
   - Paid online → money returns via Stripe (customer sees it in 5–10 business days; tell
     them this). Status flips to Refunded when Stripe confirms — may take a minute.
   - Paid at counter → status flips immediately AND tracked items restock automatically.
     **You must also return the cash/card payment at the till yourself** — the platform does
     not open the cash drawer.
3. Every refund records who, when, how much, and why in the audit log. If a customer disputes
   later, that log is your record.
4. **Partial refunds:** not yet supported in the dashboard. Refund in full, re-ring the items
   they kept at the till, and note it in the log book. (Planned improvement — see PR1 gaps.)

## 5. Stripe / online payment outage

Symptoms: customers report "Pay online" failing; `payment.intent_failed` alerts.

1. **Nothing to do at the counter.** The system automatically falls back: orders placed during
   an online-payment failure arrive marked as pay-at-pickup. Collect payment at the till.
2. If it persists >30 min: check https://status.stripe.com. If Stripe is down, it is not your
   configuration. If Stripe is up, escalate to the technical contact (§11).
3. Orders already paid online before the outage are unaffected.

## 6. Internet outage (café connectivity)

1. Coffee continues: paper tickets at the till, cash/standalone card terminal.
2. Online ordering keeps working for customers (the site is hosted off-premises) — but you
   can't see the queue. **Action within 5 minutes:** ask the technical contact to enable the
   store-closed banner, or if you have a phone with data, open `/admin` on it and watch the
   queue from the phone; a phone hotspot for one POS tablet is the fastest full recovery.
3. When connectivity returns, work through the accumulated Incoming column oldest-first and
   call customers whose orders aged out (phone numbers are on the orders).

## 7. POS tablet crashes / kitchen tablet dies

- The POS has no local state — everything lives on the server. **Any browser on any device**
  can be the POS: open `/pos` on a phone, laptop, or spare tablet and sign in. Recovery time
  should be under 2 minutes.
- Keep one charged spare tablet in the office, already signed in, screen locked.

## 8. Whole system down (site unreachable)

1. Paper tickets; coffee continues.
2. Check `https://<domain>/api/health` from a phone. If it returns an error or times out,
   message the technical contact with the time and what you see — do not attempt fixes.
3. Rollback and restore are engineering actions (see RELEASE_CHECKLIST §9); your job is
   continuity of service and an accurate paper record for later reconciliation.

## 9. Inventory adjustments

- Delivery arrived / stock correction: currently via the technical contact or Prisma Studio
  (engineer task). **Until the Inventory UI ships (v5.0), managers request adjustments; they
  don't make them.** Every adjustment must state a reason — it is audited.
- Sold out early (untracked item, e.g. a drink whose ingredient ran out): ask the technical
  contact to zero/track it, or accept orders and phone customers — your call by queue size.
- "Manager accidentally deleted the menu": not possible from the dashboard today (there is no
  delete). If data looks wrong, stop, screenshot, escalate — do not "fix" records manually.

## 10. Accounts

- **New staff:** request from the technical contact with name, email, and role
  (STAFF = barista/till, MANAGER = shift lead + refunds). Principle: the least role that does
  the job. Never share logins — audit logs are only useful if identities are real.
- **Password reset:** staff use the login page's reset flow; if email is not configured yet,
  the technical contact resets it. Departing staff: request deactivation the same day.

## 11. Emergency contacts (fill in before launch — launch is blocked until complete)

| Role | Name | Phone | When |
|---|---|---|---|
| Technical contact (primary) | ______ | ______ | System down, Stripe issues, data problems |
| Technical contact (backup) | ______ | ______ | Primary unreachable 15 min |
| Owner | ______ | ______ | Revenue discrepancies, disputes, press |
| Payments (Stripe dashboard access) | ______ | ______ | Refund disputes, payout questions |
| Internet provider | ______ | ______ | Connectivity down >15 min |

## 12. Escalation ladder

Broken but coffee flows → note it, report after rush.
Customers affected (can't order/pay online) → technical contact within 5 minutes.
Money wrong (charged twice, refund missing) → technical contact + owner immediately; never
promise a resolution timeline you can't control — promise a call-back today instead.
