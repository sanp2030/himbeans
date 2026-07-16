import { describe, it, expect } from "vitest";
import { generatePickupCode, isValidPickupCode, PICKUP_ALPHABET } from "@/lib/pickup";

describe("QR pickup codes", () => {
  it("always matches HB-XXXXXX with the safe alphabet", () => {
    for (let i = 0; i < 500; i++) {
      const code = generatePickupCode();
      expect(isValidPickupCode(code)).toBe(true);
    }
  });
  it("never contains ambiguous characters", () => {
    expect(PICKUP_ALPHABET).not.toMatch(/[0O1IL]/);
    for (let i = 0; i < 500; i++) {
      expect(generatePickupCode()).not.toMatch(/[0O1IL]/);
    }
  });
  it("rejects malformed codes", () => {
    for (const bad of ["HB-000000", "HB-ABCDE", "XX-ABCDEF", "hb-abcdef", "HB-ABCDEFG"]) {
      expect(isValidPickupCode(bad)).toBe(false);
    }
  });
});
