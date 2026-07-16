/**
 * Altitude Perks — HimBean loyalty engine.
 * Customers earn Vertical Meters (stored in RewardAccount.points; column name
 * kept for backward compatibility). 10 m per $1 spent.
 *
 * Pure functions (TIERS, tierFor, nextTier, metersForOrder) have no DB
 * dependency and are unit-tested in tests/loyalty.test.ts.
 */
export const EARN_RATE = 10; // vertical meters per $1

export const TIERS = [
  { name: "Base Camp", min: 0,     benefits: ["Birthday reward", "Member pricing on beans"] },
  { name: "Langtang",  min: 1_000, benefits: ["Priority pickup", "Early seasonal access"] },
  { name: "Annapurna", min: 3_000, benefits: ["Exclusive member coffees", "Member events"] },
  { name: "Everest",   min: 8_848, benefits: ["Limited releases first", "Annual origin-trip draw"] },
] as const;

export type Tier = (typeof TIERS)[number];

/** Human-readable range: "1,000–2,999 m" / "8,848 m+" — tangible progress per feedback. */
export function tierRange(tier: Tier): string {
  const i = TIERS.findIndex((t) => t.name === tier.name);
  const next = TIERS[i + 1];
  return next
    ? `${tier.min.toLocaleString()}–${(next.min - 1).toLocaleString()} m`
    : `${tier.min.toLocaleString()} m+`;
}

export function metersForOrder(orderTotal: number): number {
  return Math.max(0, Math.round(orderTotal * EARN_RATE));
}

export function tierFor(meters: number): Tier {
  return [...TIERS].reverse().find((t) => meters >= t.min) ?? TIERS[0];
}

export function nextTier(meters: number): Tier | null {
  return TIERS.find((t) => t.min > meters) ?? null;
}

/** Award meters after a paid order; idempotent per order via ledger reason key.
 *  DB is imported lazily so the pure core stays test-friendly. */
export async function awardMeters(userId: string, orderTotal: number, orderId: string) {
  const delta = metersForOrder(orderTotal);
  if (delta === 0) return;
  const { db } = await import("./db");

  await db.$transaction(async (tx) => {
    const account = await tx.rewardAccount.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    const already = await tx.rewardLedger.findFirst({
      where: { accountId: account.id, reason: `order:${orderId}` },
    });
    if (already) return;

    const updated = await tx.rewardAccount.update({
      where: { id: account.id },
      data: { points: { increment: delta } },
    });
    await tx.rewardLedger.create({
      data: { accountId: account.id, delta, reason: `order:${orderId}` },
    });
    const tier = tierFor(updated.points);
    if (tier.name !== updated.tier) {
      await tx.rewardAccount.update({ where: { id: account.id }, data: { tier: tier.name } });
    }
  });
}
