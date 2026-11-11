import { describe, expect, it } from "vitest";
import { bandingkanDua, buatSnapshot, simpanSnapshot } from "./banding";

const peluang = (kategori: string, skor: number | null) => ({
  kategori,
  skor_total: skor,
  direkomendasikan: skor !== null && skor >= 16,
});

describe("banding dua niche (power-up Riset)", () => {
  it("snapshot: rata-rata skor dibulatkan 1 desimal, teratas 3", () => {
    const snap = buatSnapshot("Kopi", [
      peluang("A", 18),
      peluang("B", 15),
      peluang("C", 12),
      peluang("D", null),
    ]);
    expect(snap.jumlah).toBe(4);
    expect(snap.skorRata).toBe(15);
    expect(snap.jumlahDirekomendasikan).toBe(1);
    expect(snap.teratas).toEqual(["A", "B", "C"]);
  });

  it("simpan: niche sama ditimpa, maks 2", () => {
    const a = buatSnapshot("Kopi", [peluang("A", 18)]);
    const b = buatSnapshot("Kopi", [peluang("A", 10)]);
    const c = buatSnapshot("Skincare", [peluang("A", 14)]);
    const list = simpanSnapshot(simpanSnapshot([], a), b);
    expect(list).toHaveLength(1);
    expect(list[0].skorRata).toBe(10);
    expect(simpanSnapshot(list, c)).toHaveLength(2);
  });

  it("banding: pemenang skor rata-rata + jumlah rekomendasi + teratas", () => {
    const a = buatSnapshot("Kopi", [peluang("Alat kopi", 18), peluang("Biji", 16)]);
    const b = buatSnapshot("Skincare", [peluang("Serum", 12), peluang("Masker", 13)]);
    const hasil = bandingkanDua(a, b);
    expect(hasil.pemenang).toBe("Kopi");
    expect(hasil.baris.some((t) => t.includes("menang skor rata-rata"))).toBe(true);
    expect(hasil.baris.some((t) => t.includes("Alat kopi"))).toBe(true);
  });

  it("setara -> pesan netral tanpa pemenang palsu", () => {
    const a = buatSnapshot("Kopi", [peluang("A", 15)]);
    const b = buatSnapshot("Skincare", [peluang("B", 15)]);
    const hasil = bandingkanDua(a, b);
    expect(hasil.pemenang).toBeNull();
    expect(hasil.baris.some((t) => t.includes("setara"))).toBe(true);
  });
});
