import { describe, expect, it } from "vitest";
import { penawaranLinkSkema, penawaranManualSkema } from "./skema";

describe("penawaranManualSkema", () => {
  it("menerima data manual yang valid (Hostinger)", () => {
    const valid = {
      nama: "Hostinger Cloud Startup",
      link_affiliate: "https://hostinger.com?aff=123",
      harga: "Rp 150.000/bln",
      fitur: "300 website, 200 GB NVMe, domain gratis 1 tahun",
      kategori: "hosting" as const,
      gambar: "",
    };
    const res = penawaranManualSkema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it("menolak jika nama penawaran kosong", () => {
    const invalid = {
      nama: "   ",
      link_affiliate: "https://example.com/aff",
      kategori: "saas" as const,
    };
    const res = penawaranManualSkema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it("menolak jika link affiliate tidak diawali http:// atau https://", () => {
    const invalid = {
      nama: "SaaS Pro",
      link_affiliate: "contoh.com/aff",
      kategori: "saas" as const,
    };
    const res = penawaranManualSkema.safeParse(invalid);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toContain("URL valid diawali http:// atau https://");
    }
  });

  it("mengizinkan harga dan fitur opsional", () => {
    const data = {
      nama: "Kursus SEO Gratis",
      link_affiliate: "https://kursus.com/ref",
      kategori: "course" as const,
    };
    const res = penawaranManualSkema.safeParse(data);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.harga).toBe("");
      expect(res.data.fitur).toBe("");
    }
  });
});

describe("penawaranLinkSkema", () => {
  it("menerima penawaran dari link yang valid", () => {
    const valid = {
      url_halaman: "https://hostinger.co.id/web-hosting",
      nama: "Web Hosting Murah Berkualitas",
      deskripsi: "Hosting cepat dengan garansi uptime 99.9%",
      link_affiliate: "https://hostinger.co.id?aff=999",
      harga: "Rp 24.900",
      kategori: "hosting" as const,
      gambar: "https://hostinger.co.id/logo.png",
    };
    const res = penawaranLinkSkema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it("menolak jika url_halaman tidak valid", () => {
    const invalid = {
      url_halaman: "bukan-url",
      nama: "Produk",
      link_affiliate: "https://example.com",
    };
    const res = penawaranLinkSkema.safeParse(invalid);
    expect(res.success).toBe(false);
  });
});
