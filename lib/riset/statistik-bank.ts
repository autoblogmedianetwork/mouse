/**
 * Statistik bank masalah (Level 2, tanpa API): berapa masalah tersimpan,
 * kategori mana yang paling sering muncul, dan berapa yang masuk bulan ini.
 * Fungsi murni supaya bisa diuji tanpa DOM.
 */
import type { ItemBank } from "./bank-masalah";

export interface StatistikBank {
  total: number;
  /** Kategori diurutkan dari yang paling banyak; tanpa kategori jadi satu grup. */
  kategori: { kategori: string; jumlah: number }[];
  bulanIni: number;
}

export function ringkasBank(bank: readonly ItemBank[], sekarang = new Date()): StatistikBank {
  const perKategori = new Map<string, number>();
  const bulan = `${sekarang.getFullYear()}-${String(sekarang.getMonth() + 1).padStart(2, "0")}`;
  let bulanIni = 0;

  for (const item of bank) {
    const kategori = item.kategori.trim() || "tanpa kategori";
    perKategori.set(kategori, (perKategori.get(kategori) ?? 0) + 1);
    if (item.ditambahkan.startsWith(bulan)) bulanIni += 1;
  }

  return {
    total: bank.length,
    kategori: [...perKategori.entries()]
      .map(([kategori, jumlah]) => ({ kategori, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah || a.kategori.localeCompare(b.kategori)),
    bulanIni,
  };
}
