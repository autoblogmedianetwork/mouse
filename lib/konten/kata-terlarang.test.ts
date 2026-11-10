import { describe, expect, it } from "vitest";
import { periksaKataTerlarang } from "./kata-terlarang";

describe("periksaKataTerlarang", () => {
  it("lolos untuk teks yang wajar dan aman", () => {
    const hasil = periksaKataTerlarang("Kaos ini bahannya adem dan nyaman dipakai harian.");
    expect(hasil.ditemukan).toBe(false);
    expect(hasil.temuan).toHaveLength(0);
  });

  it("mendeteksi klaim berlebihan seperti 'terbaik' dan '100%'", () => {
    const hasil = periksaKataTerlarang("Ini adalah produk terbaik yang 100% ampuh.");
    expect(hasil.ditemukan).toBe(true);
    const kata = hasil.temuan.map((t) => t.rule.kata);
    expect(kata).toContain("terbaik");
    expect(kata).toContain("100%");
  });

  it("mendeteksi pelanggaran platform seperti 'klik keranjang kuning'", () => {
    const hasil = periksaKataTerlarang(["Langsung klik keranjang kuning ya guys", "Link di bio"]);
    expect(hasil.ditemukan).toBe(true);
    const kata = hasil.temuan.map((t) => t.rule.kata);
    expect(kata).toContain("klik keranjang kuning");
  });

  it("aman terhadap input kosong", () => {
    expect(periksaKataTerlarang("").ditemukan).toBe(false);
    expect(periksaKataTerlarang([]).ditemukan).toBe(false);
  });
});
