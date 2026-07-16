/** Pure cart calculations — unit-tested in tests/cart.test.ts */
export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  customization?: Record<string, string>;
};

export function cartCount(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.quantity, 0);
}

export function cartSubtotal(items: CartItem[]): number {
  return +items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2);
}

/** Same line item (product + identical customization) merges instead of duplicating. */
export function lineKey(productId: string, customization?: Record<string, string>): string {
  return productId + "|" + JSON.stringify(customization ?? {});
}

export function addItem(items: CartItem[], item: CartItem): CartItem[] {
  const key = lineKey(item.productId, item.customization);
  const existing = items.find((i) => lineKey(i.productId, i.customization) === key);
  if (existing) {
    return items.map((i) =>
      lineKey(i.productId, i.customization) === key
        ? { ...i, quantity: Math.min(50, i.quantity + item.quantity) }
        : i,
    );
  }
  return [...items, { ...item, quantity: Math.min(50, item.quantity) }];
}

export function setQuantity(items: CartItem[], key: string, quantity: number): CartItem[] {
  if (quantity <= 0) return items.filter((i) => lineKey(i.productId, i.customization) !== key);
  return items.map((i) =>
    lineKey(i.productId, i.customization) === key ? { ...i, quantity: Math.min(50, quantity) } : i,
  );
}
