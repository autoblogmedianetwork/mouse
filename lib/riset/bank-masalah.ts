/**
 * Bank masalah audiens (Fase 3, task 3-D): hasil riset dan review pasar
 * ditampung permanen di localStorage — aset riset milik user yang menumpuk,
 * tidak hilang saat riset ulang. Pola sama dengan lib/konten/store:
 * fungsi murni untuk logika, pemanggil yang menyimpan.
 */
import { bacaDaftar, tulisJson } from "@/lib/storage/kotak";

export const BANK_KEY = "autothreads-bank-masalah";

export type SumberMasalah = "riset" | "review";

export interface ItemBank {
  teks: string;
  kategori: string;
  sumber: SumberMasalah;
  /** ISO date (hanya hari) supaya daftar mudah dibaca. */
  ditambahkan: string;
}

/** Normalisasi untuk dedupe: huruf kecil, spasi rapikan, buang tanda baca ujung. */
export function normalkanTeks(teks: string): string {
  return teks
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?]+$/, "");
}

/**
 * Tambah masalah baru ke bank. Duplikat (setelah normalisasi) dilewati —
 * bank berisi masalah unik, frekuensi tidak dilacak di task ini.
 * Fungsi murni: mengembalikan array baru.
 */
export function tambahKeBank(
  bank: readonly ItemBank[],
  masalahBaru: readonly string[],
  kategori: string,
  sumber: SumberMasalah,
  hariIni = new Date().toISOString().slice(0, 10),
): { bank: ItemBank[]; baru: number } {
  const sudah = new Set(bank.map((item) => item.teks));
  const tambahan: ItemBank[] = [];
  for (const teks of masalahBaru) {
    const bersih = normalkanTeks(teks);
    if (!bersih || sudah.has(bersih)) continue;
    sudah.add(bersih);
    tambahan.push({ teks: bersih, kategori, sumber, ditambahkan: hariIni });
  }
  return { bank: [...bank, ...tambahan], baru: tambahan.length };
}

/** Filter bank berdasarkan kata kunci (teks atau kategori). Fungsi murni. */
export function cariBank(bank: readonly ItemBank[], kataKunci: string): ItemBank[] {
  const q = normalkanTeks(kataKunci);
  if (!q) return [...bank];
  return bank.filter(
    (item) => item.teks.includes(q) || item.kategori.toLowerCase().includes(q),
  );
}

/** Muat bank dari localStorage; bentuk rusak dibuang, tidak pernah crash. */
export function muatBank(): ItemBank[] {
  return bacaDaftar<ItemBank>(BANK_KEY, (entry) => {
    const item = entry as Partial<ItemBank>;
    if (typeof item.teks !== "string" || item.teks.length === 0) return null;
    return {
      teks: item.teks,
      kategori: typeof item.kategori === "string" ? item.kategori : "",
      sumber: item.sumber === "review" ? "review" : "riset",
      ditambahkan: typeof item.ditambahkan === "string" ? item.ditambahkan : "",
    };
  });
}

export function simpanBank(bank: readonly ItemBank[]): void {
  tulisJson(BANK_KEY, bank);
}
