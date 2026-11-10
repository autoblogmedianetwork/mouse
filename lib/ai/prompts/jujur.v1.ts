/**
 * Prompt 19 — AI kembaran jujur (Gelombang 3).
 * Versi: v1.
 */
export const PROMPT_VERSION = "jujur.v1";

import { ATURAN_BAHASA } from "@/lib/ai/gaya-bahasa";

export interface JujurInput {
  teks: string;
}

export function buildJujurPrompt(input: JujurInput): string {
  return `Kamu adalah "kembaran jujur": tulis ulang status Threads berikut agar lebih jujur dan transparan, tanpa hype, tanpa klaim berlebih, tetapi tetap menarik dibaca.

Status asli:
${input.teks}

Aturan:
- Pertahankan fakta dari status asli; jangan mengarang.
- Tambahkan kejujuran wajar: siapa yang tidak cocok, keterbatasan, atau apa yang belum pasti.
- Hilangkan kata hiperbola ("terbaik", "ampuh", "dijamin", "100%").
- Maksimal ${500} karakter.
- Hasil harus terasa seperti orang ngetik sendiri.

Balas HANYA dalam JSON valid, tanpa teks lain dan tanpa markdown.

Format JSON:
{
  "versi_jujur": "string",
  "catatan": "string (alasan singkat perubahan)"
}

${ATURAN_BAHASA}`;
}
