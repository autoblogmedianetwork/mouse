/**
 * Batas karakter per platform output (fitur 9) dan mode output generate.
 *
 * Nilai disimpan di kode dulu: tabel `platforms` memang punya kolom
 * `batas_karakter`, tapi barisnya sengaja kosong di migrasi 0002 dan pembacaan
 * DB untuk state form menambah jeda tanpa keuntungan. Keputusan dicatat di
 * ADR 0008; kalau nanti batas dibaca dari tabel, hanya berkas ini yang berubah.
 */
import { MAX_STATUS_LENGTH } from "@/lib/statuses/validator-500";

export const PLATFORM_IDS = ["threads", "x", "whatsapp_status", "tiktok_caption"] as const;
export type PlatformId = (typeof PLATFORM_IDS)[number];

/** Mode output generate: platform teks, naskah video (prompt 09), atau carousel (prompt 08). */
export const MODE_OUTPUT_IDS = [
  "threads",
  "x",
  "whatsapp_status",
  "tiktok_caption",
  "naskah_video",
  "carousel",
] as const;
export type ModeOutput = (typeof MODE_OUTPUT_IDS)[number];

/** Batas karakter per platform, dicek dari dokumentasi resmi saat fitur dibuat. */
export const BATAS_PLATFORM: Record<PlatformId, number> = {
  threads: 500,
  x: 280,
  whatsapp_status: 700,
  tiktok_caption: 2200,
};

export const LABEL_MODE_OUTPUT: Record<ModeOutput, string> = {
  threads: "Threads",
  x: "X",
  whatsapp_status: "WhatsApp Status",
  tiktok_caption: "Caption TikTok",
  naskah_video: "Naskah video",
  carousel: "Carousel",
};

/** Nama tampilan per platform teks, dipakai prompt dan UI. */
export const LABEL_PLATFORM: Record<PlatformId, string> = {
  threads: "Threads",
  x: "X",
  whatsapp_status: "WhatsApp Status",
  tiktok_caption: "TikTok",
};

/** Batas karakter aman untuk satu platform. Fallback: batas Threads. */
export function batasPlatform(id: PlatformId): number {
  return BATAS_PLATFORM[id] ?? MAX_STATUS_LENGTH;
}

/**
 * Batas yang dipakai editor dan preview untuk satu mode output. Naskah video
 * dan carousel tidak punya batas platform; tetap dibatasi batas Threads supaya
 * jumlah konten per status tetap pendek dan validasi database tidak bisa
 * dilanggar dari UI mana pun. WhatsApp Status (700) dan Caption TikTok (2200)
 * memakai batas platformnya masing-masing; plafon database dinaikkan ke 2200
 * oleh migrasi 0011 (ADR 0020).
 */
export function batasKarakterMode(mode: ModeOutput): number {
  if (mode === "naskah_video" || mode === "carousel") return MAX_STATUS_LENGTH;
  return batasPlatform(mode);
}
