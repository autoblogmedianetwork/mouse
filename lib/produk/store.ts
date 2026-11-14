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
  // Field lengkap dari SavedProduct/PenawaranSaved (bentuk longgar: data lama
  // tanpa field ini tetap terbaca).
  harga?: string;
  deskripsi?: string;
  deskripsi_bersih?: string;
  url_referensi?: string;
  // Katalog (fitur baru): thumbnail dari bookmarklet og:image, penanda arsip
  // untuk bulk "sembunyikan", dan nama toko bila berhasil diambil.
  gambar_url?: string;
  arsip?: boolean;
  nama_toko?: string;
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

/** Duplikat satu produk sebagai salinan baru (id & waktu baru, tanpa arsip). */
export function duplikatProduk(
  list: readonly ProdukRingkas[],
  id: string,
): { list: ProdukRingkas[]; salinan: ProdukRingkas | null } {
  const asal = list.find((p) => p.id === id);
  if (!asal) return { list: [...list], salinan: null };
  const salinan: ProdukRingkas = {
    ...asal,
    id: crypto.randomUUID(),
    saved_at: new Date().toISOString(),
    arsip: false,
    nama_internal: (asal.nama_internal ?? "Produk") + " (salinan)",
  };
  return { list: [salinan, ...list], salinan };
}

/** Set flag arsip untuk banyak produk sekaligus (bulk sembunyikan/tayangkan). */
export function ubahArsipMassal(
  list: readonly ProdukRingkas[],
  ids: readonly string[],
  arsip: boolean,
): ProdukRingkas[] {
  const set = new Set(ids);
  return list.map((p) => (set.has(p.id) ? { ...p, arsip } : p));
}

/** Hapus banyak produk sekaligus (bulk hapus). */
export function hapusMassal(
  list: readonly ProdukRingkas[],
  ids: readonly string[],
): ProdukRingkas[] {
  const set = new Set(ids);
  return list.filter((p) => !set.has(p.id));
}
