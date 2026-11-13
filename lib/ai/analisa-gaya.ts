/**
 * Analisa gaya (Gelombang 4): olah tempelan post menjadi bahan persona.
 *
 * Fungsi murni di sini (pemisah post, validasi jumlah minimum, pemotongan
 * gaya_bicara ke batas kolom persona) supaya bisa diuji tanpa AI.
 */

/** Persona bernama membatasi kolom gaya bicara 300 karakter (skema Pengaturan). */
export const MAKS_GAYA_BICARA = 300;
/** Di bawah ini AI diminta jujur menandai keyakinan rendah. */
export const MIN_POST = 3;

/** Pisahkan tempelan menjadi post terpisah (pemisah: baris kosong). */
export function pisahPost(mentah: string): string[] {
  return (mentah ?? "")
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter((p) => p !== "");
}

export interface HasilAnalisaGaya {
  pola_kalimat: string;
  pembuka: string[];
  nada: string[];
  ciri_khas: string[];
  struktur: string;
  catchphrase: string[];
  gaya_bicara: string;
  keyakinan: "tinggi" | "sedang" | "rendah";
  catatan: string;
}

/** Validasi ringan sebelum memanggil AI; kembalikan pesan alasan bila gagal. */
export function periksaTempelan(mentah: string): { ok: true; jumlah: number } | { ok: false; alasan: string } {
  const post = pisahPost(mentah);
  if (post.length === 0) return { ok: false, alasan: "Belum ada post yang ditempel." };
  if (post.length < MIN_POST) {
    return {
      ok: false,
      alasan: `Butuh minimal ${MIN_POST} post (dipisah baris kosong) agar polanya terbaca. Sekarang ${post.length}.`,
    };
  }
  const totalKarakter = post.reduce((a, p) => a + p.length, 0);
  if (totalKarakter < 120) {
    return { ok: false, alasan: "Teks terlalu pendek untuk dianalisa. Tempel post yang lebih lengkap." };
  }
  return { ok: true, jumlah: post.length };
}

/** Potong ke batas kolom persona tanpa memotong kata di tengah. */
export function rapikanGayaBicara(teks: string, maks = MAKS_GAYA_BICARA): string {
  const bersih = (teks ?? "").replace(/\s+/g, " ").trim();
  if (bersih.length <= maks) return bersih;
  const potong = bersih.slice(0, maks);
  const spasi = potong.lastIndexOf(" ");
  return (spasi > maks * 0.6 ? potong.slice(0, spasi) : potong).trim();
}

/** Ringkasan siap tampil untuk UI hasil analisa. */
export function ringkasAnalisa(h: HasilAnalisaGaya): string {
  const bagian = [`Keyakinan: ${h.keyakinan}`, `Nada: ${h.nada.join(", ") || "-"}`];
  if (h.ciri_khas.length > 0) bagian.push(`Ciri khas: ${h.ciri_khas.slice(0, 3).join("; ")}`);
  return bagian.join(" · ");
}
