import { describe, it, expect } from "vitest";
import { canTransition, canRefund, customerStepIndex } from "@/lib/order-status";

describe("order lifecycle — full pipeline", () => {
  it("allows the default POS path (optional gates skipped)", () => {
    expect(canTransition("PENDING", "PREPARING")).toBe(true); // counter order
    expect(canTransition("PAID", "PREPARING")).toBe(true);
    expect(canTransition("PREPARING", "READY")).toBe(true);
    expect(canTransition("READY", "COMPLETED")).toBe(true);
  });
  it("allows the full path through optional gates", () => {
    expect(canTransition("PAID", "ACCEPTED")).toBe(true);
    expect(canTransition("ACCEPTED", "PREPARING")).toBe(true);
    expect(canTransition("PREPARING", "QUALITY_CHECK")).toBe(true);
    expect(canTransition("QUALITY_CHECK", "READY")).toBe(true);
  });
  it("supports cancellation before preparation and refund after payment", () => {
    expect(canTransition("PENDING", "CANCELLED")).toBe(true);
    expect(canTransition("PAID", "CANCELLED")).toBe(true);
    expect(canTransition("PAID", "REFUNDED")).toBe(true);
    expect(canTransition("COMPLETED", "REFUNDED")).toBe(true);
  });
  it("blocks reversals, skips past gates backward, and terminal changes", () => {
    expect(canTransition("READY", "PREPARING")).toBe(false);
    expect(canTransition("PREPARING", "PAID")).toBe(false);
    expect(canTransition("CANCELLED", "PREPARING")).toBe(false);
    expect(canTransition("REFUNDED", "COMPLETED")).toBe(false);
    expect(canTransition("PENDING", "READY")).toBe(false);
    expect(canTransition("PENDING", "COMPLETED")).toBe(false);
  });
});

describe("refund eligibility", () => {
  it("permits refunds only after payment", () => {
    for (const ok of ["PAID", "ACCEPTED", "PREPARING", "QUALITY_CHECK", "READY", "COMPLETED"]) {
      expect(canRefund(ok)).toBe(true);
    }
    for (const no of ["PENDING", "CANCELLED", "REFUNDED", "garbage"]) {
      expect(canRefund(no)).toBe(false);
    }
  });
});

describe("customer-facing step mapping", () => {
  it("maps the full backend lifecycle onto five steps", () => {
    expect(customerStepIndex("PENDING")).toBe(0);
    expect(customerStepIndex("PAID")).toBe(1);
    expect(customerStepIndex("ACCEPTED")).toBe(1);
    expect(customerStepIndex("PREPARING")).toBe(2);
    expect(customerStepIndex("QUALITY_CHECK")).toBe(2);
    expect(customerStepIndex("READY")).toBe(3);
    expect(customerStepIndex("COMPLETED")).toBe(4);
  });
  it("returns -1 for terminal branches", () => {
    expect(customerStepIndex("CANCELLED")).toBe(-1);
    expect(customerStepIndex("REFUNDED")).toBe(-1);
  });
});
