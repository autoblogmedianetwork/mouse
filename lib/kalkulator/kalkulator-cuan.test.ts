import { describe, expect, it } from "vitest";
import {
  estimasiKomisi,
  formatRupiah,
  komisiPerKontenDariData,
  komisiPerUnit,
  kebutuhanUntukTarget,
} from "./kalkulator-cuan";

describe("kalkulator cuan (Gelombang 4)", () => {
  it("komisi per unit dibulatkan ke rupiah", () => {
    expect(komisiPerUnit(150_000, 10)).toBe(15_000);
    expect(komisiPerUnit(99_999, 5)).toBe(5000);
    expect(komisiPerUnit(0, 10)).toBe(0);
  });

  it("estimasi komisi total untuk beberapa penjualan", () => {
    const hasil = estimasiKomisi(200_000, 8, 12);
    expect(hasil.perUnit).toBe(16_000);
    expect(hasil.total).toBe(192_000);
  });

  it("format rupiah gaya Indonesia", () => {
    expect(formatRupiah(120_000)).toContain("120.000");
    expect(formatRupiah(120_000)).toContain("Rp");
  });

  it("kebutuhan target: unit, konten per bulan, dan per hari dibulatkan ke atas", () => {
    // Target 2 juta, komisi 15rb/unit, 1 penjualan per 20 konten.
    const hasil = kebutuhanUntukTarget(2_000_000, 15_000, 0.05);
    expect(hasil).not.toBeNull();
    expect(hasil?.unitPerBulan).toBe(134); // 2.000.000 / 15.000 = 133,3 -> 134
    expect(hasil?.kontenPerBulan).toBe(2667); // 2jt / (15rb*0,05=750) = 2666,7 -> 2667
    expect(hasil?.kontenPerHari).toBe(89); // 2667 / 30 = 88,9 -> 89
  });

  it("input nol atau negatif -> null, bukan angka palsu", () => {
    expect(kebutuhanUntukTarget(0, 15_000, 0.05)).toBeNull();
    expect(kebutuhanUntukTarget(2_000_000, 0, 0.05)).toBeNull();
    expect(kebutuhanUntukTarget(2_000_000, 15_000, 0)).toBeNull();
  });

  it("komisi per konten dari data nyata: butuh minimal 3 konten", () => {
    expect(komisiPerKontenDariData(450_000, 3)).toBe(150_000);
    expect(komisiPerKontenDariData(450_000, 2)).toBeNull();
    expect(komisiPerKontenDariData(0, 10)).toBeNull();
  });
});
