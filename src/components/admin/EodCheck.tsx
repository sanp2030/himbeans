"use client";

import { useState } from "react";

type Check = { name: string; pass: boolean | null; detail: string };
type Report = { date: string; summary: string; checks: Check[] };

export function EodCheck() {
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/eod", { method: "POST" });
    if (res.ok) setReport(await res.json());
    else setError((await res.json()).error ?? "Check failed to run.");
    setBusy(false);
  }

  return (
    <section className="mt-12" aria-label="End of day check">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-body text-xl font-semibold">End of Day</h2>
        <button onClick={run} disabled={busy}
          className="rounded-full px-5 py-2 font-button text-sm font-medium disabled:opacity-50"
          style={{ background: "var(--ops-success)", color: "#fff" }}>
          {busy ? "Checking…" : "Run End-of-Day Check"}
        </button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm" style={{ color: "var(--ops-accent)" }}>{error}</p>}
      {report && (
        <div className="card mt-4 p-6" role="status">
          <p className="font-medium">{report.date} — {report.summary}</p>
          <ul className="mt-4 space-y-3">
            {report.checks.map((c) => (
              <li key={c.name} className="flex gap-3">
                <span aria-hidden className="mt-0.5 font-button text-sm"
                  style={{ color: c.pass === true ? "#7ed48a" : c.pass === false ? "var(--ops-accent)" : "var(--ops, #C8A951)" }}>
                  {c.pass === true ? "✓" : c.pass === false ? "✕" : "◻"}
                </span>
                <span>
                  <span className="font-medium">{c.name}</span>
                  <span className="sr-only">{c.pass === true ? " passed" : c.pass === false ? " failed" : " requires manual confirmation"}</span>
                  <span className="block text-sm opacity-65">{c.detail}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs opacity-45">
            Running this check is audited and serves as the manager sign-off record (OR1).
          </p>
        </div>
      )}
    </section>
  );
}
