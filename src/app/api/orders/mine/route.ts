import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/** GET /api/orders/mine — signed-in customer's order history. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true, number: true, status: true, total: true, createdAt: true, pickupCode: true,
      items: { select: { quantity: true, product: { select: { name: true } } } },
    },
  });
  return NextResponse.json({ orders });
}
