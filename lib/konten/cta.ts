/**
 * Template CTA pribadi (bank ide #3) — variasi penutup yang konsisten.
 *
 * Konsistensi CTA membangun kebiasaan audiens: mereka tahu "kalau mau
 * beli, lihat balasan". Semua CTA memakai suara Pak Slem (sopan, tidak
 * menjual keras) dan menghormati strategi link-di-balasan.
 *
 * v1 (draft, bisa dikembangkan): daftar bawaan tetap + penggabungan yang
 * menghormati batas 500 karakter. Manajemen CTA milik user menyusul.
 */

export interface CtaPribadi {
  id: string;
  label: string;
  teks: string;
}

export const CTA_BAWAAN: readonly CtaPribadi[] = [
  {
    id: "keranjang",
    label: "Keranjang kuning",
    teks: "Kalau kamu juga mau, cek keranjang kuning di balasan ya — link dan harganya saya taruh di sana.",
  },
  {
    id: "tanya",
    label: "Tanya saja",
    teks: "Ada yang mau ditanyakan soal ini? Tanya saja di komentar — saya jawab semua semampu saya.",
  },
  {
    id: "simpan",
    label: "Simpan dulu",
    teks: "Kalau sedang tidak butuh, simpan saja postingannya — saya sering begitu juga, siapa tahu nanti kamu perlu.",
  },
  {
    id: "cerita",
    label: "Ceritakan pengalamanmu",
    teks: "Bagaimana dengan kamu? Pernah punya masalah yang sama? Cerita di komentar ya — saya senang baca pengalaman orang lain.",
  },
  {
    id: "ikuti",
    label: "Ikuti untuk tips lain",
    teks: "Ikuti saya kalau mau tips rumah tangga lain yang sudah saya coba sendiri dulu — bukan teori.",
  },
] as const;

export type HasilGabungCta =
  | { ok: true; teks: string; panjang: number }
  | { ok: false; galat: string };

/**
 * Gabungkan teks utama dengan CTA. Menolak bila hasil melebihi batas —
 * user perlu tahu sebelum menyalin, bukan setelah gagal posting.
 */
export function gabungCta(teksUtama: string, cta: string, batas = 500): HasilGabungCta {
  const utama = teksUtama.trimEnd();
  const penutup = cta.trim();
  if (!utama) return { ok: false, galat: "Teks utama kosong." };
  if (!penutup) return { ok: false, galat: "CTA kosong." };
  const teks = `${utama}\n\n${penutup}`;
  if (teks.length > batas) {
    return {
      ok: false,
      galat: `Gabungan ${teks.length} karakter, melebihi batas ${batas}. Pangkas teks atau pilih CTA yang lebih pendek.`,
    };
  }
  return { ok: true, teks, panjang: teks.length };
}
