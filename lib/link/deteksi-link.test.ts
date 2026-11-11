import { describe, expect, it } from "vitest";
import { deteksiLinkAfiliasi } from "./deteksi-link";

describe("detektor link afiliasi (power-up Aset)", () => {
  it("link kosong atau rusak -> pesan jelas", () => {
    expect(deteksiLinkAfiliasi("").ok).toBe(false);
    expect(deteksiLinkAfiliasi("").masalah[0]).toContain("kosong");
    expect(deteksiLinkAfiliasi("bukan url").ok).toBe(false);
    expect(deteksiLinkAfiliasi("bukan url").masalah[0]).toContain("tidak valid");
  });

  it("link shopee dengan sub_id -> sehat, marketplace terbaca", () => {
    const hasil = deteksiLinkAfiliasi(
      "https://s.shopee.co.id/xYz?sub_id=konten123&utm=wa",
    );
    expect(hasil.ok).toBe(true);
    expect(hasil.marketplace).toBe("shopee");
    expect(hasil.labelMarketplace).toBe("Shopee");
    expect(hasil.tracking).toContain("sub_id");
    expect(hasil.masalah).toHaveLength(0);
  });

  it("http tanpa tracking -> dua peringatan", () => {
    const hasil = deteksiLinkAfiliasi("http://tokopedia.com/toko/barang");
    expect(hasil.ok).toBe(false);
    expect(hasil.marketplace).toBe("tokopedia");
    expect(hasil.masalah.some((m) => m.includes("https"))).toBe(true);
    expect(hasil.masalah.some((m) => m.includes("tracking"))).toBe(true);
  });

  it("https tanpa tracking -> peringatan tracking saja", () => {
    const hasil = deteksiLinkAfiliasi("https://www.tiktok.com/@toko/video/123");
    expect(hasil.ok).toBe(false);
    expect(hasil.masalah).toHaveLength(1);
    expect(hasil.masalah[0]).toContain("tracking");
  });
});
