import { describe, it, expect } from "vitest";
import { orderConfirmationHtml, receiptHtml } from "@/lib/email";

describe("transactional email templates", () => {
  it("confirmation includes order number, pickup code, items, total, tracking link", () => {
    const html = orderConfirmationHtml({
      number: 1042, pickupCode: "HB-4F7K2M", etaMinutes: 14, total: 13.61,
      items: [{ quantity: 2, name: "Summit Latte" }],
      trackingUrl: "https://himbean.coffee/order/abc",
    });
    for (const needle of ["#1042", "HB-4F7K2M", "2× Summit Latte", "$13.61", "/order/abc", "14 minutes"]) {
      expect(html).toContain(needle);
    }
  });
  it("receipt includes tax breakdown and totals", () => {
    const html = receiptHtml({ number: 7, total: 11.3, subtotal: 10, tax: 1.3, provider: "card / wallet" });
    for (const needle of ["#7", "$10.00", "$1.30", "$11.30", "Tax (13%)"]) {
      expect(html).toContain(needle);
    }
  });
});
