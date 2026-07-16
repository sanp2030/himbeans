import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  if (!rateLimit(`nl:${ip}`, 5)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }
  const parsed = newsletterSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });

  await db.newsletterSubscriber.upsert({
    where: { email: parsed.data.email },
    update: { unsubscribed: false },
    create: { email: parsed.data.email },
  });
  // TODO: send double opt-in email via Resend
  return NextResponse.json({ ok: true });
}
