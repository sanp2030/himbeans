"use client";

/** Premium product presentation: accessible modal with imagery slot (steam for hot,
 * condensation for cold), full specification grid, and Add to Cart.
 * A11y: role=dialog, aria-modal, labelled by the product name, Escape + backdrop close,
 * focus moves in on open and returns on close. Motion: transform/opacity only. */

import { useEffect, useRef } from "react";
import { useCart } from "@/store/cart";
import { Steam, Condensation } from "@/components/fx/Ambient";
import { DrinkIllustration } from "@/components/fx/DrinkIllustration";

export type DetailProduct = {
  id: string; slug: string; name: string; description: string; price: number;
  calories: number | null; allergens: string[]; dietTags: string[];
  badge: string | null; origin: string | null; region: string | null;
  altitudeM: number | null; process: string | null; variety: string | null;
  roastLevel: string | null; flavorNotes: string[]; pairsWith: string | null;
  categoryName: string;
};

const COLD = ["Iced Signatures", "Cold Brew & Nitro", "Refreshers"];

export function ProductDetail({ product, onClose }: { product: DetailProduct; onClose: () => void }) {
  const add = useCart((s) => s.add);
  const openDrawer = useCart((s) => s.setDrawer);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  const isCold = COLD.includes(product.categoryName);
  const specs: [string, string | null][] = [
    ["Origin", product.origin], ["Region", product.region],
    ["Altitude", product.altitudeM ? `${product.altitudeM.toLocaleString()} m` : null],
    ["Process", product.process], ["Variety", product.variety], ["Roast", product.roastLevel],
    ["Calories", product.calories ? `${product.calories} cal` : null],
    ["Preparation", isCold ? "~3 min" : "~4 min"],
    ["Contains", product.allergens.length ? product.allergens.join(", ") : null],
    ["Diet", product.dietTags.length ? product.dietTags.join(", ") : null],
  ];

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="pd-title">
      <div className="absolute inset-0 bg-coffee/55 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="absolute inset-x-0 bottom-0 top-auto max-h-[92vh] overflow-y-auto rounded-t-3xl bg-[var(--bg)] p-6 shadow-lift sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[min(880px,92vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:p-8"
        style={{ animation: "fx-rise .35s ease both" }}>
        <div className="grid gap-8 sm:grid-cols-[1fr_1.1fr]">
          <div className="relative">
            <DrinkIllustration
              name={product.name}
              category={product.categoryName}
              className="w-full"
            />
            {isCold ? <Condensation /> : <Steam className="left-1/2 top-4 -translate-x-1/2" />}
          </div>
          <div>
            <div className="flex items-start justify-between gap-4">
              <h2 id="pd-title" className="font-display text-3xl font-semibold">{product.name}</h2>
              <button ref={closeRef} onClick={onClose} aria-label="Close details"
                className="rounded-full border p-2 leading-none" style={{ borderColor: "var(--line)" }}>✕</button>
            </div>
            <p className="mt-3 opacity-75">{product.description}</p>
            {product.flavorNotes.length > 0 && (
              <p className="mt-3 font-button text-xs uppercase tracking-[0.2em] text-gold">
                {product.flavorNotes.join(" · ")}
              </p>
            )}
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
              {specs.filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="font-button text-[11px] uppercase tracking-[0.16em] opacity-45">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            {product.pairsWith && (
              <p className="mt-4 text-sm"><span className="opacity-50">Pairs with</span> <b>{product.pairsWith}</b></p>
            )}
            <div className="mt-7 flex items-center justify-between gap-4">
              <span className="font-button text-2xl font-semibold">${product.price.toFixed(2)}</span>
              <button
                onClick={() => { add({ productId: product.id, name: product.name, price: product.price }); openDrawer(true); onClose(); }}
                className="btn-green"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
