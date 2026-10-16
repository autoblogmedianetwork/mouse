import { charLength } from "@/lib/statuses/validator-500";

/**
 * Helper Disclosure Affiliate Otomatis (Tahap 5)
 *
 * Menambahkan disclosure seperti #iklan atau #affiliate di akhir status terakhir,
 * dengan jaminan karakter tidak melebihi batas platform (Threads: 500, X: 280).
 */

export const DEFAULT_DISCLOSURE = "#iklan #affiliate";
export const SHORT_DISCLOSURE = "#iklan";

/**
 * Cek apakah teks sudah memiliki tag disclosure affiliate.
 */
export function apakahSudahAdaDisclosure(teks: string): boolean {
  return /#(iklan|affiliate|ads|sponsored)\b/i.test(teks);
}

/**
 * Sisipkan tag disclosure ke dalam satu status teks dengan menjaga batas karakter platform.
 */
export function sisipkanDisclosure(teks: string, batasKarakter: number = 500): string {
  const trimmed = teks.trim();
  if (!trimmed) return DEFAULT_DISCLOSURE;
  if (apakahSudahAdaDisclosure(trimmed)) return trimmed;

  // Coba tambahkan dengan pemisah dua baris baru
  const opsiLengkapDuaBaris = `${trimmed}\n\n${DEFAULT_DISCLOSURE}`;
  if (charLength(opsiLengkapDuaBaris) <= batasKarakter) {
    return opsiLengkapDuaBaris;
  }

  // Coba dengan pemisah satu baris baru
  const opsiLengkapSatuBaris = `${trimmed}\n${DEFAULT_DISCLOSURE}`;
  if (charLength(opsiLengkapSatuBaris) <= batasKarakter) {
    return opsiLengkapSatuBaris;
  }

  // Coba dengan tag lebih pendek: #iklan
  const opsiPendekSatuBaris = `${trimmed}\n${SHORT_DISCLOSURE}`;
  if (charLength(opsiPendekSatuBaris) <= batasKarakter) {
    return opsiPendekSatuBaris;
  }

  // Jika teks hampir penuh, potong beberapa karakter terakhir di batas kata secara anggun
  const ruangDibutuhkan = charLength(SHORT_DISCLOSURE) + 2; // spasi/newline + tag
  const maksTeks = batasKarakter - ruangDibutuhkan;
  const dipotong = trimmed.slice(0, Math.max(0, maksTeks)).trimEnd();

  return `${dipotong}\n${SHORT_DISCLOSURE}`;
}

/**
 * Terapkan disclosure affiliate pada status terakhir dari rangkaian utas/thread.
 */
export function terapkanDisclosureUtas(
  statuses: string[],
  batasKarakter: number = 500,
  aktif: boolean = true,
): string[] {
  if (!aktif || statuses.length === 0) return statuses;
  const hasil = [...statuses];
  const idxTerakhir = hasil.length - 1;
  hasil[idxTerakhir] = sisipkanDisclosure(hasil[idxTerakhir], batasKarakter);
  return hasil;
}
