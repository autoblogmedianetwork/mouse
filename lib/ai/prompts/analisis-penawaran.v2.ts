/**
 * Prompt 1 — analisis penawaran (PRD 10.2).
 * Versi: v2 (mendukung penawaran Marketplace dan Non-Marketplace seperti Hosting/SaaS).
 * v1 tetap dipertahankan sesuai AGENTS aturan 13.
 */
export const PROMPT_VERSION = "analisis-penawaran.v2";

import type { AnalisisInput } from "./types";

export function buildAnalisisPenawaranPrompt(input: AnalisisInput): string {
  const isNonMarketplace =
    input.kategori &&
    ["hosting", "saas", "course", "other", "Hosting/SaaS", "Kursus"].some((k) =>
      input.kategori?.toLowerCase().includes(k.toLowerCase()),
    );

  if (isNonMarketplace) {
    return `Kamu adalah analis penawaran affiliate teknologi, hosting, dan SaaS yang membuat konten Threads berbahasa Indonesia kasual.

Berikut informasi dan fitur penawaran yang diberikan oleh user:
<informasi_penawaran>
${input.deskripsi}
</informasi_penawaran>

Data tambahan penawaran:
- Nama: ${input.nama ?? ""}
- Kategori: ${input.kategori ?? "Layanan / Software"}
- Harga / Paket: ${input.harga ?? "Sesuai paket"}

Tugasmu:
1. Ringkas penawaran / produk ini dalam 2-3 kalimat yang informatif dan lugas.
2. Daftar 3-5 fitur utama atau keunggulan spesifikasi yang paling menjual.
3. Tentukan 2-3 target audiens (misalnya developer, pemula website, pemilik bisnis, dll.).
4. Usulkan 3 angle konten yang berfokus pada EDUKASI, PERBANDINGAN, dan SOLUSI MASALAH teknis (jangan memakai ulasan toko atau promo fisik).
5. Tandai klaim promosi yang perlu dicek (misalnya "uptime 100%", "tercepat di dunia", dll.).

Aturan:
- Gunakan data fitur, keunggulan, dan harga yang diisi user sebagai acuan utama.
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

  // Bawaan Marketplace (Shopee)
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
