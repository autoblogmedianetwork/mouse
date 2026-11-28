import { describe, expect, it } from "vitest";
import {
  buatBalasanPribadi,
  hapusBalasanPribadi,
  tambahBalasanPribadi,
} from "./bank-balasan-pribadi";

describe("buatBalasanPribadi", () => {
  it("menerima balasan valid dan memberi id unik", () => {
    const a = buatBalasanPribadi("Setuju", "Setuju banget, saya juga pernah.");
    const b = buatBalasanPribadi("Setuju", "Setuju banget, saya juga pernah.");
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    if (a.ok && b.ok) expect(a.data.id).not.toBe(b.data.id);
  });

  it("menolak judul pendek, teks kosong, dan teks >500", () => {
    expect(buatBalasanPribadi("a", "teks yang cukup panjang").ok).toBe(false);
    expect(buatBalasanPribadi("Judul", "  ").ok).toBe(false);
    expect(buatBalasanPribadi("Judul", "a".repeat(501)).ok).toBe(false);
  });
});

describe("tambahBalasanPribadi", () => {
  it("menambahkan dan membatasi 30 entri", () => {
    const satu = tambahBalasanPribadi([], "Judul", "Teks balasan saya.");
    expect(satu.ok).toBe(true);
    const penuh = Array.from({ length: 30 }, (_, i) => ({
      id: `x${i}`,
      judul: `J${i}`,
      teks: "teks",
    }));
    const gagal = tambahBalasanPribadi(penuh, "Judul", "Teks balasan saya.");
    expect(gagal.ok).toBe(false);
  });
});

describe("hapusBalasanPribadi", () => {
  it("menghapus berdasarkan id", () => {
    const daftar = [
      { id: "a", judul: "A", teks: "teks" },
      { id: "b", judul: "B", teks: "teks" },
    ];
    expect(hapusBalasanPribadi(daftar, "a")).toEqual([{ id: "b", judul: "B", teks: "teks" }]);
  });
});
