# Stripe Sandbox — End-to-End Test Runbook

## 1. Get your sandbox keys (2 minutes)

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy **Publishable key** (`pk_test_...`) and **Secret key** (`sk_test_...`)
3. Add both to your `.env`:
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_SECRET_KEY="sk_test_..."
   ```

## 2. Wire the webhook locally

In a **new terminal** (keep `npm run dev` running in another):
```bash
# Install the Stripe CLI if you don't have it:
# https://stripe.com/docs/stripe-cli#install
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
Copy the `whsec_...` signing secret it prints and add to `.env`:
```
STRIPE_WEBHOOK_SECRET="whsec_..."
```
Restart `npm run dev` so it picks up the new env vars.

## 3. Run the full payment test

1. Add any item to cart → go to `/checkout`
2. You should now see **Credit / debit / prepaid card** enabled (not greyed out)
3. Fill in name + phone, select **Pay by card**, place order
4. Stripe's hosted `PaymentElement` appears with the card form
5. Enter Stripe test card: **4242 4242 4242 4242** · any future date · any CVC · any ZIP
6. Click **Pay $X.XX**
7. You should be redirected to `/order/[id]` with status **PAID**

### Verify the webhook fired
In the `stripe listen` terminal you should see:
```
--> payment_intent.succeeded [evt_...]
  200 POST http://localhost:3000/api/webhooks/stripe [200]
```

In the POS at `/pos` the order should move from **Incoming** to the queue.

### Test card numbers

| Scenario | Card number |
|---|---|
| Success | 4242 4242 4242 4242 |
| Decline | 4000 0000 0000 0002 |
| Insufficient funds | 4000 0000 0000 9995 |
| 3D Secure (requires auth) | 4000 0025 0000 3155 |

## 4. Gift card test

Seed adds a `HB-GIFT-DEMO` card with $25 balance.  
At checkout → select **HimBean gift card** → enter `HB-GIFT-DEMO`.  
- If order total ≤ $25: goes straight to PAID, no Stripe charge.  
- If order total > $25: remainder charged to card.

## 5. Webhook replay (for debugging)

```bash
stripe events resend evt_[id from dashboard]
```

## 6. Production checklist before going live
- [ ] Replace `pk_test_` / `sk_test_` with live keys from dashboard.stripe.com/apikeys
- [ ] Run `stripe listen` equivalent in production → use Stripe Dashboard webhook endpoint instead
- [ ] Set `STRIPE_WEBHOOK_SECRET` to the production webhook signing secret
- [ ] Run one real £1 / $1 / NPR test charge and refund it before launch
