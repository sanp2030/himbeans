import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const STAFF_ROLES = ["BARISTA", "MANAGER", "ADMIN", "SUPER_ADMIN"];

/** GET /api/pos/low-stock — items at or below their alert threshold, for the POS strip.
 *  Baristas need this at the bar (to warn customers / stop selling), not just managers
 *  in the back office. */
export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || !STAFF_ROLES.includes(role)) {
    return NextResponse.json({ error: "Staff access required." }, { status: 403 });
  }
  try {
    const items = await db.inventoryItem.findMany({
      where: { stock: { lte: db.inventoryItem.fields.lowAlert } },
      select: { sku: true, stock: true, lowAlert: true, product: { select: { name: true } } },
      orderBy: { stock: "asc" },
      take: 12,
    });
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [], degraded: true });
  }
}
