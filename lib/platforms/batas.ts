/**
 * Batas karakter per platform output (fitur 9) dan mode output generate.
 *
 * Nilai disimpan di kode dulu: tabel `platforms` memang punya kolom
 * `batas_karakter`, tapi barisnya sengaja kosong di migrasi 0002 dan pembacaan
 * DB untuk state form menambah jeda tanpa keuntungan. Keputusan dicatat di
 * ADR 0008; kalau nanti batas dibaca dari tabel, hanya berkas ini yang berubah.
 */
import { MAX_STATUS_LENGTH } from "@/lib/statuses/validator-500";

export const PLATFORM_IDS = ["threads", "x"] as const;
export type PlatformId = (typeof PLATFORM_IDS)[number];

/** Mode output generate: platform teks, naskah video (prompt 09), atau carousel (prompt 08). */
export const MODE_OUTPUT_IDS = ["threads", "x", "naskah_video", "carousel"] as const;
export type ModeOutput = (typeof MODE_OUTPUT_IDS)[number];

/** Batas karakter per platform, dicek dari dokumentasi resmi saat fitur dibuat. */
export const BATAS_PLATFORM: Record<PlatformId, number> = {
  threads: 500,
  x: 280,
};

export const LABEL_MODE_OUTPUT: Record<ModeOutput, string> = {
  threads: "Threads",
  x: "X",
  naskah_video: "Naskah video",
  carousel: "Carousel",
};

/** Batas karakter aman untuk satu platform. Fallback: batas Threads. */
export function batasPlatform(id: PlatformId): number {
  return BATAS_PLATFORM[id] ?? MAX_STATUS_LENGTH;
}

/**
 * Batas yang dipakai editor dan preview untuk satu mode output. Naskah video
 * dan carousel tidak punya batas platform X; tetap dibatasi batas Threads supaya validasi
 * database (maksimal 500) tidak bisa dilanggar dari UI mana pun.
 */
export function batasKarakterMode(mode: ModeOutput): number {
  return mode === "x" ? batasPlatform("x") : MAX_STATUS_LENGTH;
}
