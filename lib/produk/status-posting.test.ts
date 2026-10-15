import { describe, expect, it } from "vitest";
import { kontenSkema, type Konten } from "@/lib/konten/skema";
import {
  BATAS_HARI_OPSI,
  filterUsiaTerakhir,
  statusPostingProduk,
} from "./status-posting";

/** 2026-10-16 12:00 waktu lokal. */
const SEKARANG = new Date(2026, 9, 16, 12, 0, 0).getTime();

function buatKonten(patch: {
  id: string;
  produkNama: string;
  status: Konten["status"];
  updated_at: string;
  arsip?: boolean;
}): Konten {
  return kontenSkema.parse({
    id: patch.id,
    judul: `Judul ${patch.id}`,
    produk_nama: patch.produkNama,
    ide_judul: "",
    statuses: ["Status satu."],
    status: patch.status,
    letak_link: "status_terakhir",
    link_produk: "",
    arsip: patch.arsip ?? false,
    arsip_at: null,
    klik_manual: 0,
    komisi_manual: 0,
    created_at: new Date(2026, 9, 1).toISOString(),
    updated_at: patch.updated_at,
    jadwal_at: null,
    checklist: {},
  });
}

describe("statusPostingProduk", () => {
  it("mengelompokkan beberapa konten satu produk menjadi satu baris", () => {
    const daftar = [
      buatKonten({ id: "a", produkNama: "Tas Kanvas", status: "draft", updated_at: new Date(2026, 9, 10).toISOString() }),
      buatKonten({ id: "b", produkNama: "Tas Kanvas", status: "terkirim", updated_at: new Date(2026, 9, 12).toISOString() }),
      buatKonten({ id: "c", produkNama: "Tas Kanvas", status: "terkirim", updated_at: new Date(2026, 9, 14).toISOString() }),
    ];
    const hasil = statusPostingProduk(daftar, SEKARANG);
    expect(hasil).toHaveLength(1);
    expect(hasil[0].produk).toBe("Tas Kanvas");
    expect(hasil[0].jumlahKonten).toBe(3);
    expect(hasil[0].jumlahTerkirim).toBe(2);
    expect(hasil[0].terakhirTerkirim).toBe(new Date(2026, 9, 14).toISOString());
    // 16 Okt - 14 Okt = 2 hari.
    expect(hasil[0].usiaHari).toBe(2);
  });

  it("produk tanpa konten terkirim jadi belumPernah dengan usia null", () => {
    const daftar = [
      buatKonten({ id: "a", produkNama: "Botol Minum", status: "draft", updated_at: new Date(2026, 9, 15).toISOString() }),
    ];
    const hasil = statusPostingProduk(daftar, SEKARANG);
    expect(hasil[0].belumPernah).toBe(true);
    expect(hasil[0].terakhirTerkirim).toBeNull();
    expect(hasil[0].usiaHari).toBeNull();
    expect(hasil[0].belumPernah).toBe(true);
  });

  it("produk dengan keterangan produk_nama spasi dibereskan dan kosong dilewati", () => {
    const daftar = [
      buatKonten({ id: "a", produkNama: "Tas Kanvas", status: "draft", updated_at: new Date(2026, 9, 15).toISOString() }),
      buatKonten({ id: "b", produkNama: "", status: "terkirim", updated_at: new Date(2026, 9, 15).toISOString() }),
    ];
    const hasil = statusPostingProduk(daftar, SEKARANG);
    expect(hasil).toHaveLength(1);
    expect(hasil[0].produk).toBe("Tas Kanvas");
  });

  it("konten arsip tetap terhitung untuk riwayat kirim (K3 hanya menyembunyikan)", () => {
    const daftar = [
      buatKonten({
        id: "a",
        produkNama: "Tas Kanvas",
        status: "terkirim",
        updated_at: new Date(2026, 8, 1).toISOString(),
        arsip: true,
      }),
    ];
    const hasil = statusPostingProduk(daftar, SEKARANG);
    expect(hasil[0].jumlahTerkirim).toBe(1);
    expect(hasil[0].belumPernah).toBe(false);
    expect(hasil[0].usiaHari).toBeGreaterThan(30);
  });

  it("urutkan: belumPernah di atas, lalu usia terlama, lalu nama", () => {
    const daftar = [
      buatKonten({ id: "1", produkNama: "Produk Muda", status: "terkirim", updated_at: new Date(2026, 9, 16).toISOString() }),
      buatKonten({ id: "2", produkNama: "Produk Lama", status: "terkirim", updated_at: new Date(2026, 8, 1).toISOString() }),
      buatKonten({ id: "3", produkNama: "Produk Baru", status: "draft", updated_at: new Date(2026, 9, 15).toISOString() }),
    ];
    const hasil = statusPostingProduk(daftar, SEKARANG);
    expect(hasil.map((h) => h.produk)).toEqual(["Produk Baru", "Produk Lama", "Produk Muda"]);
  });

  it("updated_at rusak pada konten terkirim tidak membuat tanggal palsu", () => {
    const daftar = [
      buatKonten({ id: "a", produkNama: "Tas Kanvas", status: "terkirim", updated_at: "rusak" }),
    ];
    const hasil = statusPostingProduk(daftar, SEKARANG);
    expect(hasil[0].belumPernah).toBe(false);
    expect(hasil[0].terakhirTerkirim).toBeNull();
    expect(hasil[0].usiaHari).toBeNull();
  });

  it("pustaka kosong menghasilkan daftar kosong", () => {
    expect(statusPostingProduk([], SEKARANG)).toEqual([]);
  });
});

describe("filterUsiaTerakhir", () => {
  const P = statusPostingProduk(
    [
      buatKonten({ id: "1", produkNama: "Dua Hari", status: "terkirim", updated_at: new Date(2026, 9, 14).toISOString() }),
      buatKonten({ id: "2", produkNama: "Sepuluh Hari", status: "terkirim", updated_at: new Date(2026, 9, 6).toISOString() }),
      buatKonten({ id: "3", produkNama: "Belum Ada", status: "draft", updated_at: new Date(2026, 9, 15).toISOString() }),
    ],
    SEKARANG,
  );

  it("batas 7 hari: produk 2 hari tidak masuk, 10 hari dan belum pernah masuk", () => {
    const hasil = filterUsiaTerakhir(P, 7);
    expect(hasil.map((h) => h.produk)).toEqual(["Belum Ada", "Sepuluh Hari"]);
  });

  it("batas 14 hari: produk 10 hari tidak masuk (10 < 14), yang lama saja", () => {
    const hasil = filterUsiaTerakhir(P, 14);
    expect(hasil.map((h) => h.produk)).toEqual(["Belum Ada"]);
  });

  it("batas 1 hari: semua produk masuk", () => {
    const hasil = filterUsiaTerakhir(P, 1);
    expect(hasil.map((h) => h.produk)).toEqual(["Belum Ada", "Sepuluh Hari", "Dua Hari"]);
  });

  it("opsi batas tersedia 7/14/30/90", () => {
    expect([...BATAS_HARI_OPSI]).toEqual([7, 14, 30, 90]);
  });
});
