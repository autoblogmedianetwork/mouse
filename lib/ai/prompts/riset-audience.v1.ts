/**
 * Prompt 10 — riset audiens (tahap 1 Content Machine, docs/content-machine.md).
 *
 * Versi: v1. Jangan menimpa versi lama; buat v2 jika isi berubah (AGENTS rule 13).
 *
 * Keluarannya 10 masalah audiens, masing-masing dengan situasi pemantik,
 * contoh produk Shopee yang relevan, dan alasan kenapa produk itu cocok.
 * Hasil ini yang menjadi bahan prompt peluang produk (tahap 2), bukan
 * percakapan lepas di ChatGPT.
 */
export const PROMPT_VERSION = "riset-audience.v1";

import { ATURAN_BAHASA } from "@/lib/ai/gaya-bahasa";

export interface RisetAudiensInput {
  niche: string;
  audiens: string;
}

export function buildRisetAudiensPrompt(input: RisetAudiensInput): string {
  return `Kamu market researcher untuk affiliate Shopee yang memasarkan produk lewat Threads berbahasa Indonesia.

Niche: ${input.niche}
Target audiens: ${input.audiens}

Tugasmu: temukan tepat 10 masalah, kebutuhan, keinginan, atau situasi sehari-hari yang paling mungkin membuat audiens ini mencari atau membeli produk.

Untuk setiap item isi:
- "masalah": satu kalimat pendek memakai kata-kata audiens sendiri, bukan bahasa pemasaran.
- "situasi": kapan atau kenapa masalah itu muncul (mis. pagi sebelum berangkat kerja, akhir bulan, saat anak rewel).
- "produk_contoh": 1-3 JENIS produk Shopee yang relevan, nama generik tanpa merek (mis. "wadah makanan kaca kedap udara"), bukan nama toko dan bukan tautan.
- "alasan": kenapa jenis produk itu menyelesaikan masalah tersebut, maksimal dua kalimat.

Aturan:
- Sebar 10 item: minimal 3 soal rutinitas harian, minimal 2 soal uang/waktu, minimal 2 soal kenyamanan atau kesehatan, sisanya bebas.
- Jangan mengarang harga, rating, jumlah terjual, atau nama merek.
- Jangan mengulang masalah yang sama dengan kata lain.
- Semua teks berbahasa Indonesia.

${ATURAN_BAHASA}

Balas HANYA dalam JSON valid, tanpa teks lain dan tanpa markdown. Format:
{
  "ringkasan": "2-3 kalimat: pola masalah yang paling menonjol dari audiens ini",
  "masalah": [
    {
      "masalah": "string",
      "situasi": "string",
      "produk_contoh": ["string"],
      "alasan": "string"
    }
  ]
}`;
}
