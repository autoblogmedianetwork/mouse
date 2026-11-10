import { describe, expect, it } from "vitest";
import type { Konten } from "./skema";
import {
  MAKS_FOKUS,
  catatHariSelesai,
  hitungStreak,
  kunciHariLokal,
  pilihFokus,
  tujuhHariTerakhir,
} from "./fokus";

const dasar = {
  produk_nama: "",
  ide_judul: "",
  letak_link: "status_terakhir",
  gaya_hook: "bawaan",
  kerangka: "bebas",
  link_produk: "",
  arsip: false,
  arsip_at: null,
  skor: null,
  otomatis: false,
  checklist: {},
  jadwal_at: null,
  klik_manual: 0,
  komisi_manual: 0,
  created_at: "2026-11-01T00:00:00.000Z",
  updated_at: "2026-11-01T00:00:00.000Z",
} as const;

function buat(id: string, ubah: Partial<Konten>): Konten {
  return {
    ...dasar,
    id,
    judul: `Konten ${id}`,
    statuses: ["Halo."],
    status: "draft",
    ...ubah,
  } as Konten;
}

describe("kunciHariLokal", () => {
  it("memakai tanggal lokal, bukan UTC", () => {
    expect(kunciHariLokal(new Date(2026, 10, 11, 23, 30))).toBe("2026-11-11");
  });
});

describe("pilihFokus", () => {
  const sekarang = new Date(2026, 10, 11, 9, 0);

  it("menaruh jadwal hari ini di atas siap posting", () => {
    const konten = [
      buat("siap", { status: "siap_posting", updated_at: "2026-11-10T00:00:00.000Z" }),
      buat("jadwal", { status: "terjadwal", jadwal_at: "2026-11-11T10:00:00.000Z" }),
    ];
    const hasil = pilihFokus(konten, sekarang);
    expect(hasil.map((h) => h.konten.id)).toEqual(["jadwal", "siap"]);
    expect(hasil[0]?.alasan).toBe("jadwal_hari_ini");
  });

  it("melewati arsip, draft, dan jadwal hari lain", () => {
    const konten = [
      buat("arsip", { status: "siap_posting", arsip: true }),
      buat("draft", { status: "draft" }),
      buat("besok", { status: "terjadwal", jadwal_at: "2026-11-12T10:00:00.000Z" }),
    ];
    expect(pilihFokus(konten, sekarang)).toEqual([]);
  });

  it("membatasi jumlah item fokus", () => {
    const konten = Array.from({ length: 6 }, (_, i) => buat(`k${i}`, { status: "siap_posting" }));
    expect(pilihFokus(konten, sekarang)).toHaveLength(MAKS_FOKUS);
  });
});

describe("catatHariSelesai", () => {
  it("menambah tanggal baru di depan tanpa duplikat", () => {
    expect(catatHariSelesai(["2026-11-10"], "2026-11-11")).toEqual(["2026-11-11", "2026-11-10"]);
    expect(catatHariSelesai(["2026-11-11"], "2026-11-11")).toEqual(["2026-11-11"]);
  });

  it("mengabaikan tanggal rusak", () => {
    expect(catatHariSelesai(["2026-11-10"], "kemarin")).toEqual(["2026-11-10"]);
  });
});

describe("hitungStreak", () => {
  it("menghitung hari berturut-turut termasuk hari ini", () => {
    expect(hitungStreak(["2026-11-11", "2026-11-10", "2026-11-09"], "2026-11-11")).toBe(3);
  });

  it("tetap menghitung dari kemarin saat hari ini belum selesai", () => {
    expect(hitungStreak(["2026-11-10", "2026-11-09"], "2026-11-11")).toBe(2);
  });

  it("berhenti di hari yang bolong", () => {
    expect(hitungStreak(["2026-11-11", "2026-11-09"], "2026-11-11")).toBe(1);
  });

  it("nol saat belum ada aktivitas", () => {
    expect(hitungStreak([], "2026-11-11")).toBe(0);
  });
});

describe("tujuhHariTerakhir", () => {
  it("mengembalikan 7 hari berurutan dan menandai yang selesai", () => {
    const hasil = tujuhHariTerakhir(["2026-11-11", "2026-11-09"], "2026-11-11");
    expect(hasil).toHaveLength(7);
    expect(hasil[6]).toEqual({ hari: "2026-11-11", selesai: true });
    expect(hasil[4]).toEqual({ hari: "2026-11-09", selesai: true });
    expect(hasil[5]?.selesai).toBe(false);
  });
});
