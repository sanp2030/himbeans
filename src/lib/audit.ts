/**
 * Audit trail for critical operations — the only reliable record when something
 * goes wrong. Never throws: an audit failure must not break the operation itself
 * (it is logged loudly instead).
 */
import { db } from "./db";
import { log } from "./logger";

export async function audit(params: {
  actorId?: string | null;
  action: string; // order.refund, order.status, order.cancel, menu.update, reward.manual…
  entity: string;
  entityId?: string;
  meta?: Record<string, unknown>;
  ip?: string | null;
}) {
  try {
    await db.auditLog.create({
      data: {
        actorId: params.actorId ?? undefined,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        meta: params.meta as never,
        ip: params.ip ?? undefined,
      },
    });
  } catch (e) {
    log("error", "audit.write_failed", { action: params.action, entityId: params.entityId, message: e instanceof Error ? e.message : "unknown" });
  }
}
