import { describe, expect, it } from "vitest";
import {
  AMBANG_DIREKOMENDASIKAN,
  direkomendasikan,
  skorTotal,
  urutkanMenurutSkor,
} from "./skor-peluang";

const skor = (a: number, b: number, c: number, d: number) => ({
  permintaan: a,
  kompetisi: b,
  kemudahan_konten: c,
  potensi_komisi: d,
});

describe("skor peluang (Fase 3, task 3-A)", () => {
  it("memakai skor_total bila tersedia", () => {
    expect(skorTotal({ skor_total: 17, skor: skor(1, 1, 1, 1) })).toBe(17);
  });

  it("menjumlahkan empat dimensi bila skor_total tidak ada", () => {
    expect(skorTotal({ skor: skor(5, 4, 3, 2) })).toBe(14);
  });

  it("data lama tanpa skor dianggap 0, bukan error", () => {
    expect(skorTotal({})).toBe(0);
  });

  it("mengurutkan dari skor tertinggi", () => {
    const daftar = [
      { nama: "rendah", skor_total: 9 },
      { nama: "tinggi", skor_total: 19 },
      { nama: "sedang", skor_total: 14 },
    ];
    expect(urutkanMenurutSkor(daftar).map((x) => x.nama)).toEqual([
      "tinggi",
      "sedang",
      "rendah",
    ]);
  });

  it("skor sama mempertahankan urutan asli (stabil)", () => {
    const daftar = [
      { nama: "pertama", skor_total: 12 },
      { nama: "kedua", skor_total: 12 },
      { nama: "ketiga", skor_total: 12 },
    ];
    expect(urutkanMenurutSkor(daftar).map((x) => x.nama)).toEqual([
      "pertama",
      "kedua",
      "ketiga",
    ]);
  });

  it("tidak mengubah array masukan", () => {
    const daftar = [{ skor_total: 5 }, { skor_total: 15 }];
    urutkanMenurutSkor(daftar);
    expect(daftar[0].skor_total).toBe(5);
  });

  it("ambang rekomendasi 16 ke atas", () => {
    expect(direkomendasikan({ skor_total: AMBANG_DIREKOMENDASIKAN })).toBe(true);
    expect(direkomendasikan({ skor_total: AMBANG_DIREKOMENDASIKAN - 1 })).toBe(false);
  });
});
