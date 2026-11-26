import { describe, expect, it } from "vitest";
import { csvKatalog, csvKonten, csvPerforma } from "./csv-data";
import type { Konten } from "@/lib/konten/skema";
import type { BarisPerforma } from "@/lib/impor/skema";

const kontenUji = {
  id: "k1",
  judul: "Review rice cooker",
  produk_nama: "Rice Cooker Miyako",
  ide_judul: "",
  statuses: ["Status satu", "Status dua"],
  status: "terjadwal" as const,
  letak_link: "balasan" as const,
  gaya_hook: "bawaan" as const,
  kerangka: "bebas" as const,
  link_produk: "https://s.shopee.co.id/x",
  arsip: false,
  created_at: "2026-11-01T00:00:00Z",
  updated_at: "2026-11-02T00:00:00Z",
  jadwal_at: null,
  arsip_at: null,
  skor: null,
  otomatis: false,
  checklist: {},
  klik_manual: 0,
  komisi_manual: 0,
} satisfies Konten;

describe("csvKonten", () => {
  it("header + satu baris per konten, isi status digabung", () => {
    const csv = csvKonten([kontenUji]);
    const baris = csv.split("\r\n");
    expect(baris[0]).toContain("judul");
    expect(baris[1]).toContain("Review rice cooker");
    expect(baris[1]).toContain('"Status satu');
    expect(baris[1]).toContain("---");
  });

  it("nilai berawalan = diprefix kutip (formula injection)", () => {
    const csv = csvKonten([{ ...kontenUji, id: "=SUM(A1:A9)", judul: "+62hack" }]);
    expect(csv).toContain("'=SUM");
    expect(csv).toContain("'+62hack");
  });

  it("daftar kosong tetap punya header", () => {
    expect(csvKonten([]).split("\r\n")).toHaveLength(1);
  });
});

describe("csvKatalog", () => {
  it("menulis kolom produk ringkas", () => {
    const csv = csvKatalog([
      {
        id: "p1",
        nama_internal: "Kopi Gayo",
        varian: "250g",
        harga: "Rp 85.000",
        tag: ["kopi", "rumah"],
        url_referensi: "https://s.shopee.co.id/kopi",
        gambar_url: "https://img.example/kopi.jpg",
        nama_toko: "Toko A",
        arsip: false,
      },
    ]);
    expect(csv).toContain("Kopi Gayo");
    expect(csv).toContain("kopi; rumah");
    expect(csv).toContain("Toko A");
  });
});

describe("csvPerforma", () => {
  it("menulis kolom performa lengkap", () => {
    const baris = {
      id: "b1",
      marketplace: "shopee" as const,
      jenis: "penjualan" as const,
      id_pesanan: "INV1",
      produk: "Kopi Gayo",
      varian: "",
      tanggal: "2026-11-01",
      jam: 10,
      jumlah: 1,
      harga: 85000,
      komisi: 8500,
      tingkat_komisi: null,
      status_pesanan: "selesai",
      status_kode: "selesai" as const,
      sub_id: "TH1",
      klik: 0,
      sumber: "uji.csv",
      diimpor_pada: "2026-11-02T00:00:00Z",
    } satisfies BarisPerforma;
    const csv = csvPerforma([baris]);
    expect(csv).toContain("INV1");
    expect(csv).toContain("8500");
    expect(csv).toContain("selesai");
  });
});
