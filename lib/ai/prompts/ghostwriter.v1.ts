/**
 * Prompt 17 — ghostwriter dari transkrip (Gelombang 3).
 * Versi: v1.
 */
export const PROMPT_VERSION = "ghostwriter.v1";

import { ATURAN_BAHASA } from "@/lib/ai/gaya-bahasa";

export interface GhostwriterInput {
  transcript: string;
  jumlah: "pendek" | "menengah" | "panjang";
}

const JUMLAH_STATUS: Record<GhostwriterInput["jumlah"], number> = {
  pendek: 3,
  menengah: 4,
  panjang: 5,
};

export function buildGhostwriterPrompt(input: GhostwriterInput): string {
  const n = JUMLAH_STATUS[input.jumlah];
  return `Kamu adalah ghostwriter: ubah transkrip/curhatan mentah berikut menjadi ${n} status Threads affiliate yang terasa seperti orang ngetik sendiri, bukan caption brand.

Transkrip (satu-satunya sumber fakta dan sudut pandang):
${input.transcript}

Aturan:
- Hasilkan tepat ${n} status, masing-masing maksimal ${500} karakter.
- Ambil fakta hanya dari transkrip; jangan mengarang spesifikasi.
- Jangan pakai klaim absolut atau kata "dijamin".
- Jangan pakai hashtag agresif.
- Variasikan sudut: pengalaman, tips, jujur soal kekurangan, ajakan halus.

Balas HANYA dalam JSON valid, tanpa teks lain dan tanpa markdown.

Format JSON:
{
  "tema": "string",
  "statuses": ["string", "..."]
}

${ATURAN_BAHASA}`;
}
