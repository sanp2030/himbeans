import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { awardMeters } from "@/lib/loyalty";
import { log } from "@/lib/logger";
import { sendEmail, receiptHtml } from "@/lib/email";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  if (!stripeEnabled() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 501 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await req.text(), sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    log("warn", "webhook.bad_signature", { message: e instanceof Error ? e.message : "unknown" });
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object;
      const orderId = pi.metadata?.orderId;
      if (!orderId) break;

      const order = await db.order.update({
        where: { id: orderId },
        data: {
          status: "PAID",
          events: { create: { status: "PAID" } }, // per-state timestamp (system actor)
          payment: {
            upsert: {
              create: { provider: "stripe", providerRef: pi.id, amount: pi.amount / 100, currency: pi.currency.toUpperCase(), status: "SUCCEEDED" },
              update: { status: "SUCCEEDED", providerRef: pi.id },
            },
          },
        },
        select: { id: true, number: true, userId: true, total: true, subtotal: true, tax: true, guestEmail: true, user: { select: { email: true } } },
      });
      if (order.userId) await awardMeters(order.userId, Number(order.total), order.id);
      const to = order.guestEmail ?? order.user?.email;
      if (to) {
        void sendEmail(to, `HimBean receipt — order #${order.number}`, receiptHtml({
          number: order.number, total: Number(order.total),
          subtotal: Number(order.subtotal), tax: Number(order.tax), provider: "card / wallet",
        }));
      }
      log("info", "payment.succeeded", { orderId, number: order.number, intentId: pi.id });
      break;
    }
    case "payment_intent.payment_failed": {
      const pi = event.data.object;
      log("warn", "payment.failed", { orderId: pi.metadata?.orderId, intentId: pi.id, reason: pi.last_payment_error?.message });
      // Order stays PENDING; customer can retry or pay at the counter
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object;
      const intentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
      if (!intentId) break;
      const payment = await db.payment.findFirst({ where: { providerRef: intentId }, select: { orderId: true } });
      if (payment) {
        await db.order.update({
          where: { id: payment.orderId },
          data: { status: "REFUNDED", events: { create: { status: "REFUNDED" } } },
        });
        await db.payment.updateMany({ where: { providerRef: intentId }, data: { status: "REFUNDED" } });
        log("info", "payment.refunded", { orderId: payment.orderId, intentId });
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
