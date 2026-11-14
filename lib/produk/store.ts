/**
 * Akses daftar produk tersimpan (localStorage `autothreads-products`).
 * Bentuknya sengaja longgar: hanya field yang dipakai pencarian dan filter tag,
 * supaya data lama tanpa `tag` tetap terbaca.
 */

import { bacaDaftar, tulisJson } from "@/lib/storage/kotak";

export const KEY_PRODUK = "autothreads-products";

export interface ProdukRingkas {
  id: string;
  nama_internal?: string;
  nama?: string;
  varian?: string;
  tag?: string[];
  saved_at?: string;
}

export function muatProduk(): ProdukRingkas[] {
  return bacaDaftar<ProdukRingkas>(KEY_PRODUK, (entry) =>
    typeof entry === "object" &&
    entry !== null &&
    typeof (entry as { id?: unknown }).id === "string"
      ? (entry as ProdukRingkas)
      : null,
  );
}

export function simpanProduk(list: readonly unknown[]): void {
  tulisJson(KEY_PRODUK, list);
}

/** Hapus satu produk berdasarkan id. Mengembalikan daftar baru. */
export function hapusProduk(list: readonly ProdukRingkas[], id: string): ProdukRingkas[] {
  return list.filter((p) => p.id !== id);
}

/** Ganti satu produk (dipakai tombol Simpan setelah Edit). */
export function perbaruiProduk(
  list: readonly ProdukRingkas[],
  id: string,
  perubahan: Partial<ProdukRingkas>,
): ProdukRingkas[] {
  return list.map((p) => (p.id === id ? { ...p, ...perubahan } : p));
}
