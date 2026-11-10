/**
 * Prompt 13 — mesin ide dari bank masalah riset (Gelombang 3).
 * Versi: v1. Jangan menimpa versi lama; buat v2 bila isi berubah (AGENTS rule 13).
 */
export const PROMPT_VERSION = "ide-masalah.v1";

import { ATURAN_BAHASA } from "@/lib/ai/gaya-bahasa";

export interface IdeMasalahInput {
  masalah: string;
  kategori?: string;
  produk?: string;
}

export function buildIdeMasalahPrompt(input: IdeMasalahInput): string {
  return `Kamu adalah penulis konten affiliate Threads berbahasa Indonesia. Kamu diberi SATU masalah nyata dari hasil riset audiens, lalu menyusun tiga sudut konten dari masalah itu.

Masalah audiens: ${input.masalah}
Kategori: ${input.kategori?.trim() || "tidak disebutkan"}
Produk yang ingin dipromosikan: ${input.produk?.trim() || "belum ditentukan"}

Tugasmu:
1. Buat tepat 3 hook pembuka yang berbeda sudutnya. Tiap hook maksimal 280 karakter dan harus terasa seperti orang beneran ngetik di Threads.
2. Untuk tiap hook, tulis "sudut" singkat (misalnya: pengakuan pribadi, pertanyaan yang bikin mikir, perbandingan sebelum-sesudah).
3. Tulis "jembatan": satu kalimat yang menghubungkan masalah ke produk tanpa terkesan jualan keras.
4. Ketiga hook harus benar-benar berbeda, bukan tiga versi kalimat yang sama.

Aturan:
- Jangan mengarang harga, spesifikasi, atau testimoni.
- Jangan pakai klaim absolut ("terbaik", "dijamin", "100% ampuh").
- Balas HANYA dalam JSON valid, tanpa teks lain dan tanpa markdown.

Format JSON:
{
  "ide": [
    { "hook": "string", "sudut": "string", "jembatan": "string" }
  ]
}

${ATURAN_BAHASA}`;
}
