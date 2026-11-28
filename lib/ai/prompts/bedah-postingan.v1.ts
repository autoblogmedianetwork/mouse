/**
 * Prompt 15 — bedah struktur satu postingan orang lain (riset 17 Nov,
 * ide #4 "belajar dari postingan orang lain").
 *
 * Versi: v1 (baru). Berbeda dari analisa-gaya.v2: yang itu menyusun
 * DESKRIPSI gaya bicara dari 3-5 post untuk persona; yang ini MEMBEDAH
 * SATU postingan jadi anatomi yang bisa dipelajari — jenis hook, jenis
 * CTA, panjang, urutan bagian, dan 1-3 pelajaran yang bisa diterapkan.
 * Keluarannya edukasi, bukan naskah siap posting (Lab = draft-only).
 */
export const PROMPT_VERSION = "bedah-postingan.v1";

import { ATURAN_BAHASA } from "@/lib/ai/gaya-bahasa";

export interface BedahPostinganInput {
  /** Teks satu postingan yang ditempel user (bisa utas, dipisah baris kosong). */
  postingan: string;
}

export function buildBedahPostinganPrompt(input: BedahPostinganInput): string {
  return `Kamu guru menulis konten affiliate Threads berbahasa Indonesia.

Berikut SATU postingan publik yang ditempel user. Tugasmu MEMBEDAH
ANATOMINYA supaya user belajar strukturnya — bukan meniru kalimatnya.

=== POSTINGAN ===
${input.postingan}
=== AKHIR POSTINGAN ===

Keluaran (JSON):
- "hook": { "jenis": salah satu dari ["pertanyaan", "masalah_relatif", "pernyataan_mengejutkan", "lainnya"], "penjelasan": maksimal 120 karakter, tulis BENTUKNYA ("dibuka dengan angka spesifik"), BUKAN kalimatnya }
- "cta": { "ada": true/false, "jenis": salah satu dari ["beli_sekarang", "cek_bio", "tanya_di_komentar", "simpan_atau_bagikan", "tanya_pengalaman", "tidak_ada"], "penjelasan": maksimal 100 karakter }
- "panjang_karakter": angka
- "jumlah_bagian": angka (berapa gagasan/paragraf terpisah)
- "struktur": array 2-5 string, urutan bagian dengan KATA DESKRIPSI ("masalah", "cerita pengalaman", "bukti angka", "ajakan") — bukan kutipan
- "pelajaran": array 1-3 string, masing-masing maksimal 140 karakter: pelajaran KONKRET yang bisa diterapkan user di niche-nya ("hook angka spesifik cocok untuk produk dapur")
- "kejujuran": "baik" | "ragu" — apakah postingan ini jujur (tidak melebih-lebihkan klaim)? Bila "ragu", jelaskan singkat di "peringatan"
- "peringatan": kosong atau maksimal 140 karakter

ATURAN (WAJIB):
- DILARANG menyalin lebih dari 5 kata berturut-turut dari postingan. Semua
  keluaran adalah DESKRIPSI pola, bukan kutipan.
- JANGAN menyebut nama orang, akun, atau merek yang muncul di postingan.
- Bila postingan terlalu pendek (<40 karakter), tetap bedah dengan jujur
  di "peringatan" bahwa materinya terlalu tipis untuk dipelajari.
- Bila postingan memuat klaim kesehatan/keuangan yang melebih-lebihkan,
  tandai di "kejujuran": "ragu" — jangan dijadikan teladan.

${ATURAN_BAHASA}

Balas HANYA JSON valid tanpa penjelasan di luar JSON.`;
}
