"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RefundButton({ orderId, number, refundable }: { orderId: string; number: number; refundable: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  if (!refundable) return <span className="text-xs opacity-30">—</span>;

  async function refund() {
    if (!confirm(`Refund order #${number}? This is audited and cannot be undone.`)) return;
    setBusy(true);
    const res = await fetch("/api/admin/refunds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const data = await res.json();
    setMsg(res.ok ? (data.mode === "stripe" ? "Refund sent to Stripe" : "Refunded + restocked") : data.error);
    setBusy(false);
    router.refresh();
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button onClick={refund} disabled={busy}
        className="rounded-full border px-3 py-1 font-button text-[11px] disabled:opacity-40"
        style={{ borderColor: "var(--ops-accent)", color: "var(--ops-accent)" }}>
        {busy ? "…" : "Refund"}
      </button>
      {msg && <span className="text-[11px] opacity-60" role="status">{msg}</span>}
    </span>
  );
}
