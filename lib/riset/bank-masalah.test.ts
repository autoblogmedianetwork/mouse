import { describe, expect, it } from "vitest";
import {
  cariBank,
  normalkanTeks,
  tambahKeBank,
  type ItemBank,
} from "./bank-masalah";

const item = (teks: string, kategori = "dapur"): ItemBank => ({
  teks,
  kategori,
  sumber: "riset",
  ditambahkan: "2026-11-10",
});

describe("bank masalah audiens (Fase 3, task 3-D)", () => {
  it("normalkanTeks membuang perbedaan huruf, spasi, dan tanda baca ujung", () => {
    expect(normalkanTeks("  Tutupnya   cepat longgar!  ")).toBe(
      "tutupnya cepat longgar",
    );
  });

  it("tambah masalah baru dan hitung jumlahnya", () => {
    const hasil = tambahKeBank([], ["Tutupnya cepat longgar.", "Muatan kecil"], "tumbler", "review");
    expect(hasil.baru).toBe(2);
    expect(hasil.bank).toHaveLength(2);
    expect(hasil.bank[0].teks).toBe("tutupnya cepat longgar");
    expect(hasil.bank[0].sumber).toBe("review");
  });

  it("duplikat (setelah normalisasi) dilewati", () => {
    const awal = tambahKeBank([], ["Tutupnya cepat longgar"], "tumbler", "review").bank;
    const ulang = tambahKeBank(awal, ["tutupnya   cepat longgar!"], "tumbler", "riset");
    expect(ulang.baru).toBe(0);
    expect(ulang.bank).toHaveLength(1);
  });

  it("teks kosong tidak masuk bank", () => {
    const hasil = tambahKeBank([], ["   ", "..."], "x", "riset");
    expect(hasil.baru).toBe(0);
  });

  it("cariBank menyaring teks dan kategori", () => {
    const bank = [item("tutupnya longgar"), item("wangi tidak tahan", "kecantikan")];
    expect(cariBank(bank, "longgar")).toHaveLength(1);
    expect(cariBank(bank, "kecantikan")).toHaveLength(1);
    expect(cariBank(bank, "")).toHaveLength(2);
  });
});
