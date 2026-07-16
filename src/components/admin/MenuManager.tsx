"use client";

/** Menu Manager — the operational CRUD surface for the menu (MANAGER+).
 *  Inline edits for the two things staff change daily (price, availability),
 *  a create form for new items, everything audit-logged server-side. */

import { useEffect, useState } from "react";

type Category = { name: string };
type Product = {
  id: string; name: string; slug: string; description: string;
  price: string; isActive: boolean; isFeatured: boolean;
  badge: string | null; category: Category;
};

export function MenuManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("");
  const [savingId, setSavingId] = useState("");

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/products");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Load failed");
      setProducts(d.products);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load products.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function patch(id: string, changes: Record<string, unknown>, label: string) {
    setSavingId(id);
    setNotice("");
    try {
      const r = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...changes }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Update failed");
      setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, ...d.product, category: p.category } : p)));
      setNotice(`${label} saved.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setSavingId("");
    }
  }

  const shown = products.filter((p) =>
    !filter || p.name.toLowerCase().includes(filter.toLowerCase()) || p.category.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <section className="mt-10" aria-label="Menu management">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl">Menu</h2>
        <input
          aria-label="Filter products"
          placeholder="Filter by name or category…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border bg-[var(--card)] px-4 py-2 text-sm"
          style={{ borderColor: "var(--line)" }}
        />
      </div>

      {error && <p role="alert" className="mt-3 text-sm text-[#b05436]">{error}</p>}
      {notice && <p role="status" className="mt-3 text-sm text-alpine">{notice}</p>}
      {loading && <p className="mt-4 text-sm opacity-60">Loading menu…</p>}

      {!loading && (
        <div className="mt-4 overflow-x-auto rounded-2xl border" style={{ borderColor: "var(--line)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left font-button text-xs uppercase tracking-[0.12em] opacity-50"
                style={{ borderColor: "var(--line)" }}>
                <th className="p-3">Item</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3">Available</th>
                <th className="p-3">Featured</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.id} className="border-b last:border-0" style={{ borderColor: "var(--line)" }}>
                  <td className="p-3">
                    <span className={p.isActive ? "" : "opacity-40 line-through"}>{p.name}</span>
                    {p.badge && <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-[10px]">{p.badge.replace("_", " ")}</span>}
                  </td>
                  <td className="p-3 opacity-60">{p.category.name}</td>
                  <td className="p-3">
                    <PriceEditor
                      value={p.price}
                      disabled={savingId === p.id}
                      onSave={(price) => patch(p.id, { price }, `${p.name} price`)}
                    />
                  </td>
                  <td className="p-3">
                    <button
                      disabled={savingId === p.id}
                      onClick={() => patch(p.id, { isActive: !p.isActive }, `${p.name} availability`)}
                      aria-pressed={p.isActive}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${p.isActive ? "bg-alpine text-white" : "border opacity-60"}`}
                      style={p.isActive ? {} : { borderColor: "var(--line)" }}
                    >
                      {p.isActive ? "86'd? No — live" : "86'd (hidden)"}
                    </button>
                  </td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      aria-label={`Feature ${p.name} on homepage`}
                      checked={p.isFeatured}
                      disabled={savingId === p.id}
                      onChange={() => patch(p.id, { isFeatured: !p.isFeatured }, `${p.name} featured`)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {shown.length === 0 && <p className="p-6 text-center text-sm opacity-50">No products match.</p>}
        </div>
      )}
      <p className="mt-3 text-xs opacity-45">
        Every change here is audit-logged with your account. Items are never deleted — only hidden — because past
        orders reference them.
      </p>
    </section>
  );
}

function PriceEditor({ value, disabled, onSave }: { value: string; disabled: boolean; onSave: (n: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!editing) {
    return (
      <button onClick={() => { setDraft(String(value)); setEditing(true); }} disabled={disabled}
        className="rounded-lg px-2 py-1 font-button hover:bg-[var(--card)]" aria-label={`Edit price, currently $${value}`}>
        ${Number(value).toFixed(2)}
      </button>
    );
  }
  return (
    <span className="flex items-center gap-1">
      <input
        autoFocus type="number" step="0.05" min="0.5" max="999" value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { const n = Number(draft); if (n > 0) { onSave(n); setEditing(false); } }
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-20 rounded-lg border px-2 py-1" style={{ borderColor: "var(--line)" }}
        aria-label="New price"
      />
      <button onClick={() => { const n = Number(draft); if (n > 0) { onSave(n); setEditing(false); } }}
        className="rounded-lg bg-alpine px-2 py-1 text-xs text-white">Save</button>
      <button onClick={() => setEditing(false)} className="px-1 text-xs opacity-50">✕</button>
    </span>
  );
}
