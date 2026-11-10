/**
 * Prompt 23 — konten dari foto (Gelombang 3).
 * Versi: v1.
 */
export const PROMPT_VERSION = "foto.v1";

import { ATURAN_BAHASA } from "@/lib/ai/gaya-bahasa";

export interface FotoInput {
  konteks?: string;
}

export function buildFotoPrompt(input: FotoInput): string {
  return `Buat 3-4 status Threads affiliate berdasarkan gambar yang dilampirkan. Fakta hanya dari apa yang terlihat di gambar dan konteks berikut.

Konteks tambahan: ${input.konteks?.trim() || "(tidak ada)"}

Aturan:
- Masing-masing status maksimal ${500} karakter.
- Jangan mengarang spesifikasi yang tidak terlihat.
- Jangan klaim absolut.
- Hasil terasa seperti orang ngetik sendiri.

Balas HANYA dalam JSON valid, tanpa teks lain dan tanpa markdown.

Format JSON:
{
  "tema": "string",
  "statuses": ["string", "..."]
}

${ATURAN_BAHASA}`;
}
