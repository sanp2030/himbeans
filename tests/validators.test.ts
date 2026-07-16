import { describe, it, expect } from "vitest";
import { createOrderSchema, reservationSchema, newsletterSchema } from "@/lib/validators";

describe("order validation", () => {
  const valid = {
    locationId: "loc_1",
    fulfilment: "PICKUP",
    items: [{ productId: "p1", quantity: 2 }],
  };

  it("accepts a minimal valid order", () => {
    expect(createOrderSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects empty carts and absurd quantities", () => {
    expect(createOrderSchema.safeParse({ ...valid, items: [] }).success).toBe(false);
    expect(createOrderSchema.safeParse({ ...valid, items: [{ productId: "p1", quantity: 999 }] }).success).toBe(false);
  });
  it("rejects unknown fulfilment types", () => {
    expect(createOrderSchema.safeParse({ ...valid, fulfilment: "DRONE" }).success).toBe(false);
  });
});

describe("reservation validation", () => {
  it("rejects reservations in the past", () => {
    const r = reservationSchema.safeParse({
      locationId: "loc_1", name: "Priya", email: "p@example.com",
      date: new Date(Date.now() - 86_400_000).toISOString(), guests: 2,
    });
    expect(r.success).toBe(false);
  });
});

describe("newsletter validation", () => {
  it("rejects malformed emails", () => {
    expect(newsletterSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
    expect(newsletterSchema.safeParse({ email: "a@b.co" }).success).toBe(true);
  });
});
