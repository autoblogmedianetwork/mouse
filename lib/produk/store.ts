/**
 * Akses daftar produk tersimpan (localStorage `autothreads-products`).
 * Bentuknya sengaja longgar: hanya field yang dipakai pencarian dan filter tag,
 * supaya data lama tanpa `tag` tetap terbaca.
 */

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
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY_PRODUK);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is ProdukRingkas =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as { id?: unknown }).id === "string",
    );
  } catch {
    return [];
  }
}

export function simpanProduk(list: readonly unknown[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY_PRODUK, JSON.stringify(list));
  } catch {
    // penyimpanan penuh/diblokir: data hanya bertahan di sesi ini
  }
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
