import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const createSchema = z.object({
  roastPref: z.enum(["light", "medium", "espresso"]).default("light"),
  grindPref: z.enum(["whole-bean", "filter", "espresso"]).default("whole-bean"),
});

const updateSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["PAUSE", "RESUME", "CANCEL"]),
  pausedUntil: z.coerce.date().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const sub = await db.subscription.create({
    data: {
      userId: session.user.id,
      ...parsed.data,
      nextShipmentAt: new Date(Date.now() + 7 * 86_400_000),
    },
  });
  // TODO: create Stripe subscription and store providerRef
  return NextResponse.json(sub, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { id, action, pausedUntil } = parsed.data;
  const owned = await db.subscription.findFirst({ where: { id, userId: session.user.id } });
  if (!owned) return NextResponse.json({ error: "Subscription not found." }, { status: 404 });

  const data =
    action === "PAUSE"  ? { status: "PAUSED", pausedUntil: pausedUntil ?? null } :
    action === "RESUME" ? { status: "ACTIVE", pausedUntil: null } :
                          { status: "CANCELLED" };

  const sub = await db.subscription.update({ where: { id }, data });
  return NextResponse.json(sub);
}
