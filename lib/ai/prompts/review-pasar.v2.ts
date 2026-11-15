/**
 * Prompt 12 — review pasar (Fase 3, task 3-C).
 *
 * Versi: v2. Perubahan dari v1 (v1 TIDAK diubah, AGENTS rule 13):
 * - WAJIB parafrase: hasil tidak boleh menyalin kalimat pembeli.
 * - Larangan menyalin lebih dari 8 kata berturut-turut dari satu review.
 * - Larangan memuat data pribadi (nama, nomor pesanan, alamat, nomor HP).
 * - Kosakata dibatasi ke potongan pendek (maks 6 kata), bukan kutipan utuh.
 *
 * Alasan: teks pembeli adalah data pribadi. Yang layak disimpan hanyalah
 * parafrase + kategori, bukan kutipan panjang.
 */
export const PROMPT_VERSION = "review-pasar.v2";

import { ATURAN_BAHASA } from "@/lib/ai/gaya-bahasa";

export interface ReviewPasarInput {
  niche: string;
  audiens: string;
  /** Teks review mentah yang ditempel user (sudah dianonimkan). */
  reviewMentah: string;
}

export function buildReviewPasarPrompt(input: ReviewPasarInput): string {
  return `Kamu strategist affiliate Shopee untuk konten Threads berbahasa Indonesia.

Niche: ${input.niche}
Target audiens: ${input.audiens}

Berikut review pembeli dari marketplace yang ditempel user (bisa berantakan, bintang ditulis seperti "5" atau "bintang 5"):

=== REVIEW MENTAH ===
${input.reviewMentah}
=== AKHIR REVIEW ===

Tugasmu:
1. Klasifikasikan setiap review menjadi "keluhan", "pujian", atau "campuran". Review berisi "bagus, tapi ..." adalah "campuran".
2. Ekstrak pola yang BERULANG (muncul lebih sekali), bukan keluhan unik satu orang.

Keluaran:
- "klasifikasi": daftar per review yang bisa dibedakan — {"ringkas": inti review yang SUDAH DIPARAFRASE, maksimal 10 kata, "jenis": "keluhan | pujian | campuran", "bintang": angka atau null kalau tidak tertulis}.
- "masalah": masalah nyata yang berulang, kalimat pendek siap dipakai sebagai masalah audiens (maksimal 8).
- "angle": sudut jualan yang TERBUKTI dari pujian berulang (maksimal 6).
- "kosakata": potongan frasa pendek gaya bahasa pembeli yang enak dipakai (maksimal 10, MAKSIMAL 6 KATA per potongan).
- "red_flag": klaim yang harus DIHINDARI karena bertentangan dengan keluhan nyata (maksimal 5).
- "kekurangan_asli": kekurangan produk yang disebut pembeli — untuk konten yang jujur, bukan karangan (maksimal 5).

ATURAN PRIVASI DAN PARAFRASE (WAJIB):
- Tulis ulang dengan kata-katamu sendiri. DILARANG menyalin kalimat pembeli apa adanya.
- DILARANG menyalin lebih dari 8 kata berturut-turut dari satu review, di kolom mana pun.
- "kosakata" hanya potongan pendek (maksimal 6 kata) yang menunjukkan gaya bicara, bukan kalimat utuh.
- Buang semua data pribadi: nama orang, nama toko, nomor pesanan, nomor HP, alamat, kota, nama kurir.
- Jangan menyebut nama orang atau kota sama sekali.
- Kalau sebuah review hanya berisi data pribadi tanpa keluhan/pujian, lewati saja.

Aturan isi:
- Jangan menambah masalah yang tidak tertulis di review.
- Bahasa boleh tidak baku, tapi tetap hasil tulis ulangmu sendiri.

${ATURAN_BAHASA}

Balas HANYA dalam JSON valid, tanpa teks lain dan tanpa markdown. Format:
{
  "klasifikasi": [
    { "ringkas": "string", "jenis": "keluhan | pujian | campuran", "bintang": 5 }
  ],
  "masalah": ["string"],
  "angle": ["string"],
  "kosakata": ["string"],
  "red_flag": ["string"],
  "kekurangan_asli": ["string"]
}`;
}
