import { describe, expect, it } from "vitest";
import { hitungKomisiTarget } from "./kalkulator-komisi";

describe("hitungKomisiTarget", () => {
  it("menghitung komisi per penjualan dan kebutuhan pesanan dengan benar", () => {
    const hasil = hitungKomisiTarget({
      hargaProduk: 100_000,
      persenKomisi: 10,
      targetBulanan: 1_000_000,
    });

    expect(hasil.komisiPerPenjualan).toBe(10_000);
    expect(hasil.penjualanDibutuhkan).toBe(100);
    expect(hasil.estimasiOmset).toBe(10_000_000);
  });

  it("menangani pembagian nol atau nilai input negatif/kosong secara aman", () => {
    const hasil = hitungKomisiTarget({
      hargaProduk: 0,
      persenKomisi: 0,
      targetBulanan: 1_000_000,
    });

    expect(hasil.komisiPerPenjualan).toBe(0);
    expect(hasil.penjualanDibutuhkan).toBe(0);
    expect(hasil.estimasiOmset).toBe(0);
  });

  it("membulatkan ke atas untuk jumlah pesanan target", () => {
    const hasil = hitungKomisiTarget({
      hargaProduk: 75_000,
      persenKomisi: 5, // komisi = 3.750
      targetBulanan: 100_000, // butuh 100.000 / 3.750 = 26.666 -> 27 pesanan
    });

    expect(hasil.komisiPerPenjualan).toBe(3750);
    expect(hasil.penjualanDibutuhkan).toBe(27);
  });
});
