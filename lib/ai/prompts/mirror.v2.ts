/**
 * Prompt 24 — mirror competitor (manual, tanpa scraping) (Gelombang 3).
 * Versi: v2. Perubahan dari v1 (v1 TIDAK diubah, AGENTS rule 13):
 * - Larangan eksplisit menyalin frasa: maksimal 5 kata berturut-turut.
 * - Rincian "pola" yang boleh diambil vs "isi" yang dilarang.
 * - Larangan memakai nama/tanda pengenal kreator asli.
 */
export const PROMPT_VERSION = "mirror.v2";

import { ATURAN_BAHASA } from "@/lib/ai/gaya-bahasa";

export interface MirrorInput {
  kontenKompetitor: string;
  namaProduk?: string;
}

export function buildMirrorPrompt(input: MirrorInput): string {
  return `Buat konten Threads yang terinspirasi dari POLA GAYA kompetitor berikut, tetapi seluruh kalimatnya orisinal dan jujur. Menyalin teks kreator lain dilarang.

Konten kompetitor (referensi POLA saja, bukan bahan salin):
${input.kontenKompetitor}

${input.namaProduk ? `Produk Anda: ${input.namaProduk}` : ""}

Yang BOLEH diambil (pola):
- panjang kalimat dan ritmenya
- nada bicara (santai, tegas, lucu, dsb.)
- urutan bagian (pembuka, isi, penutup)
- jenis pembuka (pertanyaan, pengakuan, angka, dsb.)
- cara menutup dengan ajakan

Yang DILARANG diambil (isi):
- menyalin kalimat atau frasa. Maksimal 5 kata berturut-turut yang sama dengan referensi.
- memakai nama kreator, nama akun, atau tanda pengenal khasnya.
- meniru merek atau mengklaim produk kompetitor.
- menyalin angka, harga, atau klaim spesifik yang hanya ada di referensi.

Aturan keluaran:
- Hasilkan 3-4 status, masing-masing maksimal ${500} karakter.
- Jangan mengarang spesifikasi.
- Jangan klaim absolut.

Balas HANYA dalam JSON valid, tanpa teks lain dan tanpa markdown.

Format JSON:
{
  "tema": "string",
  "statuses": ["string", "..."]
}

${ATURAN_BAHASA}`;
}
