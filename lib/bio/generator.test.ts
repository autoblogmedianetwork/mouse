import { describe, expect, it } from "vitest";
import { escapeHtml, susunHalamanBio, MAKS_LINK_BIO, type MasukanBio } from "./generator";

const masukanDasar: MasukanBio = {
  nama: "Pak Slem",
  tagline: "Review jujur barang dapur",
  produk: [
    { nama: "Rice Cooker Miyako", harga: "Rp 189.000", url: "https://s.shopee.co.id/abc" },
    { nama: "Kopi Gayo 250g", url: "https://s.shopee.co.id/def" },
  ],
};

describe("susunHalamanBio", () => {
  it("menyusun HTML mandiri dengan semua link", () => {
    const hasil = susunHalamanBio(masukanDasar);
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.jumlahLink).toBe(2);
    expect(hasil.html).toContain("<!DOCTYPE html>");
    expect(hasil.html).toContain("Pak Slem");
    expect(hasil.html).toContain("https://s.shopee.co.id/abc");
    expect(hasil.html).toContain("Rp 189.000");
    // disclosure affiliate bawaan
    expect(hasil.html).toContain("affiliate");
    // tanpa JS eksternal dan tanpa font eksternal
    expect(hasil.html).not.toContain("<script");
    expect(hasil.html).not.toContain("fonts.googleapis");
  });

  it("melewati produk tanpa URL valid", () => {
    const hasil = susunHalamanBio({
      ...masukanDasar,
      produk: [
        { nama: "Tanpa link" },
        { nama: "Link javascript", url: "javascript:alert(1)" },
        { nama: "Valid", url: "https://s.shopee.co.id/xyz" },
      ],
    });
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.jumlahLink).toBe(1);
    expect(hasil.html).not.toContain("javascript:");
    expect(hasil.html).not.toContain("Tanpa link");
  });

  it("menolak nama kosong dan daftar tanpa link", () => {
    const tanpaNama = susunHalamanBio({ ...masukanDasar, nama: "  " });
    expect(tanpaNama.ok).toBe(false);

    const tanpaLink = susunHalamanBio({ ...masukanDasar, produk: [{ nama: "A" }] });
    expect(tanpaLink.ok).toBe(false);
  });

  it("memotong ke batas 20 link", () => {
    const banyak = Array.from({ length: 25 }, (_, i) => ({
      nama: `Produk ${i + 1}`,
      url: `https://s.shopee.co.id/p${i + 1}`,
    }));
    const hasil = susunHalamanBio({ ...masukanDasar, produk: banyak });
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.jumlahLink).toBe(MAKS_LINK_BIO);
  });

  it("escapeHtml melumpuhkan tag berbahaya", () => {
    expect(escapeHtml("<script>alert(1)</script>")).not.toContain("<script>");
    expect(escapeHtml('" onmouseover="x')).toContain("&quot;");
  });

  it("XSS lewat nama produk tidak lolos ke HTML", () => {
    const hasil = susunHalamanBio({
      ...masukanDasar,
      produk: [{ nama: '<img src=x onerror=alert(1)>', url: "https://s.shopee.co.id/xss" }],
    });
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.html).not.toContain("<img src=x");
    expect(hasil.html).toContain("&lt;img");
  });
});
