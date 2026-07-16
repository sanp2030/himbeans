/**
 * Order lifecycle — single source of truth.
 * Full backend pipeline (per product review):
 *   PENDING → PAID → ACCEPTED → PREPARING → QUALITY_CHECK → READY → COMPLETED
 * with CANCELLED (pre-preparation) and REFUNDED (post-payment) branches.
 * ACCEPTED and QUALITY_CHECK are optional gates: the POS may skip them, analytics
 * still records whichever states an order actually passed through (OrderEvent).
 * Customers see a simplified five-step view via customerStepIndex().
 */
export type OrderStatus =
  | "PENDING" | "PAID" | "ACCEPTED" | "PREPARING" | "QUALITY_CHECK"
  | "READY" | "COMPLETED" | "CANCELLED" | "REFUNDED";

const TRANSITIONS: Record<string, OrderStatus[]> = {
  PENDING:       ["PAID", "PREPARING", "CANCELLED"], // counter orders may start before payment settles
  PAID:          ["ACCEPTED", "PREPARING", "CANCELLED", "REFUNDED"],
  ACCEPTED:      ["PREPARING", "CANCELLED", "REFUNDED"],
  PREPARING:     ["QUALITY_CHECK", "READY", "REFUNDED"],
  QUALITY_CHECK: ["READY", "REFUNDED"],
  READY:         ["COMPLETED", "REFUNDED"],
  COMPLETED:     ["REFUNDED"],
  CANCELLED:     [],
  REFUNDED:      [],
};

export function canTransition(from: string, to: string): boolean {
  return (TRANSITIONS[from] ?? []).includes(to as OrderStatus);
}

/** Statuses from which a refund is permitted (post-payment, pre-terminal or completed). */
export function canRefund(status: string): boolean {
  return ["PAID", "ACCEPTED", "PREPARING", "QUALITY_CHECK", "READY", "COMPLETED"].includes(status);
}

/** Statuses the POS queue displays, grouped into its three columns. */
export const POS_COLUMNS = [
  { title: "Incoming", statuses: ["PENDING", "PAID", "ACCEPTED"] as const },
  { title: "Preparing", statuses: ["PREPARING", "QUALITY_CHECK"] as const },
  { title: "Ready for pickup", statuses: ["READY"] as const },
];

/** Customer tracker: map any backend status onto the simplified five steps.
 *  Returns -1 for terminal branches (cancelled/refunded). */
export function customerStepIndex(status: string): number {
  switch (status) {
    case "PENDING": return 0;                       // Received
    case "PAID": case "ACCEPTED": return 1;         // Confirmed
    case "PREPARING": case "QUALITY_CHECK": return 2; // Preparing
    case "READY": return 3;                         // Ready
    case "COMPLETED": return 4;                     // Collected
    default: return -1;
  }
}
