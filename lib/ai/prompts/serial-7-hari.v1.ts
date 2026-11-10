/**
 * Prompt 14 — serial 7 hari (Gelombang 3).
 * Versi: v1. Jangan menimpa versi lama; buat v2 bila isi berubah (AGENTS rule 13).
 */
export const PROMPT_VERSION = "serial-7-hari.v1";

import { ATURAN_BAHASA } from "@/lib/ai/gaya-bahasa";

export interface Serial7Input {
  namaProduk: string;
  deskripsi: string;
  masalah?: string;
}

export function buildSerial7Prompt(input: Serial7Input): string {
  return `Kamu menyusun serial konten Threads 7 hari untuk satu produk affiliate. Serial harus terasa bersambung, bukan tujuh iklan terpisah.

Produk: ${input.namaProduk}
Deskripsi produk (satu-satunya sumber fakta):
${input.deskripsi}
Masalah audiens yang ingin disentuh: ${input.masalah?.trim() || "tentukan dari deskripsi"}

Alur serial:
- Hari 1-2: bangun rasa penasaran, ceritakan masalah sehari-hari. BELUM jualan.
- Hari 3-4: cerita pengalaman memakai produk dan detail yang bisa dibuktikan dari deskripsi.
- Hari 5: jujur soal kekurangan atau siapa yang tidak cocok memakainya.
- Hari 6: perbandingan sebelum-sesudah atau tips pemakaian.
- Hari 7: ajakan halus (cek link di bio/DM), tanpa tekanan dan tanpa urgensi palsu.

Tugasmu:
- Isi tepat 7 hari, masing-masing dengan "judul" internal, "tujuan" singkat, dan 1-3 status siap posting.
- Setiap status maksimal ${500} karakter dan terasa seperti orang ngetik sendiri, bukan caption brand.
- Hari 1-2 jangan menyebut harga atau ajakan beli.
- Jangan mengarang spesifikasi di luar deskripsi. Jangan pakai klaim absolut atau kata "dijamin".

Balas HANYA dalam JSON valid, tanpa teks lain dan tanpa markdown.

Format JSON:
{
  "tema": "string",
  "hari": [
    {
      "hari": 1,
      "judul": "string",
      "tujuan": "string",
      "statuses": ["string"]
    }
  ]
}

${ATURAN_BAHASA}`;
}
