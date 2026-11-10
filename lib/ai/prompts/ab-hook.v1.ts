/**
 * Prompt 16 — A/B otomatis dua hook (Gelombang 3).
 * Versi: v1. Jangan menimpa versi lama; buat v2 bila isi berubah (AGENTS rule 13).
 */
export const PROMPT_VERSION = "ab-hook.v1";

import { ATURAN_BAHASA } from "@/lib/ai/gaya-bahasa";

export interface AbHookInput {
  namaProduk: string;
  deskripsi: string;
  masalah?: string;
}

export function buildAbHookPrompt(input: AbHookInput): string {
  return `Kamu membuat DUA varian hook (kalimat pembuka) untuk status Threads tentang satu produk affiliate, untuk diuji A/B secara manual oleh user.

Produk: ${input.namaProduk}
Deskripsi produk (satu-satunya sumber fakta):
${input.deskripsi}
Masalah audiens yang ingin disentuh: ${input.masalah?.trim() || "tentukan dari deskripsi"}

Aturan:
- Buat tepat 2 varian hook yang berbeda pendekatan: varian A berbasis rasa penasaran/curiosity, varian B berbasis masalah/relatable.
- Masing-masing hook maksimal ${500} karakter dan terasa seperti orang ngetik sendiri.
- Jangan mengarang spesifikasi di luar deskripsi. Jangan pakai klaim absolut atau kata "dijamin".
- Jangan pakai hashtag agresif (#stok_habis, #segera, dll).

Balas HANYA dalam JSON valid, tanpa teks lain dan tanpa markdown.

Format JSON:
{
  "varian": ["hook A", "hook B"]
}

${ATURAN_BAHASA}`;
}
