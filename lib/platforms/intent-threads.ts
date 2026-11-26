/**
 * Web intent Threads (ADR 0022) — buka komposer Threads dengan teks yang
 * sudah terisi, tanpa API, tanpa App Review, tanpa pengiriman otomatis.
 *
 * Format resmi Meta (docs "Web Intents"):
 *   https://www.threads.com/intent/post?text=...&url=...&tag=...&reply_control=...
 *
 * Heaviliate sengaja HANYA memakai parameter `text`: strategi minggu
 * pertama menaruh link affiliate di BALASAN, bukan di postingan utama,
 * jadi parameter `url` (lampiran link di postingan utama) tidak dipakai.
 * User tetap yang menekan kirim — ini alat bantu tempel, bukan bot.
 */

import { BATAS_PLATFORM } from "./batas";

export type HasilIntent =
  | { ok: true; url: string }
  | { ok: false; alasan: string };

const DASAR_INTENT = "https://www.threads.com/intent/post";

/**
 * Bangun URL intent dari teks status. Teks lebih dari batas Threads
 * ditolak supaya komposer tidak membuka draft yang pasti gagal diposting.
 */
export function bangunIntentThreads(teks: string): HasilIntent {
  const bersih = teks.trim();
  if (!bersih) {
    return { ok: false, alasan: "Teks kosong — tidak ada yang dibuka di Threads." };
  }
  if (bersih.length > BATAS_PLATFORM.threads) {
    return {
      ok: false,
      alasan: `Teks ${bersih.length} karakter, melebihi batas Threads ${BATAS_PLATFORM.threads}.`,
    };
  }
  return {
    ok: true,
    // encodeURIComponent mengikuti contoh resmi Meta (%20, bukan +).
    url: `${DASAR_INTENT}?text=${encodeURIComponent(bersih)}`,
  };
}
