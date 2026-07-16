import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { audit } from "@/lib/audit";

const ADMIN_ROLES = ["MANAGER", "ADMIN", "SUPER_ADMIN"];

type Check = { name: string; pass: boolean | null; detail: string };

/**
 * POST /api/admin/eod — Run End-of-Day Check (OR1).
 * Automates what a manager verifies before leaving. `pass: null` = manual step
 * the platform cannot verify (stated honestly rather than green-lit blindly).
 * Running the check is itself audited — the sign-off record.
 */
export async function POST() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Manager access required." }, { status: 403 });
  }
  const actorId = (session?.user as { id?: string } | undefined)?.id ?? null;
  const dayStart = new Date(new Date().setHours(0, 0, 0, 0));
  const checks: Check[] = [];

  // 1. All of today's orders reached a terminal state
  const open = await db.order.findMany({
    where: { createdAt: { gte: dayStart }, status: { notIn: ["COMPLETED", "CANCELLED", "REFUNDED"] } },
    select: { number: true, status: true },
    take: 20,
  });
  checks.push({
    name: "Orders completed",
    pass: open.length === 0,
    detail: open.length === 0
      ? "Every order today is Collected, Cancelled, or Refunded."
      : `${open.length} open: ${open.map((o) => `#${o.number} (${o.status})`).join(", ")} — resolve per Runbook §2.`,
  });

  // 2. Refunds matched: REFUNDED orders whose payment record disagrees
  const refundMismatch = await db.order.count({
    where: { createdAt: { gte: dayStart }, status: "REFUNDED", payment: { isNot: null, is: { status: { not: "REFUNDED" } } } },
  });
  checks.push({
    name: "Refunds matched",
    pass: refundMismatch === 0,
    detail: refundMismatch === 0
      ? "Every refunded order's payment record agrees."
      : `${refundMismatch} refunded order(s) with unrefunded payment records — check Stripe dashboard, escalate if unresolved.`,
  });

  // 3. Inventory sanity: negative stock should be impossible (atomic guard proof)
  const negative = await db.inventoryItem.findMany({
    where: { stock: { lt: 0 } },
    select: { sku: true, stock: true },
  });
  checks.push({
    name: "Inventory reconciled",
    pass: negative.length === 0,
    detail: negative.length === 0
      ? "No negative stock (oversell guard held)."
      : `NEGATIVE STOCK — should be impossible: ${negative.map((n) => `${n.sku}=${n.stock}`).join(", ")}. Escalate immediately.`,
  });

  // 4. Revenue split for provider reconciliation
  const [counter, online] = await Promise.all([
    db.order.aggregate({
      _sum: { total: true }, _count: true,
      where: { createdAt: { gte: dayStart }, status: "COMPLETED", payment: null },
    }),
    db.order.aggregate({
      _sum: { total: true }, _count: true,
      where: { createdAt: { gte: dayStart }, status: { in: ["COMPLETED", "READY", "PREPARING", "PAID", "ACCEPTED", "QUALITY_CHECK"] }, payment: { is: { status: "SUCCEEDED" } } },
    }),
  ]);
  checks.push({
    name: "Revenue vs payment providers",
    pass: null,
    detail: `Counter: $${Number(counter._sum.total ?? 0).toFixed(2)} (${counter._count}) — match against the till. Online: $${Number(online._sum.total ?? 0).toFixed(2)} (${online._count}) — match against the Stripe dashboard for today.`,
  });

  // 5. Audit log activity today (refunds/cancellations reviewed)
  const auditRows = await db.auditLog.findMany({
    where: { createdAt: { gte: dayStart } },
    select: { action: true },
  });
  const byAction = auditRows.reduce<Record<string, number>>((m, r) => ((m[r.action] = (m[r.action] ?? 0) + 1), m), {});
  checks.push({
    name: "Audit log reviewed",
    pass: null,
    detail: auditRows.length === 0
      ? "No audited actions today."
      : `Today: ${Object.entries(byAction).map(([a, n]) => `${a}×${n}`).join(", ")} — confirm each was expected.`,
  });

  // 6. Backup — platform cannot verify the DB provider's backup; honest manual step
  checks.push({
    name: "Backup confirmed",
    pass: null,
    detail: "Verify today's automated backup exists in the database provider console (PR1 §1).",
  });

  const failed = checks.filter((c) => c.pass === false).length;
  const manual = checks.filter((c) => c.pass === null).length;

  await audit({ actorId, action: "eod.check", entity: "Day", entityId: dayStart.toISOString().slice(0, 10),
    meta: { failed, manual, results: checks.map((c) => ({ n: c.name, p: c.pass })) } });
  log("info", "eod.check", { by: actorId, failed, manual });

  return NextResponse.json({
    date: dayStart.toISOString().slice(0, 10),
    summary: failed === 0 ? `Automated checks pass. ${manual} manual confirmations remain.` : `${failed} check(s) FAILED — resolve before leaving.`,
    checks,
  });
}
