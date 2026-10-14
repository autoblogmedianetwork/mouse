import { describe, expect, it } from "vitest";
import {
  RIWAYAT_LIMIT,
  barisKeKonten,
  barisKontenSkema,
  belumDikirim,
  kontenKeBaris,
  kontenLayakKirim,
  statusKontenKeBaris,
  urutkanRiwayat,
} from "./supabase-konten";
import type { Konten } from "./skema";

const USER = "11111111-1111-1111-1111-111111111111";

function konten(over: Partial<Konten> = {}): Konten {
  return {
    id: "konten-1",
    judul: "Judul uji",
    produk_nama: "Tas kanvas",
    ide_judul: "Ide uji",
    statuses: ["status satu", "status dua"],
    status: "draft",
    letak_link: "balasan",
    gaya_hook: "pertanyaan",
    link_produk: "https://contoh.test/produk",
    arsip: false,
    arsip_at: null,
    skor: null,
    otomatis: false,
    checklist: { hook_kuat: true },
    jadwal_at: null,
    klik_manual: 3,
    komisi_manual: 15000,
    created_at: "2026-10-01T00:00:00.000Z",
    updated_at: "2026-10-02T00:00:00.000Z",
    ...over,
  };
}

describe("kontenKeBaris", () => {
  it("memetakan kolom konten ke kolom tabel contents", () => {
    const baris = kontenKeBaris(konten(), USER);
    expect(baris).toMatchObject({
      id: "konten-1",
      user_id: USER,
      judul_internal: "Judul uji",
      status: "draft",
      letak_link: "balasan",
      gaya_hook: "pertanyaan",
      link_produk: "https://contoh.test/produk",
      klik_manual: 3,
      komisi_manual: 15000,
      is_arsip: false,
      created_at: "2026-10-01T00:00:00.000Z",
      updated_at: "2026-10-02T00:00:00.000Z",
    });
  });

  it("menyimpan checklist dan penanda otomatis di pengaturan jsonb", () => {
    const baris = kontenKeBaris(konten({ otomatis: true, checklist: { hook_kuat: true } }), USER);
    expect(baris.pengaturan).toEqual({ otomatis: true, checklist: { hook_kuat: true } });
  });

  it("mengosongkan link kalau memang tidak ada", () => {
    expect(kontenKeBaris(konten({ link_produk: "   " }), USER).link_produk).toBeNull();
  });
});

describe("statusKontenKeBaris", () => {
  it("memberi urutan mulai satu dan membuang status kosong", () => {
    const baris = statusKontenKeBaris(konten({ statuses: [" satu ", "dua"] }), USER);
    expect(baris).toEqual([
      { user_id: USER, content_id: "konten-1", urutan: 1, teks: "satu" },
      { user_id: USER, content_id: "konten-1", urutan: 2, teks: "dua" },
    ]);
  });
});

describe("kontenLayakKirim", () => {
  it("melewati entri rusak tanpa menggagalkan sisanya", () => {
    const hasil = kontenLayakKirim([konten(), { id: "rusak" }, konten({ id: "konten-2" })]);
    expect(hasil.map((k) => k.id)).toEqual(["konten-1", "konten-2"]);
  });

  it("menolak konten dengan status kosong atau lebih dari 500 karakter", () => {
    const panjang = "a".repeat(501);
    expect(kontenLayakKirim([konten({ statuses: [""] })])).toEqual([]);
    expect(kontenLayakKirim([konten({ statuses: [panjang] })])).toEqual([]);
  });
});

describe("barisKeKonten", () => {
  it("mengembalikan bentuk konten dari baris database", () => {
    const baris = barisKontenSkema.parse({
      id: "konten-1",
      judul_internal: "Judul uji",
      status: "siap_posting",
      letak_link: "balasan",
      link_produk: null,
      gaya_hook: "ahli",
      is_arsip: false,
      arsip_at: null,
      klik_manual: "4",
      komisi_manual: "20000",
      pengaturan: { otomatis: false, checklist: { hook_kuat: true } },
      created_at: "2026-10-01T00:00:00.000Z",
      updated_at: "2026-10-02T00:00:00.000Z",
    });
    const hasil = barisKeKonten(baris, ["satu", "dua"]);
    expect(hasil.status).toBe("siap_posting");
    expect(hasil.statuses).toEqual(["satu", "dua"]);
    expect(hasil.klik_manual).toBe(4);
    expect(hasil.komisi_manual).toBe(20000);
    expect(hasil.checklist).toEqual({ hook_kuat: true });
  });

  it("jatuh ke gaya hook bawaan untuk nilai yang tidak dikenal", () => {
    const baris = barisKontenSkema.parse({
      id: "k",
      judul_internal: "J",
      status: "draft",
      gaya_hook: "entah",
      created_at: "2026-10-01T00:00:00.000Z",
      updated_at: "2026-10-01T00:00:00.000Z",
    });
    expect(barisKeKonten(baris, ["satu"]).gaya_hook).toBe("bawaan");
  });

  it("tetap menghasilkan konten valid walau status belum tersimpan", () => {
    const baris = barisKontenSkema.parse({
      id: "k",
      judul_internal: "J",
      status: "draft",
      created_at: "2026-10-01T00:00:00.000Z",
      updated_at: "2026-10-01T00:00:00.000Z",
    });
    expect(barisKeKonten(baris, []).statuses.length).toBe(1);
  });
});

describe("urutkanRiwayat", () => {
  it("menaruh konten terbaru lebih dulu dan memotong ke 15", () => {
    const list = Array.from({ length: 20 }, (_, i) =>
      konten({ id: `k${i}`, updated_at: `2026-10-${String(i + 1).padStart(2, "0")}T00:00:00.000Z` }),
    );
    const hasil = urutkanRiwayat(list);
    expect(hasil.length).toBe(RIWAYAT_LIMIT);
    expect(hasil[0].id).toBe("k19");
  });
});

describe("belumDikirim", () => {
  it("mengembalikan konten lokal yang belum ada di server", () => {
    const lokal = [konten({ id: "a" }), konten({ id: "b" })];
    expect(belumDikirim(lokal, [{ id: "a" }]).map((k) => k.id)).toEqual(["b"]);
  });

  it("kosong kalau semua sudah ada", () => {
    expect(belumDikirim([konten({ id: "a" })], [{ id: "a" }])).toEqual([]);
  });
});
