/**
 * Prompt 22 — lawan bots (Gelombang 3).
 * Versi: v1.
 */
export const PROMPT_VERSION = "lawan-bots.v1";

import { ATURAN_BAHASA } from "@/lib/ai/gaya-bahasa";

export interface LawanBotsInput {
  topik: string;
  produkA?: string;
  produkB?: string;
}

export function buildLawanBotsPrompt(input: LawanBotsInput): string {
  return `Buat dialog pendek antara dua bot (Bot A dan Bot B) yang berdebat secara jujur tentang topik berikut. Tujuannya menghibur dan membantu audiens berpikir, bukan memaksa beli.

Topik: ${input.topik}
${input.produkA ? `Produk A: ${input.produkA}` : ""}
${input.produkB ? `Produk B: ${input.produkB}` : ""}

Aturan:
- 4-6 giliran dialog, bergantian Bot A dan Bot B.
- Masing-masing teks maksimal ${500} karakter.
- Jangan klaim absolut; akui keterbatasan.
- Jangan mengarang spesifikasi.
- Akhiri dengan kesimpulan netral.

Balas HANYA dalam JSON valid, tanpa teks lain dan tanpa markdown.

Format JSON:
{
  "tema": "string",
  "dialog": [ { "bot": "Bot A", "teks": "string" }, { "bot": "Bot B", "teks": "string" } ]
}

${ATURAN_BAHASA}`;
}
