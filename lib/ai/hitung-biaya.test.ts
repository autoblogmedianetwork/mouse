import { describe, expect, it } from "vitest";
import { hitungBiayaUsd, parseTarifPerMtok } from "./catat-generation";
import type { UsageAI } from "./generate-json";

const USAGE: UsageAI = { promptTokens: 1_000_000, completionTokens: 500_000, totalTokens: 1_500_000 };

describe("parseTarifPerMtok", () => {
  it("angka valid diterima", () => {
    expect(parseTarifPerMtok("0.10")).toBe(0.1);
    expect(parseTarifPerMtok("0")).toBe(0);
  });

  it("kosong/rusak/negatif jatuh ke 0 (gratis)", () => {
    expect(parseTarifPerMtok(undefined)).toBe(0);
    expect(parseTarifPerMtok("")).toBe(0);
    expect(parseTarifPerMtok("abc")).toBe(0);
    expect(parseTarifPerMtok("-1")).toBe(0);
  });
});

describe("hitungBiayaUsd", () => {
  it("tanpa tarif sama sekali -> null (biaya_usd null, bukan 0 palsu)", () => {
    expect(hitungBiayaUsd(USAGE, undefined, undefined)).toBeNull();
    expect(hitungBiayaUsd(USAGE, "", "0")).toBeNull();
  });

  it("tanpa usage -> null", () => {
    expect(hitungBiayaUsd(undefined, "0.1", "0.4")).toBeNull();
  });

  it("tarif lengkap: per 1 juta token", () => {
    expect(hitungBiayaUsd(USAGE, "0.10", "0.40")).toBeCloseTo(0.3);
  });

  it("tarif parsial: sisi yang tidak diset dihitung 0", () => {
    expect(hitungBiayaUsd(USAGE, "0.10", undefined)).toBeCloseTo(0.1);
    expect(hitungBiayaUsd(USAGE, undefined, "0.40")).toBeCloseTo(0.2);
  });
});
