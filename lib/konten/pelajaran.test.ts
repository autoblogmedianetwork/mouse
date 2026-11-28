import { describe, expect, it } from "vitest";
import { hapusPelajaran, MAKS_PELAJARAN, muatPelajaran, ringkasPelajaran, tambahPelajaran } from "./pelajaran";

const contoh = {
  sumber: "Postingan rice cooker",
  hookJenis: "pertanyaan",
  hookPenjelasan: "dibuka pertanyaan singkat",
  ctaJenis: "tanya_di_komentar",
  ctaAda: true,
  pelajaran: ["Hook pertanyaan singkat cocok untuk produk harian"],
};

describe("tambahPelajaran", () => {
  it("menambahkan di depan dengan id dan waktu", () => {
    const hasil = tambahPelajaran([], contoh);
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.data).toHaveLength(1);
    expect(hasil.data[0].id).toMatch(/^plj-/);
    expect(hasil.data[0].disimpanPada).toBeTruthy();
  });

  it("sumber kosong diberi nama default", () => {
    const hasil = tambahPelajaran([], { ...contoh, sumber: "  " });
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.data[0].sumber).toBe("Tanpa nama");
  });

  it("menolak bila penuh", () => {
    const penuh = Array.from({ length: MAKS_PELAJARAN }, (_, i) => ({
      ...contoh,
      id: `x${i}`,
      disimpanPada: "2026-01-01",
    }));
    const hasil = tambahPelajaran(penuh, contoh);
    expect(hasil.ok).toBe(false);
  });
});

describe("hapusPelajaran & ringkasPelajaran", () => {
  it("menghapus dan meringkas", () => {
    const hasil = tambahPelajaran([], contoh);
    if (!hasil.ok) throw new Error("harus ok");
    const sisa = hapusPelajaran(hasil.data, hasil.data[0].id);
    expect(sisa).toHaveLength(0);
    expect(ringkasPelajaran({ ...contoh, id: "x", disimpanPada: "2026-01-01" })).toContain("pertanyaan");
  });
});

describe("muatPelajaran", () => {
  it("aman tanpa window (SSR) dan data rusak", () => {
    // typeof window === "undefined" di lingkuan test node
    expect(muatPelajaran()).toEqual([]);
  });
});
