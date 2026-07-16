import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { preflight, withCors } from "@/lib/cors";

export const revalidate = 300;

export function OPTIONS(req: Request) { return preflight(req); }

export async function GET(req: Request) {
  try {
    const locations = await db.location.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, name: true, address: true, city: true },
      orderBy: { name: "asc" },
    });
    return withCors(req, NextResponse.json({ locations }));
  } catch (e) {
    // DB unreachable or not yet migrated/seeded: checkout shows a clear message
    // instead of silently submitting an invalid order.
    log("error", "locations.query_failed", { message: e instanceof Error ? e.message : "unknown" });
    return withCors(req, NextResponse.json({ locations: [], degraded: true }));
  }
}
