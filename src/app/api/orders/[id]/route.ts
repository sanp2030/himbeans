import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { preflight, withCors } from "@/lib/cors";

/** Public order tracking — order ids are unguessable cuids (capability URL).
 *  Returns only what the tracking screen needs; no PII beyond first name. */
export function OPTIONS(req: Request) { return preflight(req); }

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    select: {
      number: true, status: true, pickupCode: true, etaMinutes: true,
      createdAt: true, guestName: true, total: true,
      items: { select: { quantity: true, product: { select: { name: true } } } },
    },
  });
  if (!order) return withCors(_req, NextResponse.json({ error: "Order not found." }, { status: 404 }));
  return withCors(_req, NextResponse.json(order));
}
