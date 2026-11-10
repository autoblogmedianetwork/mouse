/**
 * Prompt 15 — serial 30 hari (Gelombang 3, lanjutan serial 7 hari).
 * Versi: v1. Jangan menimpa versi lama; buat v2 bila isi berubah (AGENTS rule 13).
 */
export const PROMPT_VERSION = "serial-30-hari.v1";

import { ATURAN_BAHASA } from "@/lib/ai/gaya-bahasa";

export interface Serial30Input {
  namaProduk: string;
  deskripsi: string;
  masalah?: string;
}

export function buildSerial30Prompt(input: Serial30Input): string {
  return `Kamu menyusun serial konten Threads 30 hari untuk satu produk affiliate. Serial harus terasa bersambung, bukan tiga puluh iklan terpisah. Sebar postingan agar tidak membanjiri satu hari; satu status per hari.

Produk: ${input.namaProduk}
Deskripsi produk (satu-satunya sumber fakta):
${input.deskripsi}
Masalah audiens yang ingin disentuh: ${input.masalah?.trim() || "tentukan dari deskripsi"}

Alur serial 30 hari (ikuti fase ini):
- Hari 1-5: bangun rasa penasaran, ceritakan masalah sehari-hari. BELUM jualan.
- Hari 6-10: cerita pengalaman memakai produk dan detail yang bisa dibuktikan dari deskripsi.
- Hari 11-15: jujur soal kekurangan atau siapa yang tidak cocok memakainya.
- Hari 16-20: perbandingan sebelum-sesudah atau tips pemakaian.
- Hari 21-25: jawab keberatan/FAQ yang wajar dari audiens.
- Hari 26-29: bukti sosial ringan dan ajakan halus (cek link di bio/DM).
- Hari 30: ringkasan singkat + ajakan cek link di bio/DM, tanpa tekanan dan tanpa urgensi palsu.

Tugasmu:
- Isi tepat 30 hari, masing-masing dengan "judul" internal, "tujuan" singkat, dan tepat 1 status siap posting.
- Setiap status maksimal ${500} karakter dan terasa seperti orang ngetik sendiri, bukan caption brand.
- Hari 1-5 jangan menyebut harga atau ajakan beli.
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
