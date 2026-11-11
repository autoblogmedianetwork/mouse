import { describe, expect, it } from "vitest";
import type { Konten } from "./skema";
import { produkButuhKonten } from "./fokus";

const konten = (produkNama: string, umurHari: number): Konten =>
  ({
    id: `k-${produkNama}-${umurHari}`,
    judul: "x",
    produk_nama: produkNama,
    ide_judul: "",
    statuses: ["isi"],
    status: "terkirim",
    letak_link: "balasan",
    gaya_hook: "bawaan",
    kerangka: "bebas",
    link_produk: "",
    arsip: false,
    arsip_at: null,
    skor: null,
    otomatis: false,
    checklist: {},
    jadwal_at: null,
    updated_at: new Date(Date.parse("2026-11-11T00:00:00Z") - umurHari * 86_400_000).toISOString(),
  }) as unknown as Konten;

const HARI_INI = new Date("2026-11-11T00:00:00Z");

describe("rekomendasi produk butuh konten (power-up Fokus)", () => {
  it("produk tanpa konten -> belum pernah", () => {
    const hasil = produkButuhKonten([{ nama_internal: "Tumbler" }], [], HARI_INI);
    expect(hasil).toHaveLength(1);
    expect(hasil[0].alasan).toContain("belum pernah");
  });

  it("konten terakhir 10 hari -> ditandai", () => {
    const hasil = produkButuhKonten(
      [{ nama_internal: "Tumbler" }],
      [konten("Tumbler", 10)],
      HARI_INI,
    );
    expect(hasil).toHaveLength(1);
    expect(hasil[0].hariSejakTerakhir).toBe(10);
  });

  it("konten 3 hari -> tidak ditandai", () => {
    const hasil = produkButuhKonten(
      [{ nama_internal: "Tumbler" }],
      [konten("Tumbler", 3)],
      HARI_INI,
    );
    expect(hasil).toHaveLength(0);
  });

  it("pencocokan nama tidak peduli huruf besar/kecil", () => {
    const hasil = produkButuhKonten(
      [{ nama_internal: "Tumbler" }],
      [konten("tumbler", 1)],
      HARI_INI,
    );
    expect(hasil).toHaveLength(0);
  });
});
