/**
 * Prompt 17 — varian balasan AI (pengembangan Bank Balasan).
 *
 * Versi: v1 (baru). Dari SATU template bawaan Bank Balasan, AI membuat
 * 2-3 varian dengan suara user (dari Analisa Gaya bila ada) — tetap
 * placeholder [topik] dsb. supaya user mengisi konteks sendiri. Draft:
 * tidak ada pengiriman otomatis (Fase 4).
 */
export const PROMPT_VERSION = "varian-balasan.v1";

import { ATURAN_BAHASA } from "@/lib/ai/gaya-bahasa";

export interface VarianBalasanInput {
  situasi: string;
  templat: string;
  gayaBicara?: string;
}

export function buildVarianBalasanPrompt(input: VarianBalasanInput): string {
  return `Kamu penulis balasan Threads berbahasa Indonesia.

Tugasmu: membuat 2-3 VARIAN dari template balasan di bawah, untuk situasi
yang sama. Variannya harus tetap memakai placeholder kurung siku ([topik],
[pengalaman singkat], dst.) APA ADANYA — user akan mengisinya sendiri.

=== SITUASI ===
${input.situasi}

=== TEMPLATE ASAL ===
${input.templat}
=== AKHIR TEMPLATE ===
${input.gayaBicara ? `Gaya bicara user (dari analisis postingannya): ${input.gayaBicara}` : "Gaya bawaan: bapak dua anak, sopan, suka bercerita, memakai kata \"saya\", tidak menggurui."}

ATURAN (WAJIB):
- Maksimal 500 karakter per varian.
- Pertahankan INTENT template (empati tetap empati, bertanya tetap bertanya).
- Jangan menawarkan barang di balasan empati — dengarkan dulu.
- Jangan menggurui ("kamu harus", "sebaiknya kamu"). Bercerita dari "saya".
- Setiap varian harus berbeda pendekatan, bukan ganti kata saja.

${ATURAN_BAHASA}

Keluaran (JSON):
- "varian": array 2-3 string.

Balas HANYA JSON valid tanpa penjelasan di luar JSON.`;
}
