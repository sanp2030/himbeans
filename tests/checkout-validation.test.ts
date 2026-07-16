import { describe, it, expect } from "vitest";
import { createOrderSchema, namePattern, PHONE_COUNTRIES } from "@/lib/validators";

const base = {
  locationId: "loc_1",
  fulfilment: "PICKUP",
  items: [{ productId: "p1", quantity: 1 }],
};

describe("name validation — no random values", () => {
  it("accepts real names incl. unicode", () => {
    for (const n of ["Priya Rai", "José O'Neil", "सिता श्रेष्ठ", "Jean-Luc"]) {
      expect(namePattern.test(n), n).toBe(true);
    }
  });
  it("rejects junk, digits-only, too short, too long", () => {
    for (const n of ["a", "1234567890", "!!!", " ", "x".repeat(81)]) {
      expect(namePattern.test(n), JSON.stringify(n)).toBe(false);
    }
    expect(createOrderSchema.safeParse({ ...base, guestName: "12345" }).success).toBe(false);
  });
});

describe("phone validation — 10 digits by country, E.164 stored", () => {
  it("accepts exactly 10 digits and normalizes with the country code", () => {
    const r = createOrderSchema.safeParse({ ...base, guestPhoneCountry: "NP", guestPhone: "9812345678" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.guestPhone).toBe("+9779812345678");
    const us = createOrderSchema.safeParse({ ...base, guestPhoneCountry: "US", guestPhone: "4155551234" });
    if (us.success) expect(us.data.guestPhone).toBe("+14155551234");
  });
  it("rejects letters, 9 digits, 11 digits", () => {
    for (const ph of ["aaa4444444", "981234567", "98123456789", "98-1234567"]) {
      expect(createOrderSchema.safeParse({ ...base, guestPhone: ph }).success, ph).toBe(false);
    }
  });
  it("supports the three launch countries", () => {
    expect(Object.keys(PHONE_COUNTRIES)).toEqual(["NP", "IN", "US"]);
  });
});

describe("gift card code input", () => {
  it("uppercases and bounds the code", () => {
    const r = createOrderSchema.safeParse({ ...base, giftCardCode: "hb-gift-demo" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.giftCardCode).toBe("HB-GIFT-DEMO");
    expect(createOrderSchema.safeParse({ ...base, giftCardCode: "x".repeat(25) }).success).toBe(false);
  });
});
