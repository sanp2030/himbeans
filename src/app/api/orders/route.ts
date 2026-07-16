import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { preflight, withCors } from "@/lib/cors";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createOrderSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { log, requestId } from "@/lib/logger";
import { generatePickupCode } from "@/lib/pickup";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { sendEmail, orderConfirmationHtml } from "@/lib/email";
import { sendSms, smsTemplates } from "@/lib/sms";

/**
 * POST /api/orders — create an order with authoritative pricing.
 * - Prices computed server-side from the DB (client sends ids + quantities only)
 * - Inventory checked and decremented atomically; out-of-stock returns 409
 * - payOnline + Stripe configured → PaymentIntent created, clientSecret returned
 * - otherwise → counter-payment order (paid at pickup, staff marks PAID on POS)
 */
export function OPTIONS(req: Request) { return preflight(req); }

export async function POST(req: NextRequest) {
  const rid = requestId(req);
  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  if (!rateLimit(`order:${ip}`, 15)) {
    return withCors(req, NextResponse.json({ error: "Too many requests." }, { status: 429 }));
  }

  const session = await auth();
  const parsed = createOrderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return withCors(req, NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 }));
  }
  const input = parsed.data;

  const products = await db.product.findMany({
    where: { id: { in: input.items.map((i) => i.productId) }, isActive: true },
    select: { id: true, name: true, price: true, inventory: { select: { id: true, stock: true } } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  if (byId.size !== new Set(input.items.map((i) => i.productId)).size) {
    return withCors(req, NextResponse.json({ error: "One or more items are unavailable." }, { status: 409 }));
  }

  // Inventory pre-check (final check happens atomically inside the transaction)
  for (const i of input.items) {
    const inv = byId.get(i.productId)!.inventory;
    if (inv && inv.stock < i.quantity) {
      return withCors(req, NextResponse.json(
        { error: `${byId.get(i.productId)!.name} is out of stock.`, productId: i.productId },
        { status: 409 },
      ));
    }
  }

  let subtotal = 0;
  const items = input.items.map((i) => {
    const unitPrice = Number(byId.get(i.productId)!.price);
    subtotal += unitPrice * i.quantity;
    return { productId: i.productId, quantity: i.quantity, unitPrice, customization: (i.customization ?? undefined) as Prisma.InputJsonValue | undefined };
  });

  let discount = 0;
  let couponId: string | undefined;
  if (input.couponCode) {
    const coupon = await db.coupon.findFirst({
      where: {
        code: input.couponCode.toUpperCase(),
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    if (coupon && (!coupon.minSpend || subtotal >= Number(coupon.minSpend))) {
      discount = coupon.type === "PERCENT" ? (subtotal * Number(coupon.value)) / 100 : Number(coupon.value);
      couponId = coupon.id;
    }
  }

  const tax = +((subtotal - discount) * 0.13).toFixed(2);
  const deliveryFee = input.fulfilment === "DELIVERY" ? 2.5 : 0;
  const total = +(subtotal - discount + tax + deliveryFee).toFixed(2);

  // Gift card redemption: server-authoritative, applied before any card payment
  let giftCard: { id: string; balance: number } | null = null;
  let giftCardApplied = 0;
  if (input.giftCardCode) {
    const gc = await db.giftCard.findFirst({
      where: {
        code: input.giftCardCode,
        balance: { gt: 0 },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { id: true, balance: true },
    });
    if (!gc) return withCors(req, NextResponse.json({ error: "Gift card not found, empty, or expired." }, { status: 409 }));
    giftCard = { id: gc.id, balance: Number(gc.balance) };
    giftCardApplied = Math.min(giftCard.balance, total);
  }
  const amountDue = +(total - giftCardApplied).toFixed(2);
  const fullyGiftPaid = giftCardApplied > 0 && amountDue === 0;

  // Atomic: create order + decrement inventory (guarded so concurrent orders can't oversell)
  let order;
  try {
    order = await db.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId: session?.user?.id,
          guestName: input.guestName,
          guestPhone: input.guestPhone,
          guestEmail: input.guestEmail,
          locationId: input.locationId,
          fulfilment: input.fulfilment,
          addressId: input.addressId,
          couponId,
          giftCardId: giftCard?.id,
          giftCardApplied,
          status: fullyGiftPaid ? "PAID" : undefined,
          subtotal, discount, tax, deliveryFee, total,
          etaMinutes: 12 + input.items.length * 2,
          scheduledFor: input.scheduledFor,
          pickupCode: generatePickupCode(),
          notes: input.notes,
          items: { create: items },
        },
        select: { id: true, number: true, total: true, etaMinutes: true, pickupCode: true },
      });
      await tx.orderEvent.create({ data: { orderId: created.id, status: "PENDING" } });
      if (fullyGiftPaid) await tx.orderEvent.create({ data: { orderId: created.id, status: "PAID" } });

      if (giftCard && giftCardApplied > 0) {
        const gcRes = await tx.giftCard.updateMany({
          where: { id: giftCard.id, balance: { gte: giftCardApplied } },
          data: { balance: { decrement: giftCardApplied } },
        });
        if (gcRes.count === 0) throw new Error("GIFT_CARD_RACE");
        if (fullyGiftPaid) {
          await tx.payment.create({
            data: { orderId: created.id, provider: "gift_card", amount: giftCardApplied, status: "SUCCEEDED" },
          });
        }
      }

      for (const i of input.items) {
        const inv = byId.get(i.productId)!.inventory;
        if (!inv) continue;
        const res = await tx.inventoryItem.updateMany({
          where: { id: inv.id, stock: { gte: i.quantity } },
          data: { stock: { decrement: i.quantity } },
        });
        if (res.count === 0) throw new Error(`OUT_OF_STOCK:${byId.get(i.productId)!.name}`);
      }
      return created;
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "GIFT_CARD_RACE") {
      return withCors(req, NextResponse.json({ error: "Gift card balance changed — please retry." }, { status: 409 }));
    }
    if (msg.startsWith("OUT_OF_STOCK:")) {
      log("warn", "inventory.oversell_blocked", { rid, item: msg.slice(13) });
      return withCors(req, NextResponse.json({ error: `${msg.slice(13)} just sold out.` }, { status: 409 }));
    }
    log("error", "order.create_failed", { rid, message: msg });
    return withCors(req, NextResponse.json({ error: "Could not create order." }, { status: 500 }));
  }

  log("info", "order.created", { rid, orderId: order.id, number: order.number, total: order.total, items: input.items.length, fulfilment: input.fulfilment });

  if (fullyGiftPaid && session?.user?.id) {
    const { awardMeters } = await import("@/lib/loyalty");
    await awardMeters(session.user.id, total, order.id);
  }

  // SMS confirmation (E.164 phone from the validator transform)
  if (input.guestPhone) {
    const base0 = process.env.AUTH_URL ?? "https://himbean.coffee";
    void sendSms(input.guestPhone, smsTemplates.confirmed(order.number, order.pickupCode ?? "", order.etaMinutes, `${base0}/order/${order.id}`));
  }

  const toEmail = input.guestEmail ?? session?.user?.email;
  if (toEmail) {
    const base = process.env.AUTH_URL ?? "https://himbean.coffee";
    void sendEmail(toEmail, `HimBean order #${order.number} confirmed`, orderConfirmationHtml({
      number: order.number,
      pickupCode: order.pickupCode,
      etaMinutes: order.etaMinutes,
      total: Number(order.total),
      items: input.items.map((i) => ({ quantity: i.quantity, name: byId.get(i.productId)!.name })),
      trackingUrl: `${base}/order/${order.id}`,
    }));
  }

  // Sprint 1 seam: online payment via Stripe PaymentIntent
  if (input.payOnline && stripeEnabled() && amountDue > 0) {
    try {
      const intent = await stripe().paymentIntents.create({
        amount: Math.round(amountDue * 100),
        currency: "usd",
        automatic_payment_methods: { enabled: true }, // cards + Apple Pay + Google Pay
        receipt_email: input.guestEmail ?? session?.user?.email ?? undefined,
        metadata: { orderId: order.id, orderNumber: String(order.number) },
      });
      log("info", "payment.intent_created", { rid, orderId: order.id, intentId: intent.id });
      return withCors(req, NextResponse.json({ ...order, giftCardApplied, amountDue, clientSecret: intent.client_secret }, { status: 201 }));
    } catch (e) {
      log("error", "payment.intent_failed", { rid, orderId: order.id, message: e instanceof Error ? e.message : "unknown" });
      // Order survives as counter-payment; customer is told to pay at pickup
      return withCors(req, NextResponse.json({ ...order, paymentFallback: "COUNTER" }, { status: 201 }));
    }
  }

  return withCors(req, NextResponse.json({ ...order, giftCardApplied, amountDue }, { status: 201 }));
}
