import { describe, expect, it } from "vitest";
import { estimateIklan } from "./iklan-calculator";

describe("estimateIklan", () => {
  it("diganti konsisten output untuk contoh sederhana", () => {
    const res = estimateIklan({
      commission: 5, // 5%
      cpc: 2000,    // Rp2k per click
      budget: 200_000, // 200k per day
    });
    // cost per sale = 2000/(5/100)=40k
    // sales needed = ceiling(200k/40k)=5
    // clicks needed=5* (40k/2000)=5*20=100
    expect(res.salesNeeded).toBe(5);
    expect(res.costPerSale).toBeCloseTo(40_000);
    expect(res.clicksNeeded).toBe(100);
  });
});
