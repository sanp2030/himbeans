import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { customerStepIndex } from "@/lib/order-status";

export const metadata = { title: "My orders", robots: { index: false } };
export const dynamic = "force-dynamic";

const STEP_LABELS = ["Received", "Confirmed", "Preparing", "Ready", "Collected"];

export default async function MyOrdersPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="mx-auto max-w-xl px-6 pb-24 pt-36 text-center">
        <p className="eyebrow">Your orders</p>
        <h1 className="mt-2 text-4xl">Sign in to see your history</h1>
        <p className="mt-4 opacity-70">
          Order history, reorders, and Altitude Perks live on your account. Guest orders stay
          trackable via the link in your confirmation SMS/email.
        </p>
        <a href="/api/auth/signin?callbackUrl=/account/orders" className="btn-green mt-8">Sign in</a>
      </div>
    );
  }

  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true, number: true, status: true, total: true, createdAt: true,
      items: { select: { quantity: true, product: { select: { name: true } } } },
    },
  });

  return (
    <div className="mx-auto max-w-2xl px-6 pb-24 pt-36">
      <p className="eyebrow">Your orders</p>
      <h1 className="mt-2 text-4xl">Order history</h1>

      {orders.length === 0 ? (
        <div className="card mt-10 p-10 text-center">
          <p className="font-display text-xl">No orders yet</p>
          <Link href="/menu" className="btn-green mt-6">Browse the menu</Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((o) => {
            const step = customerStepIndex(o.status);
            return (
              <li key={o.id}>
                <Link href={`/order/${o.id}`} className="card block p-6 transition-transform hover:-translate-y-0.5">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-display text-lg font-semibold">Order #{o.number}</span>
                    <span className="font-button font-semibold">${Number(o.total).toFixed(2)}</span>
                  </div>
                  <p className="mt-1 text-sm opacity-60">
                    {o.items.map((i) => `${i.quantity}× ${i.product.name}`).join(" · ")}
                  </p>
                  <p className="mt-2 font-button text-xs uppercase tracking-wider">
                    <span className={step === -1 ? "opacity-50" : "text-alpine dark:text-gold"}>
                      {step === -1 ? o.status.toLowerCase() : STEP_LABELS[step]}
                    </span>
                    <span className="opacity-40"> · {new Date(o.createdAt).toLocaleDateString()}</span>
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
