import { describe, expect, it } from "vitest";
import {
  AWALAN_KUNCI,
  KELOMPOK_DATA,
  formatByte,
  kunciKelompok,
  semuaKunciHeaviliate,
  ukuranKelompok,
} from "./hapus-data";

const STORAGE = [
  "autothreads-konten",
  "autothreads-riwayat-kirim",
  "autothreads-products",
  "autothreads-bank-masalah",
  "autothreads-persona-bernama",
  "autothreads-tag-shopee-abc123",
  "autothreads-tag-shopee-def456",
  "autothreads-pengaturan",
  "halaman-lain",
  "supabase.auth.token",
];

describe("semuaKunciHeaviliate", () => {
  it("hanya mengambil kunci berawalan autothreads-", () => {
    const hasil = semuaKunciHeaviliate(STORAGE);
    expect(hasil.every((k) => k.startsWith(AWALAN_KUNCI))).toBe(true);
    expect(hasil).not.toContain("halaman-lain");
    expect(hasil).not.toContain("supabase.auth.token");
    expect(hasil.length).toBe(8);
  });
});

describe("kunciKelompok", () => {
  it("mengambil kunci tetap milik kelompok", () => {
    const konten = KELOMPOK_DATA.find((k) => k.id === "konten")!;
    expect(kunciKelompok(konten, STORAGE)).toEqual([
      "autothreads-konten",
      "autothreads-riwayat-kirim",
    ]);
  });

  it("persona ikut mengambil awalan tag-shopee dinamis", () => {
    const persona = KELOMPOK_DATA.find((k) => k.id === "persona")!;
    expect(kunciKelompok(persona, STORAGE)).toEqual([
      "autothreads-persona-bernama",
      "autothreads-tag-shopee-abc123",
      "autothreads-tag-shopee-def456",
    ]);
  });

  it("tidak pernah mengembalikan kunci milik aplikasi lain", () => {
    for (const kelompok of KELOMPOK_DATA) {
      const hasil = kunciKelompok(kelompok, STORAGE);
      expect(hasil.every((k) => k.startsWith(AWALAN_KUNCI))).toBe(true);
    }
  });
});

describe("ukuranKelompok & formatByte", () => {
  it("menghitung byte dari kunci + nilai", () => {
    const konten = KELOMPOK_DATA.find((k) => k.id === "konten")!;
    const baca = (k: string) => (k === "autothreads-konten" ? "abcde" : null);
    // ("autothreads-konten"=18 + "abcde"=5) * 2 = 46, ditambah kunci kosong
    // "autothreads-riwayat-kirim" (25) * 2 = 50 -> total 96.
    expect(ukuranKelompok(konten, baca, STORAGE)).toBe(96);
  });

  it("formatByte memakai satuan yang masuk akal", () => {
    expect(formatByte(500)).toBe("500 B");
    expect(formatByte(2048)).toBe("2.0 KB");
    expect(formatByte(3 * 1024 * 1024)).toBe("3.00 MB");
  });
});

describe("data konfigurasi", () => {
  it("setiap kelompok punya id unik, label, dan minimal satu kunci", () => {
    const id = new Set(KELOMPOK_DATA.map((k) => k.id));
    expect(id.size).toBe(KELOMPOK_DATA.length);
    for (const k of KELOMPOK_DATA) {
      expect(k.label.length).toBeGreaterThan(0);
      expect(k.kunci.length).toBeGreaterThan(0);
      expect(k.kunci.every((c) => c.startsWith(AWALAN_KUNCI))).toBe(true);
    }
  });

  it("tidak ada kunci yang dipakai dua kelompok sekaligus", () => {
    const terpakai = new Map<string, string>();
    for (const k of KELOMPOK_DATA) {
      for (const c of k.kunci) {
        expect(terpakai.get(c) ?? k.id).toBe(k.id);
        terpakai.set(c, k.id);
      }
    }
  });
});
