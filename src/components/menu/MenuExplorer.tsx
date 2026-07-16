"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useCart } from "@/store/cart";
import { ProductDetail, type DetailProduct } from "./ProductDetail";

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  calories: number | null;
  allergens: string[];
  dietTags: string[];
  badge: string | null;
  nudge: string | null;
  origin: string | null;
  region: string | null;
  altitudeM: number | null;
  process: string | null;
  variety: string | null;
  roastLevel: string | null;
  flavorNotes: string[];
  pairsWith: string | null;
};

type Category = { id: string; name: string; products: Product[] };

const BADGES: Record<string, { label: string; className: string }> = {
  BEST_SELLER: { label: "⭐ Best Seller", className: "pill-star" },
  POPULAR: { label: "🔥 Popular", className: "pill-fire" },
  SEASONAL: { label: "❄️ Seasonal", className: "pill-snow" },
  STRONG: { label: "☕ Strong", className: "pill-bolt" },
  BARISTA_FAVORITE: { label: "⭐ Barista Favorite", className: "pill-leaf" },
};

/** Category header photos — real photography where supplied; omitted categories
 * simply render without a header image (no placeholder needed here, this is a
 * pure bonus visual, not a layout-critical slot). */
const CATEGORY_PHOTOS: Record<string, string> = {
  "Signature Collection": "/images/cat-signature.jpg",
  "Iced Signatures": "/images/cat-iced.jpg",
  "Espresso Classics": "/images/cat-espresso.jpg",
  "Pour Over & Filter": "/images/cat-pourover.jpg",
  "Matcha & Tea Lattes": "/images/cat-matcha.jpg",
  Refreshers: "/images/cat-refreshers.jpg",
  Bakery: "/images/cat-bakery.jpg",
};

const SECTION_ICONS: Record<string, string> = {
  "Signature Collection": "⭐", "Iced Signatures": "❄", "Espresso Classics": "☕",
  "Cold Brew & Nitro": "🧊", "Matcha & Tea Lattes": "🍵", "Pour Over & Filter": "🌿",
  "Chocolate & Mocha": "🍫", "Tea Collection": "🧋", Refreshers: "🍋",
  "Milk & Wellness": "🥛", "Frappé Collection": "🥤", "Limited Reserve": "🌄",
  Bakery: "🥐", "Retail Coffee": "🛍️",
};

/** Menu strategy: ~80 drinks presented in layers so ordering stays fast. */
const LAYERS: { name: string; tag: string; cats: string[] }[] = [
  { name: "Featured", tag: "Start here — only at HimBean",
    cats: ["Signature Collection", "Iced Signatures"] },
  { name: "Popular", tag: "What regulars order",
    cats: ["Espresso Classics", "Cold Brew & Nitro", "Matcha & Tea Lattes"] },
  { name: "Explore", tag: "For the curious — discover over time",
    cats: ["Pour Over & Filter", "Chocolate & Mocha", "Tea Collection", "Refreshers",
           "Milk & Wellness", "Frappé Collection", "Limited Reserve", "Bakery", "Retail Coffee"] },
];

const DIET_FILTERS = ["vegan", "vegetarian", "gluten-free", "dairy-free"] as const;

export function MenuExplorer({ categories }: { categories: Category[] }) {
  const add = useCart((s) => s.add);
  const openDrawer = useCart((s) => s.setDrawer);
  const [search, setSearch] = useState("");
  const [diets, setDiets] = useState<string[]>([]);
  const [layer, setLayer] = useState(0);
  const [detail, setDetail] = useState<DetailProduct | null>(null);

  const layered = useMemo(() => {
    // Searching cuts across every layer — layers organize browsing, never hide results
    if (search.trim()) return categories;
    const names = LAYERS[layer].cats;
    const inLayer = categories.filter((c) => names.includes(c.name));
    return inLayer.length > 0 ? inLayer : categories; // legacy category names fall through
  }, [categories, layer, search]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return layered
      .map((c) => ({
        ...c,
        products: c.products.filter((p) => {
          const matchesSearch =
            !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
          const matchesDiet = diets.every((d) => p.dietTags.includes(d));
          return matchesSearch && matchesDiet;
        }),
      }))
      .filter((c) => c.products.length > 0);
  }, [layered, search, diets]);

  function toggleDiet(d: string) {
    setDiets((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  return (
    <div className="mt-8">
      {/* Layer selector — Featured / Popular / Explore */}
      <div className="flex flex-wrap items-baseline gap-2" role="tablist" aria-label="Menu layers">
        {LAYERS.map((l, i) => (
          <button
            key={l.name}
            role="tab"
            aria-selected={i === layer && !search.trim()}
            onClick={() => { setLayer(i); setSearch(""); }}
            className={`rounded-full px-5 py-2.5 font-button text-sm transition-colors ${
              i === layer && !search.trim()
                ? "bg-alpine text-himwhite"
                : "border hover:bg-coffee/5 dark:hover:bg-himwhite/10"
            }`}
            style={i === layer && !search.trim() ? undefined : { borderColor: "var(--line)" }}
          >
            {l.name}
          </button>
        ))}
        <span className="ml-2 font-button text-[11px] uppercase tracking-[0.2em] opacity-45">
          {search.trim() ? "Searching the whole menu" : LAYERS[layer].tag}
        </span>
      </div>

      {/* Sticky section jump — scanning layer */}
      <nav
        aria-label="Menu sections"
        className="sticky top-16 z-30 flex flex-wrap gap-2 border-b bg-[var(--bg)]/90 py-3 backdrop-blur"
        style={{ borderColor: "var(--line)" }}
      >
        {categories.map((c) => (
          <a
            key={c.id}
            href={`#cat-${c.id}`}
            className="rounded-full px-4 py-2 font-button text-sm transition-colors hover:bg-coffee/10 dark:hover:bg-himwhite/10"
          >
            {SECTION_ICONS[c.name] ?? ""} {c.name}
          </a>
        ))}
        <div className="ml-auto">
          <label htmlFor="menu-search" className="sr-only">Search the menu</label>
          <input
            id="menu-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-40 rounded-full border bg-[var(--card)] px-4 py-2 text-sm sm:w-56"
            style={{ borderColor: "var(--line)" }}
          />
        </div>
      </nav>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Diet filters">
        {DIET_FILTERS.map((d) => (
          <button
            key={d}
            onClick={() => toggleDiet(d)}
            aria-pressed={diets.includes(d)}
            className={`rounded-full px-4 py-1.5 font-button text-xs capitalize transition-colors ${
              diets.includes(d)
                ? "bg-alpine text-himwhite"
                : "bg-coffee/5 hover:bg-coffee/10 dark:bg-himwhite/10 dark:hover:bg-himwhite/15"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="card mt-14 p-12 text-center">
          <p className="font-display text-xl">Nothing matches those filters</p>
          <p className="mt-2 text-sm opacity-70">Try clearing the search or a diet filter.</p>
          <button onClick={() => { setSearch(""); setDiets([]); }} className="btn-green mt-6">
            Clear all filters
          </button>
        </div>
      ) : (
        visible.map((c) => (
          <section key={c.id} id={`cat-${c.id}`} className="mt-12 scroll-mt-36" aria-labelledby={`h-${c.id}`}>
            <h2 id={`h-${c.id}`} className="text-3xl">
              {SECTION_ICONS[c.name] ?? ""} {c.name}
            </h2>
            {CATEGORY_PHOTOS[c.name] && (
              // Full image always visible — no fixed-height crop, so drink names baked
              // into the photography (e.g. the iced lineup, the flagship trio) are never cut off.
              <Image src={CATEGORY_PHOTOS[c.name]} alt={`${c.name} at HimBean`}
                width={1000} height={671} className="mt-4 h-auto w-full rounded-2xl object-contain"
                sizes="(max-width: 768px) 100vw, 700px" />
            )}
            <div className="card mt-4 divide-y px-7 py-1" style={{ borderColor: "var(--line)" }}>
              {c.products.map((p) => (
                <article
                  key={p.id}
                  id={p.slug}
                  className="group grid grid-cols-[1fr_auto] items-baseline gap-x-5 py-5"
                  style={{ borderColor: "var(--line)" }}
                >
                  {/* Row 1 — name (+ badge / nudge) and dominant price */}
                  <h3 className="flex flex-wrap items-baseline gap-2.5 font-display text-xl font-semibold">
                    {p.name}
                    {p.badge && BADGES[p.badge] && (
                      <span className={BADGES[p.badge].className}>{BADGES[p.badge].label}</span>
                    )}
                    {p.nudge && (
                      <span className="font-body text-sm font-normal italic opacity-50">({p.nudge})</span>
                    )}
                  </h3>
                  <span className="font-button text-lg font-semibold">{p.price.toFixed(2)}</span>

                  {/* Row 2 — one-line description */}
                  <p className="max-w-[52ch] text-sm opacity-60">{p.description}</p>

                  {/* Quick add — appears on hover/focus, always visible on touch */}
                  <button
                    onClick={(e) => { e.stopPropagation(); add({ productId: p.id, name: p.name, price: p.price }); }}
                    onDoubleClick={() => openDrawer(true)}
                    className="row-span-2 self-center justify-self-end rounded-full border px-4 py-1.5 font-button text-xs opacity-100 transition-all hover:border-alpine hover:bg-alpine hover:text-himwhite sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                    style={{ borderColor: "var(--line)" }}
                    aria-label={`Add ${p.name} to order`}
                  >
                    Add +
                  </button>

                  {/* Row 3 — secondary metadata */}
                  <p className="font-button text-[11px] uppercase tracking-wider opacity-40">
                    {p.calories != null && `${p.calories} cal`}
                    {p.allergens.length > 0 && ` · ${p.allergens.join(" · ")}`}
                    {p.dietTags.includes("vegan") && " · 🌱 vegan"}
                    {p.dietTags.includes("dairy-free") && " · 🥛 dairy free"}
                  </p>

                  {/* Conversion: pairing suggestion */}
                  {p.pairsWith && (
                    <p className="text-xs text-alpine dark:text-[#8fc79f]">Pairs with the {p.pairsWith}</p>
                  )}

                  {/* Coffee education — origin coffees only */}
                  {p.origin && (
                    <details className="col-span-2 mt-2">
                      <summary className="cursor-pointer font-button text-xs text-gold">
                        Read the origin story
                      </summary>
                      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl bg-[var(--bg)] p-5 sm:grid-cols-3 lg:grid-cols-6">
                        {[
                          ["Origin", p.origin], ["Region", p.region],
                          ["Altitude", p.altitudeM ? `${p.altitudeM.toLocaleString()} m` : null],
                          ["Process", p.process], ["Variety", p.variety], ["Roast", p.roastLevel],
                        ].map(([k, v]) => v && (
                          <div key={k as string}>
                            <dt className="font-button text-[10px] uppercase tracking-[0.2em] opacity-50">{k}</dt>
                            <dd className="mt-0.5 text-sm font-medium">{v}</dd>
                          </div>
                        ))}
                        {p.flavorNotes.length > 0 && (
                          <div className="col-span-full">
                            <dt className="font-button text-[10px] uppercase tracking-[0.2em] opacity-50">Flavor notes</dt>
                            <dd className="mt-1.5 flex flex-wrap gap-1.5">
                              {p.flavorNotes.map((n) => (
                                <span key={n} className="rounded-full border px-2.5 py-0.5 text-xs" style={{ borderColor: "var(--line)" }}>{n}</span>
                              ))}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </details>
                  )}
                </article>
              ))}
            </div>
          </section>
        ))
      )}
      {detail && <ProductDetail product={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
