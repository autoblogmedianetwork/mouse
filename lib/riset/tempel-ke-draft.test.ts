import { describe, expect, it } from "vitest";
import { produkKeDraft } from "./tempel-ke-draft";
import { uraiTempelan, nilaiTempelan } from "@/lib/riset/tempel-cepat";

describe("produkKeDraft", () => {
  const dasar = uraiTempelan(
    "Baju Anak Lengan Panjang Katun Premium\nRp89.000\n2,3rb terjual · 4.8\nhttps://s.shopee.co.id/abc123",
  );

  it("mengisi semua field wajib draft dari tempelan", () => {
    const d = produkKeDraft(dasar);
    expect(d.nama_internal).toBe("Baju Anak Lengan Panjang Katun Premium");
    expect(d.harga).toBe("89000");
    expect(d.url_referensi).toBe("https://s.shopee.co.id/abc123");
    expect(d.deskripsi.length).toBeGreaterThanOrEqual(10);
  });

  it("deskripsi memuat bukti sosial (terjual & rating) agar AI punya bahan", () => {
    const d = produkKeDraft(dasar);
    // toLocaleString("id-ID") memakai titik sebagai pemisah ribuan.
    expect(d.deskripsi).toContain("2.300");
    expect(d.deskripsi).toContain("4.8");
  });

  it("tanpa link & harga tetap menghasilkan draft yang bisa disunting", () => {
    const polos = uraiTempelan("Tumbler Stainless");
    const d = produkKeDraft(polos);
    expect(d.nama_internal).toBe("Tumbler Stainless");
    expect(d.url_referensi).toBe("");
    expect(d.deskripsi.length).toBeGreaterThanOrEqual(10);
  });

  it("nama kosong diganti label aman, bukan string kosong", () => {
    const d = produkKeDraft(uraiTempelan(""));
    expect(d.nama_internal.length).toBeGreaterThan(0);
    expect(d.nama_internal).not.toBe("");
  });

  it("memakai skor untuk menandai kualitas tempelan di deskripsi", () => {
    const d = produkKeDraft(dasar, nilaiTempelan(dasar, { ratePersen: 10, targetBulan: 1_000_000 }));
    expect(d.deskripsi).toContain("layak");
  });
});
