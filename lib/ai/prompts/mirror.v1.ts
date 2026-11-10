/**
 * Prompt 24 — mirror competitor (manual, tanpa scraping) (Gelombang 3).
 * Versi: v1.
 */
export const PROMPT_VERSION = "mirror.v1";

import { ATURAN_BAHASA } from "@/lib/ai/gaya-bahasa";

export interface MirrorInput {
  kontenKompetitor: string;
  namaProduk?: string;
}

export function buildMirrorPrompt(input: MirrorInput): string {
  return `Buat konten Threads yang terinspirasi dari gaya/konten kompetitor berikut, tetapi tetap orisinal dan jujur. Jangan menyalin; jangan mengklaim produk kompetitor.

Konten kompetitor (referensi gaya saja):
${input.kontenKompetitor}

${input.namaProduk ? `Produk Anda: ${input.namaProduk}` : ""}

Aturan:
- Hasilkan 3-4 status, masing-masing maksimal ${500} karakter.
- Ambil pola hook/struktur, bukan kalimat persis.
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
