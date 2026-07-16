import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { awardMeters } from "@/lib/loyalty";
import { sendSms, smsTemplates } from "@/lib/sms";

const STAFF_ROLES = ["STAFF", "MANAGER", "ADMIN", "SUPER_ADMIN"];

/** POST /api/pos/verify — QR pickup: scan code, confirm handoff. */
export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || !STAFF_ROLES.includes(role)) {
    return NextResponse.json({ error: "Staff only." }, { status: 403 });
  }

  const parsed = z.object({ code: z.string().min(4).max(12) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid code format." }, { status: 400 });

  const order = await db.order.findUnique({
    where: { pickupCode: parsed.data.code.toUpperCase() },
    select: { id: true, number: true, status: true, userId: true, total: true, guestPhone: true },
  });
  if (!order) return NextResponse.json({ error: "Code not found." }, { status: 404 });
  if (order.status !== "READY") {
    return NextResponse.json({ error: `Order #${order.number} is ${order.status}, not READY.`, order }, { status: 409 });
  }

  const done = await db.order.update({
    where: { id: order.id },
    data: { status: "COMPLETED" },
    select: { id: true, number: true, status: true },
  });
  if (order.userId) await awardMeters(order.userId, Number(order.total), order.id);
  if (order.guestPhone) void sendSms(order.guestPhone, smsTemplates.collected(order.number));
  return NextResponse.json({ ok: true, order: done });
}
