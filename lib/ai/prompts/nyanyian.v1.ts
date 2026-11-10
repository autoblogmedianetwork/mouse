/**
 * Prompt 21 — mode nyanyian (Gelombang 3).
 * Versi: v1.
 */
export const PROMPT_VERSION = "nyanyian.v1";

import { ATURAN_BAHASA } from "@/lib/ai/gaya-bahasa";

export interface NyanyianInput {
  teks: string;
}

export function buildNyanyianPrompt(input: NyanyianInput): string {
  return `Ubah status Threads berikut menjadi lirik singkat (3-6 baris) yang mudah dinyanyikan, tetap menyampaikan pesan produk secara jujur. Maksimal ${500} karakter.

Status asli:
${input.teks}

Aturan:
- Pertahankan fakta; jangan mengarang.
- Jangan klaim absolut.
- Lirik terasa ringan, bukan iklan.

Balas HANYA dalam JSON valid, tanpa teks lain dan tanpa markdown.

Format JSON:
{
  "lirik": "string"
}

${ATURAN_BAHASA}`;
}
