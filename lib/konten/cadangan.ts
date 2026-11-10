/**
 * Pengingat cadangan mingguan (tanpa server): aplikasi tidak menyinkronkan apa
 * pun, jadi user perlu diingatkan mengunduh cadangan JSON sendiri. Modul ini
 * hanya menghitung kapan pengingat layak muncul; komponen yang membaca dan
 * menulis localStorage.
 */

export const KEY_CADANGAN_TERAKHIR = "autothreads-cadangan-terakhir";
export const BATAS_CADANGAN_HARI = 7;

/**
 * True bila belum pernah mencadangkan atau sudah lewat BATAS_CADANGAN_HARI.
 * Timestamp rusak dianggap "belum pernah" supaya pengingat tidak hilang diam.
 */
export function perluCadangan(terakhir: string | null, sekarang = Date.now()): boolean {
  if (!terakhir) return true;
  const t = Date.parse(terakhir);
  if (!Number.isFinite(t)) return true;
  return sekarang - t >= BATAS_CADANGAN_HARI * 86_400_000;
}

/** Berapa hari sejak cadangan terakhir; null bila belum pernah/rusak. */
export function usiaCadanganHari(terakhir: string | null, sekarang = Date.now()): number | null {
  if (!terakhir) return null;
  const t = Date.parse(terakhir);
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.floor((sekarang - t) / 86_400_000));
}
