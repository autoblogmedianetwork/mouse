/**
 * Tag/label produk (mis. "ramah pemula", "komisi besar") + filter lokal.
 * Tag disimpan sebagai array huruf kecil tanpa tanda baca berlebih.
 */

export const MAKS_TAG = 5;
export const MAKS_PANJANG_TAG = 24;

/** "Ramah Pemula, komisi besar," -> ["ramah pemula", "komisi besar"]. */
export function parseTag(teks: string): string[] {
  const hasil: string[] = [];
  const sudah = new Set<string>();
  for (const bagian of teks.split(",")) {
    const tag = bagian
      .trim()
      .toLowerCase()
      .replace(/^#\s*/, "")
      .replace(/\s+/g, " ")
      .slice(0, MAKS_PANJANG_TAG)
      .trim();
    if (tag === "" || sudah.has(tag)) continue;
    sudah.add(tag);
    hasil.push(tag);
    if (hasil.length >= MAKS_TAG) break;
  }
  return hasil;
}

/** Semua tag unik dari kumpulan produk, terurut abjad. */
export function semuaTag(produk: readonly { tag?: string[] }[]): string[] {
  const set = new Set<string>();
  for (const p of produk) for (const t of p.tag ?? []) set.add(t);
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** True bila produk punya semua tag yang dipilih (filter AND). */
export function cocokTag(produk: { tag?: string[] }, dipilih: readonly string[]): boolean {
  if (dipilih.length === 0) return true;
  const punya = new Set(produk.tag ?? []);
  return dipilih.every((t) => punya.has(t));
}
