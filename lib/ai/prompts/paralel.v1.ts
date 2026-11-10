/**
 * Prompt 20 — mode paralel universe (Gelombang 3).
 * Versi: v1.
 */
export const PROMPT_VERSION = "paralel.v1";

import { ATURAN_BAHASA } from "@/lib/ai/gaya-bahasa";

export interface ParalelInput {
  teks: string;
  genre: string;
}

export function buildParalelPrompt(input: ParalelInput): string {
  return `Kamu menulis ulang status Threads berikut dalam "universum paralel" bergaya ${input.genre}, sambil mempertahankan fakta produk dan pesan inti. Boleh bermain bahasa, tapi jangan mengarang spesifikasi.

Status asli:
${input.teks}

Aturan:
- Hasil maksimal ${500} karakter.
- Pertahankan fakta dan pesan inti; hanya gaya/setting yang berubah.
- Jangan pakai klaim absolut.
- Hasil terasa seperti orang ngetik sendiri.

Balas HANYA dalam JSON valid, tanpa teks lain dan tanpa markdown.

Format JSON:
{
  "versi_paralel": "string",
  "genre": "string"
}

${ATURAN_BAHASA}`;
}
