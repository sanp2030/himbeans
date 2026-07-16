import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic"; // a health check must never be cached/prerendered

const bootedAt = Date.now();

/** GET /api/health — liveness + DB reachability for load balancers and uptime checks. */
export async function GET() {
  let database = "ok";
  const t0 = performance.now();
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    database = "unreachable";
  }
  const dbMs = Math.round(performance.now() - t0);

  const healthy = database === "ok";
  return NextResponse.json(
    { status: healthy ? "ok" : "degraded", database, dbMs, uptimeSec: Math.round((Date.now() - bootedAt) / 1000) },
    { status: healthy ? 200 : 503 },
  );
}
