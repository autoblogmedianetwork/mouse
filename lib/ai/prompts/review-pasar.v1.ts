/**
 * Prompt 12 — review pasar (Fase 3, task 3-C).
 *
 * Versi: v1. Jangan menimpa versi lama; buat v2 jika isi berubah (AGENTS rule 13).
 *
 * User menempel 5-10 review marketplace (disarankan campuran: 5 keluhan 1-2
 * bintang + 5 pujian 4-5 bintang). AI mengklasifikasi tiap review lalu
 * mengekstrak: masalah berulang, angle yang terbukti, kosakata asli pembeli,
 * dan klaim/red flag yang harus dihindari. Nama pembeli dibuang di input.
 */
export const PROMPT_VERSION = "review-pasar.v1";

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
2. Ekstrak pola yang BERULANG (muncul lebih dari sekali), bukan keluhan unik satu orang.

Keluaran:
- "klasifikasi": daftar per review yang bisa dibedakan — {"ringkas": inti review dalam maksimal 10 kata, "jenis": "keluhan | pujian | campuran", "bintang": angka atau null kalau tidak tertulis}.
- "masalah": masalah nyata yang berulang, kalimat pendek siap dipakai sebagai masalah audiens (maksimal 8).
- "angle": sudut jualan yang TERBUKTI dari pujian berulang (maksimal 6).
- "kosakata": kata/kalimat pendek ASLI pembeli yang enak dikutip di konten (maksimal 10), salin gaya bahasanya.
- "red_flag": klaim yang harus DIHINDARI karena bertentangan dengan keluhan nyata (maksimal 5).
- "kekurangan_asli": kekurangan produk yang disebut pembeli — untuk konten yang jujur, bukan karangan (maksimal 5).

Aturan:
- Jangan menambah masalah yang tidak tertulis di review.
- Kosakata disalin apa adanya, boleh tidak baku.
- Nama orang/city tidak perlu disebut.

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
