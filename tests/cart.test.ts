import { describe, it, expect } from "vitest";
import { addItem, setQuantity, cartCount, cartSubtotal, lineKey, type CartItem } from "@/lib/cart-math";

const latte: CartItem = { productId: "p1", name: "Summit Latte", price: 6.25, quantity: 1 };
const black: CartItem = { productId: "p2", name: "Himalayan Black", price: 4.75, quantity: 2 };

describe("cart math", () => {
  it("merges identical line items instead of duplicating", () => {
    let items = addItem([], latte);
    items = addItem(items, latte);
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it("treats different customizations as separate lines", () => {
    let items = addItem([], latte);
    items = addItem(items, { ...latte, customization: { Milk: "Oat" } });
    expect(items).toHaveLength(2);
  });

  it("computes counts and money-safe subtotals", () => {
    const items = addItem(addItem([], latte), black);
    expect(cartCount(items)).toBe(3);
    expect(cartSubtotal(items)).toBe(+(6.25 + 4.75 * 2).toFixed(2));
  });

  it("removes a line when quantity drops to zero", () => {
    let items = addItem([], latte);
    items = setQuantity(items, lineKey("p1"), 0);
    expect(items).toHaveLength(0);
  });

  it("caps quantity at 50 (matches server-side validator)", () => {
    let items = addItem([], { ...latte, quantity: 49 });
    items = addItem(items, { ...latte, quantity: 10 });
    expect(items[0].quantity).toBe(50);
    expect(setQuantity(items, lineKey("p1"), 99)[0].quantity).toBe(50);
  });
});
