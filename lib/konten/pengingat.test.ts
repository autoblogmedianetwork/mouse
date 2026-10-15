import { describe, expect, it } from "vitest";
import {
  BATAS_DRAFT_HARI,
  evaluasiPengingat,
  filterTertutup,
  kunciHariLalu,
  type PengingatItem,
} from "./pengingat";
import { kontenSkema, type Konten } from "./skema";

/** 2026-10-16 (Jumat) 09:00 waktu lokal. */
const SEKARANG = new Date(2026, 9, 16, 9, 0, 0).getTime();

function buatKonten(patch: {
  id: string;
  status: Konten["status"];
  jadwal_at?: string | null;
  updated_at?: string;
  arsip?: boolean;
  judul?: string;
}): Konten {
  return kontenSkema.parse({
    id: patch.id,
    judul: patch.judul ?? `Konten ${patch.id}`,
    produk_nama: "Produk",
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
    updated_at: patch.updated_at ?? new Date(2026, 9, 15, 8, 0, 0).toISOString(),
    jadwal_at: patch.jadwal_at ?? null,
    checklist: {},
  });
}

describe("evaluasiPengingat - jadwal", () => {
  it("konten terjadwal hari ini masuk pengingat dengan jam", () => {
    // Jadwal 16 Okt 2026 14:00 — hari yang sama dengan SEKARANG, belum lewat.
    const konten = [buatKonten({ id: "a", status: "terjadwal", jadwal_at: new Date(2026, 9, 16, 14, 0).toISOString() })];
    const hasil = evaluasiPengingat({ konten, sekarang: SEKARANG });
    expect(hasil).toHaveLength(1);
    expect(hasil[0].jenis).toBe("jadwal_hari_ini");
    expect(hasil[0].detail).toContain("14.00");
    expect(hasil[0].id).toBe("jadwal_hari_ini:a");
    expect(hasil[0].href).toBe("/kalender");
  });

  it("jadwal yang sudah berlalu ditandai lewat, bukan hari ini", () => {
    const konten = [buatKonten({ id: "a", status: "terjadwal", jadwal_at: new Date(2026, 9, 16, 7, 0).toISOString() })];
    const hasil = evaluasiPengingat({ konten, sekarang: SEKARANG });
    expect(hasil).toHaveLength(1);
    expect(hasil[0].jenis).toBe("jadwal_lewat");
  });

  it("jadwal besok masuk rentang minggu ini", () => {
    const konten = [buatKonten({ id: "a", status: "terjadwal", jadwal_at: new Date(2026, 9, 17, 12, 0).toISOString() })];
    const hasil = evaluasiPengingat({ konten, sekarang: SEKARANG });
    expect(hasil).toHaveLength(1);
    expect(hasil[0].jenis).toBe("jadwal_minggu_ini");
    expect(hasil[0].detail).toContain("Sabtu");
  });

  it("jadwal lebih dari 7 hari ke depan tidak masuk", () => {
    const konten = [buatKonten({ id: "a", status: "terjadwal", jadwal_at: new Date(2026, 9, 25, 12, 0).toISOString() })];
    expect(evaluasiPengingat({ konten, sekarang: SEKARANG })).toHaveLength(0);
  });

  it("jadwal kemarin yang masih terjadwal jadi lewat", () => {
    const konten = [buatKonten({ id: "a", status: "terjadwal", jadwal_at: new Date(2026, 9, 15, 12, 0).toISOString() })];
    const hasil = evaluasiPengingat({ konten, sekarang: SEKARANG });
    expect(hasil[0].jenis).toBe("jadwal_lewat");
  });

  it("jadwal_at rusak diabaikan, bukan jadi pengingat", () => {
    const konten = [buatKonten({ id: "a", status: "terjadwal", jadwal_at: "bukan-tanggal" })];
    expect(evaluasiPengingat({ konten, sekarang: SEKARANG })).toHaveLength(0);
  });

  it("konten terjadwal yang diarsip tidak menimbulkan pengingat jadwal", () => {
    const konten = [
      buatKonten({
        id: "a",
        status: "terjadwal",
        jadwal_at: new Date(2026, 9, 16, 14, 0).toISOString(),
        arsip: true,
      }),
    ];
    expect(evaluasiPengingat({ konten, sekarang: SEKARANG })).toHaveLength(0);
  });
});

describe("evaluasiPengingat - draft terbengkalai", () => {
  it("draft pustaka yang lebih tua dari batas masuk pengingat", () => {
    // SEKARANG - 4 hari = 12 Okt; usia 4 hari >= 3.
    const konten = [buatKonten({ id: "a", status: "draft", updated_at: new Date(2026, 9, 12).toISOString() })];
    const hasil = evaluasiPengingat({ konten, sekarang: SEKARANG });
    expect(hasil).toHaveLength(1);
    expect(hasil[0].jenis).toBe("draft_pustaka");
    expect(hasil[0].detail).toContain("4 hari");
    expect(hasil[0].href).toBe("/antrian");
  });

  it("draft pustaka dari kemarin tidak masuk", () => {
    const konten = [buatKonten({ id: "a", status: "draft", updated_at: new Date(2026, 9, 15).toISOString() })];
    expect(evaluasiPengingat({ konten, sekarang: SEKARANG })).toHaveLength(0);
  });

  it("siap_posting yang tidak diangkat juga diingat", () => {
    const konten = [buatKonten({ id: "a", status: "siap_posting", updated_at: new Date(2026, 9, 2).toISOString() })];
    const hasil = evaluasiPengingat({ konten, sekarang: SEKARANG });
    expect(hasil[0].jenis).toBe("draft_pustaka");
    expect(hasil[0].detail).toContain("Siap posting");
    expect(hasil[0].detail).toContain("minggu"); // >= 7 hari
  });

  it("terkirim tidak diingat sebagai draft", () => {
    const konten = [buatKonten({ id: "a", status: "terkirim", updated_at: new Date(2026, 9, 2).toISOString() })];
    expect(evaluasiPengingat({ konten, sekarang: SEKARANG })).toHaveLength(0);
  });

  it("updatedAt rusak tidak memunculkan pengingat draft", () => {
    const konten = [buatKonten({ id: "a", status: "draft", updated_at: "rusak" })];
    expect(evaluasiPengingat({ konten, sekarang: SEKARANG })).toHaveLength(0);
  });

  it("batas draft bisa dim override", () => {
    const konten = [buatKonten({ id: "a", status: "draft", updated_at: new Date(2026, 9, 14).toISOString() })];
    // 2 hari usia: masuk kalau batas 1, tidak kalau bawaan 3.
    expect(evaluasiPengingat({ konten, sekarang: SEKARANG, batasDraftHari: 1 })).toHaveLength(1);
    expect(BATAS_DRAFT_HARI).toBe(3);
  });
});

describe("evaluasiPengingat - draft kerja (Buat posting)", () => {
  it("draft kerja lama muncul dengan href /posting/baru", () => {
    const hasil = evaluasiPengingat({
      konten: [],
      draftKerja: { updatedAt: new Date(2026, 9, 12).toISOString(), punyaIsi: true },
      sekarang: SEKARANG,
    });
    expect(hasil).toHaveLength(1);
    expect(hasil[0].jenis).toBe("draft_kerja");
    expect(hasil[0].id).toBe("draft_kerja:draft-posting");
    expect(hasil[0].href).toBe("/posting/baru");
  });

  it("draft kerja baru atau kosong tidak muncul", () => {
    const baru = evaluasiPengingat({
      konten: [],
      draftKerja: { updatedAt: new Date(2026, 9, 15, 20).toISOString(), punyaIsi: true },
      sekarang: SEKARANG,
    });
    const kosong = evaluasiPengingat({
      konten: [],
      draftKerja: { updatedAt: new Date(2026, 9, 2).toISOString(), punyaIsi: false },
      sekarang: SEKARANG,
    });
    expect(baru).toHaveLength(0);
    expect(kosong).toHaveLength(0);
  });
});

describe("evaluasiPengingat - urutan", () => {
  it("lewat paling atas, lalu hari ini, minggu ini, draft", () => {
    const konten = [
      buatKonten({ id: "besok", status: "terjadwal", jadwal_at: new Date(2026, 9, 17, 12).toISOString() }),
      buatKonten({ id: "hari", status: "terjadwal", jadwal_at: new Date(2026, 9, 16, 14).toISOString() }),
      buatKonten({ id: "lewat", status: "terjadwal", jadwal_at: new Date(2026, 9, 10, 12).toISOString() }),
      buatKonten({ id: "draft", status: "draft", updated_at: new Date(2026, 9, 2).toISOString() }),
    ];
    const hasil = evaluasiPengingat({ konten, sekarang: SEKARANG });
    expect(hasil.map((h) => h.jenis)).toEqual([
      "jadwal_lewat",
      "jadwal_hari_ini",
      "jadwal_minggu_ini",
      "draft_pustaka",
    ]);
  });
});

describe("kunciHariLalu", () => {
  it("mengurangi n hari melewati batas bulan dan tahun", () => {
    expect(kunciHariLalu("2026-10-16", 7)).toBe("2026-10-09");
    expect(kunciHariLalu("2026-10-03", 3)).toBe("2026-09-30");
    expect(kunciHariLalu("2026-01-05", 10)).toBe("2025-12-26");
  });

  it("input rusak mengembalikan null, bukan tanggal palsu", () => {
    expect(kunciHariLalu("rusak", 1)).toBeNull();
  });
});

describe("filterTertutup", () => {
  const items: PengingatItem[] = [
    { id: "jadwal_hari_ini:a", jenis: "jadwal_hari_ini", judul: "A", detail: "", href: "/kalender", labelAksi: "" },
    { id: "draft_pustaka:b", jenis: "draft_pustaka", judul: "B", detail: "", href: "/antrian", labelAksi: "" },
  ];

  it("item yang ditutup hari ini disembunyikan", () => {
    const hasil = filterTertutup(items, { "jadwal_hari_ini:a": "2026-10-16" }, "2026-10-16");
    expect(hasil.map((h) => h.id)).toEqual(["draft_pustaka:b"]);
  });

  it("penutupan dari hari lain tidak menyembunyikan apa pun (muncul lagi besok)", () => {
    const hasil = filterTertutup(items, { "draft_pustaka:b": "2026-10-15" }, "2026-10-16");
    expect(hasil).toHaveLength(2);
  });
});
