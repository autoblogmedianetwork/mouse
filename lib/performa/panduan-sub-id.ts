/**
 * Panduan teks untuk kode pelacak (sub_id) Shopee Affiliate.
 *
 * Dua fakta dari sumber resmi yang menentukan bentuk teks ini:
 *
 * 1. Format sub_id menurut Pedoman Pembuatan Link Pendek Affiliate Shopee:
 *    `sub_id={value1}-{value2}-{value3}-{value4}-{value5}` — maksimal lima
 *    segmen dipisah tanda hubung. Kode kita (`at-3f9c21`) memakai satu segmen
 *    dengan tanda hubung internal, jadi aman ditaruh di segmen pertama.
 *
 * 2. Tautan affiliate TIDAK boleh diubah atau dibungkus. Pasal 2.6 melarang
 *    mengganti/memodifikasi/membuat turunan tautan tanpa persetujuan tertulis,
 *    dan pasal 6.3(o) melarang masking termasuk pemendek seperti bit.ly/s.id.
 *    Karena itu aplikasi tidak pernah menulis sub_id ke link: kamu yang
 *    menempelkan kodenya di pembuat link Shopee, dan link yang dibagikan tetap
 *    link resmi apa adanya.
 */

export const PANDUAN_SUB_ID = {
  /** Di mana kode ditempel. */
  tempat:
    "Tempel kode ini di kolom Sub ID 1 saat membuat link di platform Shopee Affiliate, lalu salin link jadinya.",
  /** Bentuk kolom sub_id di Shopee. */
  format: "Shopee menerima sampai 5 segmen sub_id dipisah tanda hubung. Kode at-xxxxxx dipakai di segmen pertama.",
  /** Larangan yang paling mudah dilanggar tanpa sadar. */
  larangan:
    "Jangan pernah memendekkan atau membungkus link affiliate (bit.ly, s.id, dsb). Pasal 2.6 dan 6.3(o) melarang mengubah tautan tanpa izin tertulis — komisi bisa hangus.",
} as const;

/** Kode pelacak hanya boleh huruf/angka/tanda hubung, maksimal 30 karakter. */
export function subIdValid(kode: string): boolean {
  return /^[A-Za-z0-9_-]{1,30}$/.test((kode ?? "").trim());
}

/** Rapikan kode sebelum ditempel: buang spasi, jepit 30 karakter. */
export function rapikanSubId(kode: string): string {
  return (kode ?? "").trim().replace(/\s+/g, "").slice(0, 30);
}
