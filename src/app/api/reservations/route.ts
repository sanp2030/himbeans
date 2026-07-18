import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reservationSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  if (!rateLimit(`res:${ip}`, 10)) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = reservationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const reservation = await db.reservation.create({ data: parsed.data });
  // Email seam: confirmation email sends from here once RESEND_API_KEY is set,
  // following the same gated pattern as order emails in src/lib/email.ts.
  return NextResponse.json({ id: reservation.id, status: reservation.status }, { status: 201 });
}
