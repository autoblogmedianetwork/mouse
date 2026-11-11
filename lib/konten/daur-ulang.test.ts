import { describe, expect, it } from "vitest";
import type { Konten } from "./skema";
import { cariProdukUntukDaurUlang, siapkanDraftDaurUlang } from "./daur-ulang";

const konten = (produkNama = "Tumbler Stainless", link = "") =>
  ({
    id: "k1",
    judul: "Konten lama",
    produk_nama: produkNama,
    ide_judul: "",
    statuses: ["Status satu.", "Status dua."],
    status: "terkirim",
    letak_link: "balasan",
    gaya_hook: "pertanyaan",
    kerangka: "bebas",
    link_produk: link,
    arsip: false,
    arsip_at: null,
    skor: null,
    otomatis: false,
    checklist: {},
    jadwal_at: null,
  }) as unknown as Konten;

const produk = {
  id: "p1",
  nama_internal: "Tumbler Stainless",
  nama: "",
  harga: "150000",
  deskripsi_bersih: "Tumbler bagus.",
  url_referensi: "https://s.shopee.co.id/abc",
};

describe("daur ulang konten (power-up Antrian)", () => {
  it("produk dicocokkan dari nama internal", () => {
    expect(cariProdukUntukDaurUlang(konten(), [produk])).toBe(produk);
  });

  it("cocok juga dari link kalau nama tidak sama", () => {
    const k = konten("Nama Beda Total", "https://s.shopee.co.id/abc");
    expect(cariProdukUntukDaurUlang(k, [produk])).toBe(produk);
  });

  it("produk hilang -> null, draft tetap jalan tanpa produk", () => {
    expect(cariProdukUntukDaurUlang(konten(), [])).toBeNull();
  });

  it("draft: analisisManual berisi perintah angle baru + referensi konten lama", () => {
    const draft = siapkanDraftDaurUlang(konten(), [produk]);
    expect(draft.status).toBe("draft");
    expect(draft.produk).toBe(produk);
    expect(draft.analisisManual).toContain("DAUR ULANG");
    expect(draft.analisisManual).toContain("angle BARU");
    expect(draft.analisisManual).toContain("Status satu.");
    expect(draft.analisisManual).toContain("Status dua.");
    expect(draft.konten).toHaveLength(0);
    expect(draft.updatedAt).toBeTruthy();
  });
});
