/**
 * Prompt 18 — Roulette/battle gabungan beberapa produk (Gelombang 3).
 * Versi: v1.
 */
export const PROMPT_VERSION = "battle.v1";

import { ATURAN_BAHASA } from "@/lib/ai/gaya-bahasa";

export interface BattleInput {
  produk: { nama: string; deskripsi: string }[];
}

export function buildBattlePrompt(input: BattleInput): string {
  const daftar = input.produk
    .map((p, i) => `Produk ${i + 1}: ${p.nama}\nDeskripsi: ${p.deskripsi}`)
    .join("\n\n");
  return `Kamu membuat konten Threads "battle/roulette" yang membandingkan beberapa produk affiliate secara jujur, bukan iklan. Tujuannya membantu audiens memilih, bukan memaksa beli.

${daftar}

Aturan:
- Hasilkan 3-4 status, masing-masing maksimal ${500} karakter.
- Jangan mengklaim satu produk pasti lebih baik tanpa bukti; tekankan "cocok untuk siapa".
- Jangan mengarang spesifikasi di luar deskripsi.
- Jangan pakai klaim absolut atau kata "dijamin".
- Jangan pakai hashtag agresif.

Balas HANYA dalam JSON valid, tanpa teks lain dan tanpa markdown.

Format JSON:
{
  "tema": "string",
  "statuses": ["string", "..."]
}

${ATURAN_BAHASA}`;
}
