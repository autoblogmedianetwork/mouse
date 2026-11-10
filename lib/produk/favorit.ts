/**
 * Favorit/pin produk (localStorage): produk yang sedang dipush ditaruh di atas
 * daftar. Fungsi murni supaya urutan dan toggle bisa diuji tanpa DOM.
 */

export const KEY_FAVORIT_PRODUK = "autothreads-produk-favorit";

/** Toggle id: tambah kalau belum ada, hapus kalau sudah. */
export function toggleFavorit(list: readonly string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [id, ...list];
}

/** Produk favorit tampil lebih dulu, urutan asli dipertahankan di dalam grup. */
export function urutkanFavorit<T extends { id: string }>(
  produk: readonly T[],
  favorit: readonly string[],
): T[] {
  const set = new Set(favorit);
  return [...produk.filter((p) => set.has(p.id)), ...produk.filter((p) => !set.has(p.id))];
}

export function muatFavorit(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY_FAVORIT_PRODUK);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function simpanFavorit(list: readonly string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY_FAVORIT_PRODUK, JSON.stringify(list));
  } catch {
    // penyimpanan penuh/diblokir: favorit hanya berlaku di sesi ini
  }
}
