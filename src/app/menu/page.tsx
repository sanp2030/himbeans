import type { Metadata } from "next";
import { db } from "@/lib/db";
import { MenuExplorer } from "@/components/menu/MenuExplorer";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Signatures, espresso bar, origin filter, cold collection, and bakery. One line per drink — choose in ten seconds.",
};

export const revalidate = 300;

export default async function MenuPage() {
  let categories: Awaited<ReturnType<typeof query>> = [];
  async function query() {
    return db.category.findMany({
      orderBy: { ordering: "asc" },
      include: {
        products: {
          // Auto-disable ordering when tracked inventory hits zero (untracked items always show)
          where: { isActive: true, OR: [{ inventory: null }, { inventory: { stock: { gt: 0 } } }] },
          select: {
            id: true, slug: true, name: true, description: true, price: true,
            calories: true, allergens: true, dietTags: true, badge: true, nudge: true,
            origin: true, region: true, altitudeM: true, process: true, variety: true,
            roastLevel: true, flavorNotes: true, pairsWith: true,
          },
        },
      },
    });
  }
  try { categories = await query(); } catch { /* pre-migration boot */ }

  const serializable = categories.map((c) => ({
    ...c,
    products: c.products.map((p) => ({ ...p, price: Number(p.price) })),
  }));

  return (
    <div className="mx-auto max-w-4xl px-6 pb-24 pt-36">
      <p className="eyebrow">The menu</p>
      <h1 className="mt-2 text-5xl">Choose in five seconds</h1>
      <p className="mt-4 max-w-xl opacity-70">
        One line per drink. Tags mark what regulars actually order. Any milk swaps to oat or
        almond, +0.60.
      </p>
      <p className="mt-3 font-button text-xs uppercase tracking-[0.2em] text-gold">
        Freshly roasted this week · Limited batches daily · Pickup in 7–12 min
      </p>
      <MenuExplorer categories={serializable} />
    </div>
  );
}
