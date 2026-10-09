/**
 * Prompt 2 — ide konten (PRD F2, 10.4).
 * Versi: v1. Jangan menimpa versi lama; buat v2 jika isi berubah (AGENTS rule 10).
 */
export const PROMPT_VERSION = "ide-konten.v1";

import { FORMAT_LABELS, type Analisis } from "@/lib/ai/schemas";

export interface IdeInput {
  namaProduk: string;
  ringkasan: string;
  fitur: string[];
  target_audiens: string[];
  angle: { judul: string; alasan: string }[];
}

export function buildIdeKontenPrompt(input: IdeInput): string {
  return `Kamu adalah strategist konten affiliate Shopee untuk Threads berbahasa Indonesia kasual.

Produk: ${input.namaProduk}
Ringkasan analisis:
${input.ringkasan}

Fitur utama: ${input.fitur.join("; ") || "-"}
Target audiens: ${input.target_audiens.join("; ") || "-"}
Angle yang sudah diusulkan: ${input.angle.map((a) => `${a.judul} (${a.alasan})`).join("; ") || "-"}

Tugasmu:
1. Buat tepat 10 ide topik untuk Threads.
2. Setiap ide punya judul, deskripsi singkat (1-2 kalimat), dan "jembatan" ke produk (hubungan singkat dari ide ke produk ini).
3. Setiap ide diberi SATU label format dari daftar ini: ${FORMAT_LABELS.join(", ")}.
4. Sebar labelnya secara merata dan variasikan sudut pandang: masalah, manfaat, perbandingan, pengalaman, tutorial, checklist.
5. Minimal satu ide memakai sudut "pengalaman" atau "jujur".

Aturan:
- Hanya pakai fakta dari ringkasan dan fitur di atas. Jangan mengarang spesifikasi, harga, atau klaim.
- Bahasa Indonesia kasual gaya Threads.
- Balas HANYA dalam JSON valid, tanpa teks lain dan tanpa markdown.

Format JSON:
{
  "ide": [
    {
      "judul": "string",
      "deskripsi": "string",
      "jembatan": "string",
      "format_label": "Listicle | Checklist | Storytelling | Perbandingan | Problem-Solution | Tutorial"
    }
  ]
}`;
}

/** Type guard helper re-exported for the API route. */
export type { Analisis };
