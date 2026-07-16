"use client";

import { useCallback, useEffect, useState } from "react";

type QueueOrder = {
  id: string; number: number;
  status: "PENDING" | "PAID" | "ACCEPTED" | "PREPARING" | "QUALITY_CHECK" | "READY";
  pickupCode: string | null; etaMinutes: number | null; createdAt: string;
  fulfilment: string;
  items: { quantity: number; product: { name: string } }[];
};

// Simplified staff actions; optional gates (ACCEPTED, QUALITY_CHECK) are supported
// by the backend state machine but skipped in the default flow.
const NEXT: Record<string, { to: string; label: string }> = {
  PENDING: { to: "PREPARING", label: "Start" }, // counter order — payment settles at pickup
  PAID: { to: "PREPARING", label: "Start" },
  ACCEPTED: { to: "PREPARING", label: "Start" },
  PREPARING: { to: "READY", label: "Ready" },
  QUALITY_CHECK: { to: "READY", label: "Pass QC" },
  READY: { to: "COMPLETED", label: "Picked up" },
};

function elapsedMin(iso: string, now: number) {
  return Math.floor((now - new Date(iso).getTime()) / 60_000);
}

export function PosBoard() {
  const [orders, setOrders] = useState<QueueOrder[]>([]);
  const [now, setNow] = useState(Date.now());
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/pos/orders", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders);
      setNow(data.serverTime);
    }
  }, []);

  useEffect(() => {
    load();
    const poll = setInterval(load, 10_000);
    const tick = setInterval(() => setNow((n) => n + 1_000), 1_000);
    return () => { clearInterval(poll); clearInterval(tick); };
  }, [load]);

  async function advance(id: string, status: string) {
    await fetch("/api/pos/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/pos/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setMsg(res.ok
      ? { ok: true, text: `Order #${data.order.number} handed off.` }
      : { ok: false, text: data.error ?? "Verification failed." });
    setCode("");
    load();
  }

  const cols: { keys: string[]; title: string }[] = [
    { keys: ["PENDING", "PAID", "ACCEPTED"], title: "Incoming" },
    { keys: ["PREPARING", "QUALITY_CHECK"], title: "Preparing" },
    { keys: ["READY"], title: "Ready for pickup" },
  ];

  return (
    <>
      {/* QR pickup verification */}
      <form onSubmit={verify} className="card mt-6 flex flex-wrap items-center gap-3 p-4">
        <label htmlFor="pickup-code" className="font-button text-xs uppercase tracking-[0.18em] opacity-60">
          QR pickup code
        </label>
        <input
          id="pickup-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="HB-XXXXXX"
          className="rounded-lg border bg-transparent px-4 py-2 font-mono text-sm tracking-widest"
          style={{ borderColor: "var(--line)" }}
        />
        <button className="rounded-lg px-5 py-2 font-button text-sm font-medium"
          style={{ background: "var(--ops-success)", color: "#fff" }}>
          Verify &amp; hand off
        </button>
        {msg && (
          <p role="status" className="text-sm" style={{ color: msg.ok ? "#7ed48a" : "var(--ops-accent)" }}>
            {msg.text}
          </p>
        )}
      </form>

      {/* Queue columns */}
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {cols.map((col) => {
          const list = orders.filter((o) => col.keys.includes(o.status));
          return (
            <section key={col.title} aria-label={col.title}>
              <h2 className="font-button text-xs uppercase tracking-[0.2em] opacity-60">
                {col.title} · {list.length}
              </h2>
              <div className="mt-3 space-y-3">
                {list.map((o) => {
                  const mins = elapsedMin(o.createdAt, now);
                  const late = o.etaMinutes != null && mins > o.etaMinutes;
                  return (
                    <article key={o.id} className="card p-4">
                      <div className="flex items-baseline justify-between">
                        <span className="font-body text-lg font-semibold">#{o.number}</span>
                        <span className="font-mono text-xs" style={{ color: late ? "var(--ops-accent)" : "inherit", opacity: late ? 1 : 0.55 }}>
                          {mins}m{o.etaMinutes != null && ` / ${o.etaMinutes}m`}
                        </span>
                      </div>
                      <ul className="mt-2 space-y-1 text-sm opacity-80">
                        {o.items.map((it, i) => (
                          <li key={i}>{it.quantity}× {it.product.name}</li>
                        ))}
                      </ul>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-mono text-[11px] opacity-45">{o.pickupCode ?? o.fulfilment}</span>
                        <button
                          onClick={() => advance(o.id, NEXT[o.status].to)}
                          className="rounded-lg px-4 py-1.5 font-button text-xs font-medium"
                          style={{ background: o.status === "READY" ? "var(--ops-success)" : "rgba(253,251,247,.12)", color: o.status === "READY" ? "#fff" : "inherit" }}
                        >
                          {NEXT[o.status].label}
                        </button>
                      </div>
                    </article>
                  );
                })}
                {list.length === 0 && <p className="card p-6 text-center text-sm opacity-40">Empty</p>}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
