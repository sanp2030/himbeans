import { db } from "@/lib/db";
import { canRefund } from "@/lib/order-status";
import { RefundButton } from "@/components/admin/RefundButton";
import { EodCheck } from "@/components/admin/EodCheck";
import { MenuManager } from "@/components/admin/MenuManager";

export const metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

async function getStats() {
  try {
    const [today, pending, lowStock, subs] = await Promise.all([
      db.order.aggregate({
        _sum: { total: true }, _count: true,
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }, status: { notIn: ["CANCELLED", "REFUNDED"] } },
      }),
      db.order.count({ where: { status: { in: ["PAID", "PREPARING"] } } }),
      db.inventoryItem.count({ where: { stock: { lte: 10 } } }).catch(() => 0),
      db.subscription.count({ where: { status: "ACTIVE" } }),
    ]);
    return {
      revenue: Number(today._sum.total ?? 0),
      orders: today._count,
      pending,
      lowStock,
      subs,
    };
  } catch {
    return { revenue: 0, orders: 0, pending: 0, lowStock: 0, subs: 0 };
  }
}

async function getLowStock() {
  try {
    return await db.inventoryItem.findMany({
      where: { stock: { lte: 10 } },
      orderBy: { stock: "asc" },
      take: 8,
      select: { stock: true, lowAlert: true, sku: true, product: { select: { name: true } } },
    });
  } catch { return []; }
}

async function getRecent() {
  try {
    return await db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, number: true, status: true, total: true, fulfilment: true, createdAt: true },
    });
  } catch { return []; }
}

export default async function AdminPage() {
  const [stats, recent, lowStock] = await Promise.all([getStats(), getRecent(), getLowStock()]);
  const cards = [
    ["Revenue today", `$${stats.revenue.toFixed(2)}`],
    ["Orders today", String(stats.orders)],
    ["In queue", String(stats.pending)],
    ["Active subscriptions", String(stats.subs)],
  ];

  return (
    <div className="ops px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow">HimBean Ops</p>
        <h1 className="mt-1 font-body text-3xl font-semibold tracking-tight">Dashboard</h1>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([label, value]) => (
            <div key={label} className="card p-6">
              <p className="font-button text-[11px] uppercase tracking-[0.2em] opacity-50">{label}</p>
              <p className="mt-2 font-body text-3xl font-semibold">{value}</p>
            </div>
          ))}
        </div>

        {lowStock.length > 0 && (
          <section className="mt-10" aria-label="Inventory alerts">
            <h2 className="font-body text-xl font-semibold" style={{ color: "var(--ops-accent)" }}>
              Inventory alerts
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {lowStock.map((i) => (
                <div key={i.sku} className="card p-4">
                  <p className="font-medium">{i.product.name}</p>
                  <p className="mt-1 text-sm" style={{ color: i.stock === 0 ? "var(--ops-accent)" : "inherit", opacity: i.stock === 0 ? 1 : 0.6 }}>
                    {i.stock === 0 ? "Out of stock — hidden from menu" : `${i.stock} remaining (alert at ${i.lowAlert})`}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <MenuManager />

        <h2 className="mt-12 font-body text-xl font-semibold">Recent orders</h2>
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="font-button text-[11px] uppercase tracking-[0.18em] opacity-50">
                <th className="px-6 py-4">#</th><th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Fulfilment</th><th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Placed</th><th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id} className="border-t" style={{ borderColor: "var(--line)" }}>
                  <td className="px-6 py-3.5 font-medium">#{o.number}</td>
                  <td className="px-6 py-3.5">
                    <span className="rounded-full px-2.5 py-1 text-[11px]"
                      style={{ background: o.status === "COMPLETED" ? "rgba(63,163,77,.18)" : "rgba(253,251,247,.08)",
                               color: o.status === "COMPLETED" ? "#7ed48a" : "inherit" }}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 opacity-70">{o.fulfilment}</td>
                  <td className="px-6 py-3.5">${Number(o.total).toFixed(2)}</td>
                  <td className="px-6 py-3.5 opacity-60">{new Date(o.createdAt).toLocaleTimeString()}</td>
                  <td className="px-6 py-3.5"><RefundButton orderId={o.id} number={o.number} refundable={canRefund(o.status)} /></td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-10 text-center opacity-50">No orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <EodCheck />

        <p className="mt-6 text-sm opacity-50">
          Kitchen queue lives at <a href="/pos" className="underline">/pos</a>. Menu, inventory, and
          campaign management ship next — the APIs and schema already support them.
        </p>
      </div>
    </div>
  );
}
