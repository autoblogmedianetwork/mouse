import { describe, expect, it } from "vitest";
import type { ItemBank } from "./bank-masalah";
import { ringkasBank } from "./statistik-bank";

const item = (teks: string, kategori: string, ditambahkan = "2026-11-01"): ItemBank => ({
  teks,
  kategori,
  sumber: "riset",
  ditambahkan,
});

describe("ringkasBank", () => {
  it("menghitung total, kategori terbanyak, dan jumlah bulan ini", () => {
    const bank = [
      item("tas cepat kotor", "fashion", "2026-11-02"),
      item("botol bocor di tas", "rumah", "2026-11-05"),
      item("outfit gerah", "fashion", "2026-10-20"),
    ];
    const hasil = ringkasBank(bank, new Date(2026, 10, 11));

    expect(hasil.total).toBe(3);
    expect(hasil.bulanIni).toBe(2);
    expect(hasil.kategori[0]).toEqual({ kategori: "fashion", jumlah: 2 });
  });

  it("mengelompokkan item tanpa kategori", () => {
    const hasil = ringkasBank([item("masalah tanpa label", "")], new Date(2026, 10, 11));
    expect(hasil.kategori[0]).toEqual({ kategori: "tanpa kategori", jumlah: 1 });
  });

  it("aman untuk bank kosong", () => {
    expect(ringkasBank([])).toEqual({ total: 0, kategori: [], bulanIni: 0 });
  });
});
