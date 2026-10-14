import { describe, expect, it } from "vitest";
import type { BarisPerforma } from "@/lib/impor/skema";
import { buatIdBaris, kunciBaris } from "@/lib/impor/performa";
import type { Konten } from "@/lib/konten/skema";
import { hitungAtribusi, petaEfektif, subIdDefault } from "./atribusi";
import { setPemetaan } from "./store";
import { PETA_ATRIBUSI_AWAL, normalkanSubId } from "./skema";

function konten(ubah: Partial<Konten>): Konten {
  const dasar: Konten = {
    id: "k1",
    judul: "Utas Tas Kanvas",
    produk_nama: "Tas Kanvas",
    ide_judul: "Listicle 5 alasan tas kanvas",
    statuses: ["Halo"],
    status: "terkirim",
    letak_link: "balasan",
    gaya_hook: "bawaan",
    link_produk: "",
    arsip: false,
    arsip_at: null,
    skor: null,
    jadwal_at: null,
    otomatis: false,
    checklist: {},
    klik_manual: 0,
    komisi_manual: 0,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
  };
  return { ...dasar, ...ubah };
}

function baris(ubah: Partial<BarisPerforma>): BarisPerforma {
  const dasar: BarisPerforma = {
    id: "",
    marketplace: "shopee",
    jenis: "penjualan",
    id_pesanan: "A1",
    produk: "Tas Kanvas",
    varian: "",
    tanggal: "2026-09-15",
    jumlah: 1,
    harga: 189_000,
    komisi: 12_285,
    tingkat_komisi: 6.5,
    status_pesanan: "Selesai",
    status_kode: "selesai",
    sub_id: "",
    klik: 0,
    sumber: "uji.csv",
    diimpor_pada: "2026-10-01T00:00:00.000Z",
  };
  const gabung = { ...dasar, ...ubah };
  return { ...gabung, id: buatIdBaris(kunciBaris(gabung)) };
}

describe("subIdDefault", () => {
  it("stabil dan pendek untuk id konten yang sama", () => {
    const kode = subIdDefault("df0f7a2c-1111-2222-3333-444455556666");
    expect(kode).toBe(subIdDefault("df0f7a2c-1111-2222-3333-444455556666"));
    expect(kode).toMatch(/^at-[0-9a-f]{6}$/);
  });

  it("berbeda untuk konten yang berbeda", () => {
    expect(subIdDefault("k1")).not.toBe(subIdDefault("k2"));
  });
});

describe("petaEfektif", () => {
  const daftar = [konten({ id: "k1" }), konten({ id: "k2", judul: "Utas Sepatu" })];

  it("memasukkan kode bawaan semua konten", () => {
    const efektif = petaEfektif(daftar, {});
    expect(efektif.get(subIdDefault("k1"))).toBe("k1");
    expect(efektif.get(subIdDefault("k2"))).toBe("k2");
  });

  it("pemetaan manual menimpa kode bawaan dan menormalkan huruf", () => {
    const efektif = petaEfektif(daftar, { " Threads-01 ": "k2" });
    expect(efektif.get("threads-01")).toBe("k2");
  });
});

describe("hitungAtribusi", () => {
  const k1 = konten({ id: "k1", klik_manual: 50 });
  const k2 = konten({
    id: "k2",
    judul: "Utas Sepatu",
    ide_judul: "Listicle 5 alasan tas kanvas",
    klik_manual: 0,
  });

  const data = [
    baris({ id_pesanan: "A1", sub_id: subIdDefault("k1"), komisi: 12_285, klik: 184 }),
    baris({
      id_pesanan: "A2",
      sub_id: subIdDefault("k1"),
      komisi: 6_000,
      klik: 60,
      status_kode: "menunggu",
      status_pesanan: "Menunggu Konfirmasi",
    }),
    baris({
      id_pesanan: "A3",
      sub_id: subIdDefault("k1"),
      komisi: -2_000,
      klik: 30,
      status_kode: "batal",
      status_pesanan: "Dibatalkan",
    }),
    baris({ id_pesanan: "B1", sub_id: "threads-01", produk: "Sepatu", komisi: 21_125, klik: 96 }),
    baris({ id_pesanan: "C1", sub_id: "tidak-dikenal", produk: "Topi", komisi: 5_000, klik: 41 }),
    baris({ id_pesanan: "D1", sub_id: "", produk: "Blender", komisi: 999, klik: 5 }),
  ];

  const peta = setPemetaan(PETA_ATRIBUSI_AWAL, "threads-01", "k2").peta;
  const hasil = hitungAtribusi(data, [k1, k2], peta);

  it("menjumlahkan komisi dan pesanan per konten", () => {
    const k = hasil.per_konten.find((x) => x.konten_id === "k1")!;
    expect(k.baris).toBe(3);
    expect(k.komisi).toBe(16_285);
    expect(k.komisi_cair).toBe(18_285);
    expect(k.pesanan).toBe(2);
  });

  it("menghitung klik, komisi per klik, dan konversi", () => {
    const k = hasil.per_konten.find((x) => x.konten_id === "k1")!;
    expect(k.klik_impor).toBe(274);
    expect(k.klik_manual).toBe(50);
    // Klik impor dipakai bila tersedia, jadi klik manual tidak menambah.
    expect(k.klik_dipakai).toBe(274);
    expect(k.komisi_per_klik).toBeCloseTo(18_285 / 274, 4);
    expect(k.konversi).toBeCloseTo((2 / 274) * 100, 4);
  });

  it("memakai klik manual saat laporan tidak memuat klik", () => {
    const tanpaKlik = hitungAtribusi(
      [baris({ sub_id: subIdDefault("k1"), klik: 0 })],
      [k1],
      {},
    );
    const k = tanpaKlik.per_konten[0];
    expect(k.klik_impor).toBe(0);
    expect(k.klik_dipakai).toBe(50);
    expect(k.konversi).toBeCloseTo(2, 4);
  });

  it("mengaitkan sub_id lama lewat peta manual", () => {
    const k = hasil.per_konten.find((x) => x.konten_id === "k2")!;
    expect(k.komisi).toBe(21_125);
    expect(k.sub_ids).toEqual(["threads-01"]);
  });

  it("memisahkan sub_id yang belum dipetakan", () => {
    expect(hasil.belum_terpetakan).toEqual([
      { sub_id: "tidak-dikenal", baris: 1, komisi: 5_000, klik: 41, pesanan: 1 },
    ]);
  });

  it("mencatat baris tanpa sub_id secara terpisah", () => {
    expect(hasil.tanpa_subid).toEqual({ baris: 1, komisi: 999, klik: 5 });
    expect(hasil.total.komisi).toBe(37_410);
  });

  it("menggabungkan performa per angle", () => {
    const angle = hasil.per_angle.find((a) => a.angle === "Listicle 5 alasan tas kanvas")!;
    expect(angle.konten).toBe(2);
    expect(angle.komisi).toBe(37_410);
    expect(angle.klik).toBe(370);
  });

  it("menghitung konten yang belum punya data sama sekali", () => {
    const kosong = konten({ id: "k3", judul: "Belum diposting" });
    const dengan = hitungAtribusi([], [k1, kosong], {});
    expect(dengan.per_konten).toHaveLength(1);
    expect(dengan.konten_tanpa_data).toBe(1);
  });

  it("aman untuk data kosong", () => {
    const kosong = hitungAtribusi([], [], {});
    expect(kosong.per_konten).toEqual([]);
    expect(kosong.teratas).toEqual([]);
    expect(kosong.total.komisi).toBe(0);
  });
});

describe("per hook dan per letak link (Fase 6, PRD F11)", () => {
  const pertanyaan = konten({ id: "h1", judul: "Hook pertanyaan", gaya_hook: "pertanyaan" });
  const mengejutkan = konten({
    id: "h2",
    judul: "Hook mengejutkan",
    ide_judul: "Angle lain",
    gaya_hook: "pernyataan_mengejutkan",
    letak_link: "tanpa_link",
  });
  const belumAda = konten({ id: "h3", judul: "Belum diposting", gaya_hook: "pertanyaan" });

  const data = [
    baris({ id_pesanan: "H1", sub_id: subIdDefault("h1"), komisi: 10_000, klik: 100 }),
    baris({ id_pesanan: "H2", sub_id: subIdDefault("h2"), komisi: 4_000, klik: 200 }),
  ];
  const hasil = hitungAtribusi(data, [pertanyaan, mengejutkan, belumAda], {});

  it("mengelompokkan klik, komisi, dan konversi per gaya hook", () => {
    const hook = hasil.per_hook.find((h) => h.kunci === "pertanyaan")!;
    expect(hook.label).toBe("Pertanyaan");
    expect(hook.konten).toBe(1);
    expect(hook.klik).toBe(100);
    expect(hook.komisi).toBe(10_000);
    expect(hook.konversi).toBeCloseTo(1, 4); // 1 pesanan / 100 klik
  });

  it("mengurutkan hook dari komisi terbesar", () => {
    expect(hasil.per_hook.map((h) => h.kunci)).toEqual(["pertanyaan", "pernyataan_mengejutkan"]);
  });

  it("memisahkan letak link dari gaya hook", () => {
    const tanpaLink = hasil.per_letak_link.find((l) => l.kunci === "tanpa_link")!;
    expect(tanpaLink.label).toBe("Tanpa link");
    expect(tanpaLink.komisi).toBe(4_000);
    expect(tanpaLink.klik).toBe(200);
    const balasan = hasil.per_letak_link.find((l) => l.kunci === "balasan")!;
    expect(balasan.komisi).toBe(10_000);
  });

  it("tidak menghitung konten tanpa data sama sekali", () => {
    // Tiga konten, satu belum punya baris laporan maupun klik manual.
    expect(hasil.konten_tanpa_data).toBe(1);
    const totalHook = hasil.per_hook.reduce((n, h) => n + h.konten, 0);
    const totalLetak = hasil.per_letak_link.reduce((n, l) => n + l.konten, 0);
    expect(totalHook).toBe(2);
    expect(totalLetak).toBe(2);
  });

  it("memakai klik manual saat laporan tidak memuat klik", () => {
    const manual = konten({ id: "h4", judul: "Manual", gaya_hook: "bawaan", klik_manual: 25 });
    const dengan = hitungAtribusi([], [manual], {});
    const hook = dengan.per_hook.find((h) => h.kunci === "bawaan")!;
    expect(hook.klik).toBe(25);
    expect(hook.komisi).toBe(0);
  });

  it("aman saat daftar kosong", () => {
    const kosong = hitungAtribusi([], [], {});
    expect(kosong.per_hook).toEqual([]);
    expect(kosong.per_letak_link).toEqual([]);
  });
});

describe("setPemetaan", () => {
  it("menambah, mengganti, dan menghapus pemetaan", () => {
    const a = setPemetaan(PETA_ATRIBUSI_AWAL, " Threads-01 ", "k2");
    expect(a.peta).toEqual({ "threads-01": "k2" });

    const b = setPemetaan(a, "threads-01", "k3");
    expect(b.peta).toEqual({ "threads-01": "k3" });

    const c = setPemetaan(b, "threads-01", null);
    expect(c.peta).toEqual({});
  });

  it("mengabaikan sub_id kosong", () => {
    expect(setPemetaan(PETA_ATRIBUSI_AWAL, "  ", "k1").peta).toEqual({});
  });
});

describe("normalkanSubId", () => {
  it("merapikan spasi dan huruf besar", () => {
    expect(normalkanSubId(" Sub_ID-1 ")).toBe("sub_id-1");
  });
});
