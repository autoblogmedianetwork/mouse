/**
 * Prompt 1 — analisis produk (PRD 10.2).
 * Versi: v1. Jangan menimpa versi lama; buat v2 jika isi berubah (AGENTS rule 10).
 */
export const PROMPT_VERSION = "analisis-produk.v1";

import type { AnalisisInput } from "./types";

export function buildAnalisisProdukPrompt(input: AnalisisInput): string {
  return `Kamu adalah analis produk untuk affiliate Shopee yang membuat konten Threads berbahasa Indonesia kasual.

Berikut deskripsi produk yang disalin dari halaman Shopee:
<deskripsi>
${input.deskripsi}
</deskripsi>

Data tambahan dari user (boleh kosong):
- Nama: ${input.nama ?? ""}
- Varian: ${input.varian ?? ""}
- Harga: ${input.harga ?? ""}

Tugasmu:
1. Ringkas produk dalam 2-3 kalimat.
2. Daftar 3-5 fitur utama yang benar-benar disebut di deskripsi.
3. Tentukan 2-3 target audiens yang paling cocok.
4. Usulkan 3 angle konten (masalah, manfaat, perbandingan, pengalaman).
5. Tandai klaim yang tidak bisa diverifikasi dari deskripsi (misalnya "terbaik", "paling awet", "100% aman").

Aturan:
- Hanya pakai informasi dari deskripsi dan data tambahan. Jangan mengarang spesifikasi.
- Jika deskripsi tidak jelas atau kosong, isi field dengan null dan beri catatan.
- Balas HANYA dalam JSON valid, tanpa teks lain dan tanpa markdown.

Format JSON:
{
  "ringkasan": "string",
  "fitur": ["string"],
  "target_audiens": ["string"],
  "angle": [{"judul": "string", "alasan": "string"}],
  "klaim_perlu_cek": ["string"],
  "confidence": "tinggi | sedang | rendah",
  "catatan": "string | null"
}`;
}
