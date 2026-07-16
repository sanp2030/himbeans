import { describe, it, expect } from "vitest";
import { TIERS, tierFor, nextTier, tierRange, metersForOrder, EARN_RATE } from "@/lib/loyalty";

describe("Altitude Perks — earning", () => {
  it("earns 10 vertical meters per dollar", () => {
    expect(metersForOrder(6.25)).toBe(Math.round(6.25 * EARN_RATE));
    expect(metersForOrder(0)).toBe(0);
  });
  it("never awards negative meters", () => {
    expect(metersForOrder(-5)).toBe(0);
  });
});

describe("Altitude Perks — tiers", () => {
  it("assigns tiers at exact boundaries", () => {
    expect(tierFor(0).name).toBe("Base Camp");
    expect(tierFor(999).name).toBe("Base Camp");
    expect(tierFor(1_000).name).toBe("Langtang");
    expect(tierFor(2_999).name).toBe("Langtang");
    expect(tierFor(3_000).name).toBe("Annapurna");
    expect(tierFor(8_847).name).toBe("Annapurna");
    expect(tierFor(8_848).name).toBe("Everest"); // the summit
    expect(tierFor(50_000).name).toBe("Everest");
  });

  it("reports the next tier and meters to go", () => {
    expect(nextTier(500)?.name).toBe("Langtang");
    expect(nextTier(3_000)?.name).toBe("Everest");
    expect(nextTier(9_000)).toBeNull();
  });

  it("renders human-readable ranges", () => {
    expect(tierRange(TIERS[0])).toBe("0–999 m");
    expect(tierRange(TIERS[1])).toBe("1,000–2,999 m");
    expect(tierRange(TIERS[2])).toBe("3,000–8,847 m");
    expect(tierRange(TIERS[3])).toBe("8,848 m+");
  });
});
