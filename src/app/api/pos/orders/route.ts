import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { log, requestId } from "@/lib/logger";
import { canTransition } from "@/lib/order-status";
import { awardMeters } from "@/lib/loyalty";
import { audit } from "@/lib/audit";
import { sendSms, smsTemplates } from "@/lib/sms";

const STAFF_ROLES = ["STAFF", "MANAGER", "ADMIN", "SUPER_ADMIN"];

async function requireStaff() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role && STAFF_ROLES.includes(role) ? session : null;
}

/** GET /api/pos/orders — live drink queue for the kitchen display. */
export async function GET() {
  if (!(await requireStaff())) return NextResponse.json({ error: "Staff only." }, { status: 403 });

  const orders = await db.order.findMany({
    where: { status: { in: ["PENDING", "PAID", "ACCEPTED", "PREPARING", "QUALITY_CHECK", "READY"] } },
    orderBy: { createdAt: "asc" },
    take: 40,
    select: {
      id: true, number: true, status: true, pickupCode: true, etaMinutes: true,
      createdAt: true, fulfilment: true,
      items: { select: { quantity: true, customization: true, product: { select: { name: true } } } },
    },
  });
  return NextResponse.json({ orders, serverTime: Date.now() });
}

const advanceSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["PAID", "ACCEPTED", "PREPARING", "QUALITY_CHECK", "READY", "COMPLETED", "CANCELLED"]),
});

/** PATCH — advance an order through the lifecycle (state machine enforced). */
export async function PATCH(req: NextRequest) {
  const session = await requireStaff();
  if (!session) return NextResponse.json({ error: "Staff only." }, { status: 403 });

  const parsed = advanceSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const current = await db.order.findUnique({
    where: { id: parsed.data.id },
    select: { status: true, userId: true, total: true, guestPhone: true, pickupCode: true, number: true },
  });
  if (!current) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (!canTransition(current.status, parsed.data.status)) {
    return NextResponse.json(
      { error: `Invalid transition ${current.status} → ${parsed.data.status}.` },
      { status: 409 },
    );
  }

  const actorId = (session.user as { id?: string } | undefined)?.id ?? null;
  const order = await db.order.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      events: { create: { status: parsed.data.status, actorId } }, // per-state timestamp
    },
    select: { id: true, number: true, status: true },
  });

  if (order.status === "CANCELLED") {
    await audit({ actorId, action: "order.cancel", entity: "Order", entityId: order.id, meta: { number: order.number, from: current.status } });
  }

  if (current.guestPhone) {
    if (order.status === "READY") void sendSms(current.guestPhone, smsTemplates.ready(current.number, current.pickupCode ?? ""));
    if (order.status === "COMPLETED") void sendSms(current.guestPhone, smsTemplates.collected(current.number));
  }

  // Loyalty: counter/cash path — Vertical Meters on completion (idempotent; the Stripe webhook shares this call)
  if (order.status === "COMPLETED" && current.userId) {
    await awardMeters(current.userId, Number(current.total), order.id);
  }
  log("info", "order.status", { rid: requestId(req), orderId: order.id, number: order.number, status: order.status });
  return NextResponse.json(order);
}
