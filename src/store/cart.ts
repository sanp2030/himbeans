"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CartItem, addItem, setQuantity, cartCount, cartSubtotal, lineKey } from "@/lib/cart-math";

type CartState = {
  items: CartItem[];
  drawerOpen: boolean;
  add: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  setDrawer: (open: boolean) => void;
  count: () => number;
  subtotal: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      drawerOpen: false,
      add: (item) =>
        set((s) => ({ items: addItem(s.items, { ...item, quantity: item.quantity ?? 1 }) })),
      setQty: (key, qty) => set((s) => ({ items: setQuantity(s.items, key, qty) })),
      remove: (key) => set((s) => ({ items: setQuantity(s.items, key, 0) })),
      clear: () => set({ items: [] }),
      setDrawer: (open) => set({ drawerOpen: open }),
      count: () => cartCount(get().items),
      subtotal: () => cartSubtotal(get().items),
    }),
    {
      name: "himbean-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
    },
  ),
);

export { lineKey };
