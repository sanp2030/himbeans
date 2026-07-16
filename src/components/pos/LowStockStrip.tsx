"use client";

/** Low-stock strip for the POS — baristas see supply problems at the bar,
 *  not after a customer has already ordered. Polls every 60s (inventory
 *  changes slower than the order queue's 10s cadence). */

import { useEffect, useState } from "react";

type Item = { sku: string; stock: number; lowAlert: number; product: { name: string } };

export function LowStockStrip() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const r = await fetch("/api/pos/low-stock", { cache: "no-store" });
        const d = await r.json();
        if (alive && Array.isArray(d.items)) setItems(d.items);
      } catch { /* strip is advisory — never break the queue over it */ }
    }
    load();
    const poll = setInterval(load, 60_000);
    return () => { alive = false; clearInterval(poll); };
  }, []);

  if (items.length === 0) return null;

  return (
    <div role="status" aria-label="Low stock alerts"
      className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border p-3"
      style={{ borderColor: "var(--ops-accent)", background: "color-mix(in srgb, var(--ops-accent) 8%, transparent)" }}>
      <span className="font-button text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--ops-accent)" }}>
        Low stock
      </span>
      {items.map((i) => (
        <span key={i.sku} className="rounded-full border px-3 py-1 text-xs"
          style={{ borderColor: "var(--line)" }}>
          {i.product.name}: <b>{i.stock === 0 ? "OUT" : `${i.stock} left`}</b>
        </span>
      ))}
    </div>
  );
}
