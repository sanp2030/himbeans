"use client";

import { useEffect, useState } from "react";

type Loc = { id: string; name: string; city: string };

export function ReservationForm() {
  const [locations, setLocations] = useState<Loc[]>([]);
  const [form, setForm] = useState({ locationId: "", name: "", email: "", phone: "", date: "", guests: 2, request: "" });
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    fetch("/api/locations").then((r) => r.json()).then((d) => {
      const locs = d.locations ?? [];
      setLocations(locs);
      if (locs[0]) setForm((f) => ({ ...f, locationId: locs[0].id }));
    }).catch(() => {});
  }, []);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit() {
    setState("busy");
    setErrMsg("");
    try {
      const r = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, guests: Number(form.guests), phone: form.phone || undefined, request: form.request || undefined }),
      });
      const d = await r.json();
      if (!r.ok) { setErrMsg(d.error ?? "Please check the form and try again."); setState("error"); return; }
      setState("done");
    } catch {
      setErrMsg("Network problem — please try again.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="card mt-10 p-8 text-center">
        <p className="font-display text-2xl">Table held. 🏔</p>
        <p className="mt-3 opacity-70">We&apos;ve got you down — see you on Lantern Row.</p>
      </div>
    );
  }

  const inputCls = "w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-alpine";
  const lineStyle = { borderColor: "var(--line)" };

  return (
    <div className="card mt-10 space-y-4 p-8">
      {locations.length > 1 && (
        <select aria-label="Location" value={form.locationId} onChange={(e) => set("locationId", e.target.value)} className={inputCls} style={lineStyle}>
          {locations.map((l) => <option key={l.id} value={l.id}>{l.name} — {l.city}</option>)}
        </select>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <input aria-label="Your name" placeholder="Your name" value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} style={lineStyle} />
        <input aria-label="Email" type="email" placeholder="Email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} style={lineStyle} />
        <input aria-label="Phone (optional)" placeholder="Phone (optional)" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} style={lineStyle} />
        <input aria-label="Number of guests" type="number" min={1} max={20} value={form.guests} onChange={(e) => set("guests", Number(e.target.value))} className={inputCls} style={lineStyle} />
      </div>
      <input aria-label="Date and time" type="datetime-local" value={form.date} onChange={(e) => set("date", e.target.value)} className={inputCls} style={lineStyle} />
      <textarea aria-label="Special requests" placeholder="Anything we should know? (optional)" rows={3} value={form.request} onChange={(e) => set("request", e.target.value)} className={inputCls} style={lineStyle} />
      <button onClick={submit} disabled={state === "busy" || !form.name || !form.email || !form.date} className="btn-green w-full">
        {state === "busy" ? "Holding your table…" : "Reserve"}
      </button>
      {state === "error" && <p role="alert" className="text-center text-sm text-[#b05436]">{errMsg}</p>}
    </div>
  );
}
