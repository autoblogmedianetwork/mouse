import { describe, expect, it } from "vitest";
import { periksaKepatuhan } from "./periksa";

describe("periksaKepatuhan", () => {
  it("teks kosong tidak lulus dan menyuruh menulis", () => {
    const hasil = periksaKepatuhan("  ");
    expect(hasil.lulus).toBe(false);
    expect(hasil.skor).toBe(0);
    expect(hasil.temuan[0].id).toBe("kosong");
  });

  it("menandai sebutan merek marketplace sebagai blokir", () => {
    const hasil = periksaKepatuhan("Beli di Shopee aja, murah. #publi");
    const temuan = hasil.temuan.find((t) => t.id === "merek-marketplace");
    expect(temuan?.tingkat).toBe("blokir");
    expect(hasil.lulus).toBe(false);
  });

  it("menandai tautan yang dipendekkan sebagai blokir", () => {
    const hasil = periksaKepatuhan("Link di bit.ly/abc ya. #publi");
    expect(hasil.temuan.map((t) => t.id)).toContain("tautan-dipendekkan");
    expect(hasil.lulus).toBe(false);
  });

  it("menandai klaim kesehatan sebagai blokir", () => {
    const hasil = periksaKepatuhan("Sabun ini menyembuhkan jerawat dalam 3 hari. #publi");
    expect(hasil.temuan.find((t) => t.id === "klaim-kesehatan")?.tingkat).toBe("blokir");
  });

  it("menandai klaim resmi palsu sebagai blokir", () => {
    const hasil = periksaKepatuhan("Ini official store, garansi resmi shopee. #publi");
    expect(hasil.temuan.map((t) => t.id)).toContain("meniru-identitas");
  });

  it("memberi peringatan kalau tidak ada tanda materi promosi", () => {
    const hasil = periksaKepatuhan("Tumbler 750 ml, tahan 12 jam. Cocok buat yang kerja shift.");
    const temuan = hasil.temuan.find((t) => t.id === "tanpa-disclosure");
    expect(temuan?.tingkat).toBe("peringatan");
    // Tanpa pelanggaran blokir, tetap lulus.
    expect(hasil.lulus).toBe(true);
  });

  it("lulus dan skor tinggi untuk konten yang bersih", () => {
    const hasil = periksaKepatuhan(
      "Aku sendiri pakai tumbler 750 ml ini tiap hari, tahan 12 jam. Sayang kalau dilewat. #publi",
    );
    expect(hasil.lulus).toBe(true);
    expect(hasil.skor).toBe(100);
    expect(hasil.temuan).toHaveLength(0);
  });

  it("aturan kata kunci merek hanya muncul di konteks iklan", () => {
    const teks = "Cari produk ini di Tokopedia. #publi";
    const organik = periksaKepatuhan(teks, { konteks: "organik" });
    const iklan = periksaKepatuhan(teks, { konteks: "iklan" });
    expect(organik.temuan.map((t) => t.id)).toContain("merek-marketplace");
    expect(iklan.temuan.map((t) => t.id)).toContain("kata-kunci-merek");
  });

  it("setiap temuan memuat cuplikan supaya mudah dicari", () => {
    const hasil = periksaKepatuhan("Buruan klik sekarang sebelum kehabisan! #publi");
    const clickbait = hasil.temuan.find((t) => t.id === "clickbait");
    expect(clickbait?.cuplikan.length).toBeGreaterThan(0);
  });

  it("temuan blokir selalu diurutkan lebih dulu", () => {
    const hasil = periksaKepatuhan("Sisa 3 lagi! Beli di Shopee. #publi");
    expect(hasil.temuan[0].tingkat).toBe("blokir");
  });

  it("catatan tetap selalu menyebut larangan pemendek tautan dan #publi", () => {
    const hasil = periksaKepatuhan("Apa saja. #publi");
    const gabung = hasil.catatan.join(" ");
    expect(gabung).toContain("Jangan dipendekkan");
    expect(gabung).toContain("#publi");
  });

  it("skor turun sesuai jumlah temuan dan tidak negatif", () => {
    const bersih = periksaKepatuhan("Tumbler 750 ml tahan 12 jam. #publi");
    const kotor = periksaKepatuhan(
      "Sisa 3! Buruan klik sekarang! Kata dokter menyembuhkan! bit.ly/x Beli di Shopee! 100%! #publi",
    );
    expect(kotor.skor).toBeLessThan(bersih.skor);
    expect(kotor.skor).toBeGreaterThanOrEqual(0);
  });
});
