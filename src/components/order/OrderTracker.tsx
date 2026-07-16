"use client";

import { useCallback, useEffect, useState } from "react";
import { customerStepIndex } from "@/lib/order-status";

type TrackedOrder = {
  number: number;
  status: string;
  pickupCode: string | null;
  etaMinutes: number | null;
  guestName: string | null;
  total: string;
  items: { quantity: number; product: { name: string } }[];
};

// Customers see five steps; the backend lifecycle (incl. ACCEPTED, QUALITY_CHECK)
// maps onto them via customerStepIndex().
const STEPS = ["Received", "Confirmed", "Preparing", "Ready", "Collected"];

export function OrderTracker({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
    if (res.ok) setOrder(await res.json());
    else setError(true);
  }, [orderId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, [load]);

  if (error) return <p className="opacity-70">We couldn&apos;t find that order.</p>;
  if (!order) return <p className="opacity-50" role="status">Loading your order…</p>;

  const activeIdx = customerStepIndex(order.status);
  const terminal = activeIdx === -1;

  return (
    <div aria-live="polite">
      <p className="eyebrow">Order #{order.number}</p>
      <h1 className="mt-2 text-4xl">
        {order.status === "READY" ? "It's ready — come on up." :
         order.status === "COMPLETED" ? "Enjoy. See you tomorrow?" :
         order.status === "REFUNDED" ? "This order was refunded." :
         terminal ? "This order was cancelled." :
         `Your order is confirmed${order.guestName ? `, ${order.guestName.split(" ")[0]}` : ""}.`}
      </h1>

      {!terminal && (
        <>
          {/* Pickup code — shown as text alongside any QR for accessibility */}
          <div className="card mt-8 p-8 text-center">
            <p className="font-button text-[11px] uppercase tracking-[0.24em] opacity-50">Pickup code — show at the counter</p>
            <p className="mt-2 font-mono text-4xl font-semibold tracking-[0.3em]">{order.pickupCode}</p>
            {order.etaMinutes != null && order.status !== "READY" && order.status !== "COMPLETED" && (
              <p className="mt-3 text-sm opacity-60">Estimated {order.etaMinutes} min · Freshly roasted this week</p>
            )}
          </div>

          {/* Status steps */}
          <ol className="mt-8 space-y-0" aria-label="Order progress">
            {STEPS.map((label, i) => (
              <li key={label} className="flex items-center gap-4 py-2.5">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full font-button text-xs"
                  style={{
                    background: i <= activeIdx ? "var(--alpine, #1F4D3A)" : "transparent",
                    color: i <= activeIdx ? "#F3EDE2" : "inherit",
                    border: i <= activeIdx ? "none" : "1.5px solid var(--line)",
                    opacity: i <= activeIdx ? 1 : 0.45,
                  }}
                  aria-hidden
                >
                  {i < activeIdx ? "✓" : i + 1}
                </span>
                <span className={i === activeIdx ? "font-semibold" : "opacity-55"}>{label}</span>
              </li>
            ))}
          </ol>
        </>
      )}

      <div className="card mt-8 p-6">
        <p className="font-button text-[11px] uppercase tracking-[0.2em] opacity-50">Your items</p>
        <ul className="mt-3 space-y-1.5 text-sm">
          {order.items.map((it, i) => (
            <li key={i} className="flex justify-between">
              <span>{it.quantity}× {it.product.name}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t pt-3 text-right font-button font-semibold" style={{ borderColor: "var(--line)" }}>
          ${Number(order.total).toFixed(2)}
        </p>
      </div>
    </div>
  );
}
