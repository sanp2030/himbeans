import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TIERS, tierFor, nextTier, tierRange } from "@/lib/loyalty";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const account = await db.rewardAccount.upsert({
    where: { userId: session.user.id },
    update: {},
    create: { userId: session.user.id },
    include: { ledger: { orderBy: { createdAt: "desc" }, take: 10 } },
  });

  const tier = tierFor(account.points);
  const next = nextTier(account.points);
  return NextResponse.json({
    verticalMeters: account.points,
    tier: tier.name,
    tierRange: tierRange(tier),
    benefits: tier.benefits,
    nextTier: next ? { name: next.name, metersToGo: next.min - account.points } : null,
    ladder: TIERS.map((t) => ({ name: t.name, range: tierRange(t) })),
    recent: account.ledger,
  });
}
