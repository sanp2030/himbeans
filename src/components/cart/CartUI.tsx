"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart, lineKey } from "@/store/cart";

export function CartUI() {
  const { items, drawerOpen, setDrawer, setQty, remove, count, subtotal } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []); // avoid hydration mismatch with persisted cart

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  if (!mounted || items.length === 0) return null;

  return (
    <>
      {/* Floating bar — hidden when empty */}
      {!drawerOpen && (
        <button
          onClick={() => setDrawer(true)}
          className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center justify-between rounded-full bg-alpine px-6 py-4 font-button text-sm text-himwhite shadow-lift transition-transform hover:-translate-y-0.5"
          aria-label={`View cart, ${count()} items, $${subtotal().toFixed(2)}`}
        >
          <span>{count()} {count() === 1 ? "item" : "items"} · ${subtotal().toFixed(2)}</span>
          <span className="font-semibold">View Cart →</span>
        </button>
      )}

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Your order">
          <div className="absolute inset-0 bg-coffee/50 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <div className="absolute bottom-0 right-0 top-0 flex w-full max-w-md flex-col bg-[var(--bg)] shadow-lift sm:rounded-l-2xl">
            <div className="flex items-center justify-between border-b p-5" style={{ borderColor: "var(--line)" }}>
              <h2 className="font-display text-2xl font-semibold">Your order</h2>
              <button onClick={() => setDrawer(false)} aria-label="Close cart"
                className="rounded-full border p-2 leading-none" style={{ borderColor: "var(--line)" }}>✕</button>
            </div>

            <ul className="flex-1 divide-y overflow-y-auto px-5" style={{ borderColor: "var(--line)" }}>
              {items.map((i) => {
                const key = lineKey(i.productId, i.customization);
                return (
                  <li key={key} className="flex items-center gap-4 py-4">
                    <div className="flex-1">
                      <p className="font-display text-lg font-semibold">{i.name}</p>
                      <p className="font-button text-sm opacity-60">${i.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2" aria-label={`Quantity for ${i.name}`}>
                      <button onClick={() => setQty(key, i.quantity - 1)} aria-label={`Decrease ${i.name}`}
                        className="h-9 w-9 rounded-full border font-button" style={{ borderColor: "var(--line)" }}>−</button>
                      <span className="w-6 text-center font-button">{i.quantity}</span>
                      <button onClick={() => setQty(key, i.quantity + 1)} aria-label={`Increase ${i.name}`}
                        className="h-9 w-9 rounded-full border font-button" style={{ borderColor: "var(--line)" }}>+</button>
                    </div>
                    <button onClick={() => remove(key)} aria-label={`Remove ${i.name}`}
                      className="font-button text-xs opacity-40 hover:opacity-100">Remove</button>
                  </li>
                );
              })}
            </ul>

            <div className="border-t p-5" style={{ borderColor: "var(--line)" }}>
              <div className="flex justify-between font-button">
                <span className="opacity-60">Subtotal</span>
                <span className="text-lg font-semibold">${subtotal().toFixed(2)}</span>
              </div>
              <p className="mt-1 text-xs opacity-45">Tax calculated at checkout · Pickup in 7–12 min</p>
              <Link href="/checkout" onClick={() => setDrawer(false)} className="btn-green mt-4 w-full">
                Checkout
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
