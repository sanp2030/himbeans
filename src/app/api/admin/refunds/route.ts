import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { canRefund } from "@/lib/order-status";
import { audit } from "@/lib/audit";
import { log, requestId } from "@/lib/logger";

const ADMIN_ROLES = ["MANAGER", "ADMIN", "SUPER_ADMIN"];

/**
 * POST /api/admin/refunds — refund an order (MANAGER+).
 * Stripe-paid orders → Stripe refund is created; the signed webhook flips status
 * (single source of truth for money state). Counter-paid orders → refunded
 * directly, and tracked inventory is restocked.
 */
export async function POST(req: NextRequest) {
  const rid = requestId(req);
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Manager access required." }, { status: 403 });
  }
  const actorId = (session?.user as { id?: string } | undefined)?.id ?? null;

  const parsed = z.object({ orderId: z.string().min(1), reason: z.string().max(300).optional() })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const order = await db.order.findUnique({
    where: { id: parsed.data.orderId },
    select: {
      id: true, number: true, status: true, total: true,
      payment: { select: { provider: true, providerRef: true, status: true } },
      items: { select: { productId: true, quantity: true } },
    },
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (!canRefund(order.status)) {
    return NextResponse.json({ error: `Order #${order.number} is ${order.status} — not refundable.` }, { status: 409 });
  }

  await audit({ actorId, action: "order.refund", entity: "Order", entityId: order.id,
    meta: { number: order.number, amount: Number(order.total), reason: parsed.data.reason, ip: req.headers.get("x-forwarded-for") } });

  // Online payment → refund at the provider; webhook completes our state
  if (order.payment?.provider === "stripe" && order.payment.providerRef && order.payment.status === "SUCCEEDED") {
    if (!stripeEnabled()) return NextResponse.json({ error: "Stripe not configured." }, { status: 501 });
    const refund = await stripe().refunds.create({ payment_intent: order.payment.providerRef });
    log("info", "refund.requested", { rid, orderId: order.id, refundId: refund.id, by: actorId });
    return NextResponse.json({ ok: true, mode: "stripe", refundId: refund.id, note: "Status updates when the webhook confirms." });
  }

  // Counter payment → refund directly and restock tracked inventory
  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: "REFUNDED", events: { create: { status: "REFUNDED", actorId } } },
    });
    await tx.payment.updateMany({ where: { orderId: order.id }, data: { status: "REFUNDED" } });
    for (const i of order.items) {
      await tx.inventoryItem.updateMany({
        where: { productId: i.productId },
        data: { stock: { increment: i.quantity } },
      });
    }
  });
  log("info", "refund.completed_counter", { rid, orderId: order.id, by: actorId });
  return NextResponse.json({ ok: true, mode: "counter", restocked: true });
}
