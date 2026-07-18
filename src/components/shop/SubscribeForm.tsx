"use client";

import { useState } from "react";

const ROASTS = [
  { v: "light", label: "Light", note: "Florals and fruit forward" },
  { v: "medium", label: "Medium", note: "Balanced, chocolate and stone fruit" },
  { v: "espresso", label: "Espresso", note: "Developed for milk drinks" },
] as const;

const GRINDS = [
  { v: "whole-bean", label: "Whole bean" },
  { v: "filter", label: "Ground for filter" },
  { v: "espresso", label: "Ground for espresso" },
] as const;

export function SubscribeForm() {
  const [roast, setRoast] = useState<string>("light");
  const [grind, setGrind] = useState<string>("whole-bean");
  const [state, setState] = useState<"idle" | "busy" | "done" | "auth" | "error">("idle");

  async function submit() {
    setState("busy");
    try {
      const r = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roastPref: roast, grindPref: grind }),
      });
      if (r.status === 401) { setState("auth"); return; }
      if (!r.ok) throw new Error();
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="card mt-10 p-8 text-center">
        <p className="font-display text-2xl">You&apos;re in. ⛰️</p>
        <p className="mt-3 opacity-70">
          First shipment leaves the roastery within a week — watch your inbox for the origin
          story. Manage or pause any time from My Orders.
        </p>
      </div>
    );
  }

  return (
    <div className="card mt-10 p-8">
      <p className="font-button text-xs uppercase tracking-[0.2em] text-[#786C63]">Roast preference</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {ROASTS.map((r) => (
          <button key={r.v} onClick={() => setRoast(r.v)} aria-pressed={roast === r.v}
            className={`rounded-xl border p-4 text-left transition ${roast === r.v ? "border-alpine ring-1 ring-alpine" : ""}`}
            style={roast === r.v ? {} : { borderColor: "var(--line)" }}>
            <span className="font-display">{r.label}</span>
            <span className="mt-1 block text-xs opacity-60">{r.note}</span>
          </button>
        ))}
      </div>
      <p className="mt-6 font-button text-xs uppercase tracking-[0.2em] text-[#786C63]">Grind</p>
      <div className="mt-3 flex flex-wrap gap-3">
        {GRINDS.map((g) => (
          <button key={g.v} onClick={() => setGrind(g.v)} aria-pressed={grind === g.v}
            className={`rounded-full border px-4 py-2 text-sm transition ${grind === g.v ? "border-alpine ring-1 ring-alpine" : ""}`}
            style={grind === g.v ? {} : { borderColor: "var(--line)" }}>
            {g.label}
          </button>
        ))}
      </div>
      <button onClick={submit} disabled={state === "busy"} className="btn-green mt-8 w-full">
        {state === "busy" ? "Joining…" : "Join for $24/month"}
      </button>
      {state === "auth" && (
        <p className="mt-4 text-center text-sm opacity-70" role="alert">
          You&apos;ll need an account first — <a href="/api/auth/signin?callbackUrl=/subscribe" className="underline">sign in</a> and
          you&apos;ll land right back here.
        </p>
      )}
      {state === "error" && (
        <p className="mt-4 text-center text-sm text-[#b05436]" role="alert">
          Something went wrong — please try again.
        </p>
      )}
      <p className="mt-6 text-center text-xs opacity-45">
        Billing activates with card payments; until then club membership is settled at the bar.
      </p>
    </div>
  );
}
