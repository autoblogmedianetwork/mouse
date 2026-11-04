/**
 * Prompt 11 — peluang produk (tahap 2 Content Machine, docs/content-machine.md).
 *
 * Versi: v1. Jangan menimpa versi lama; buat v2 jika isi berubah (AGENTS rule 13).
 *
 * Menerima hasil riset audiens (ringkasan + daftar masalah) dan menghasilkan
 * 20 kategori produk yang layak dipromosikan lewat Threads. Kategori, bukan
 * produk spesifik: produk konkret baru dibuat setelah user memilih kategori.
 */
export const PROMPT_VERSION = "peluang-produk.v1";

import { ATURAN_BAHASA } from "@/lib/ai/gaya-bahasa";

export interface PeluangProdukInput {
  niche: string;
  audiens: string;
  ringkasan: string;
  masalah: string[];
}

export function buildPeluangProdukPrompt(input: PeluangProdukInput): string {
  const daftarMasalah =
    input.masalah.length > 0
      ? input.masalah.map((m, i) => `${i + 1}. ${m}`).join("\n")
      : "-";

  return `Kamu strategist affiliate Shopee untuk konten Threads berbahasa Indonesia.

Niche: ${input.niche}
Target audiens: ${input.audiens}

Ringkasan riset audiens:
${input.ringkasan}

Masalah yang sudah ditemukan:
${daftarMasalah}

Tugasmu: susun tepat 20 KATEGORI produk yang berpotensi dipromosikan lewat Threads untuk audiens ini.

Prioritaskan kategori yang:
- menyelesaikan masalah nyata dari daftar di atas,
- mudah dibuatkan kontennya di Threads (bisa diceritakan, bukan butuh demo video),
- punya banyak sudut cerita (bukan cuma "murah"),
- tidak terasa seperti hard selling.

Untuk setiap kategori isi:
- "kategori": nama kategori/jenis produk generik, tanpa merek.
- "alasan": kenapa kategori ini cocok untuk audiens ini, maksimal dua kalimat.
- "masalah_terkait": SALIN salah satu masalah dari daftar di atas, persis seperti tertulis.
- "contoh_produk": 2-3 contoh produk generik dalam kategori ini.
- "prioritas": "tinggi", "sedang", atau "rendah" — tinggi untuk yang paling cepat menyelesaikan masalah dan paling mudah dibuatkan konten.
- "kesulitan_konten": "rendah", "sedang", atau "tinggi" — seberapa sulit membuat konten menarik tanpa foto atau video produk.

Aturan:
- Jangan mengarang harga, rating, jumlah terjual, atau nama merek.
- Maksimal 7 kategori berprioritas "tinggi".
- Kategori tidak boleh saling tumpang tindih.

${ATURAN_BAHASA}

Balas HANYA dalam JSON valid, tanpa teks lain dan tanpa markdown. Format:
{
  "peluang": [
    {
      "kategori": "string",
      "alasan": "string",
      "masalah_terkait": "string",
      "contoh_produk": ["string"],
      "prioritas": "tinggi | sedang | rendah",
      "kesulitan_konten": "rendah | sedang | tinggi"
    }
  ]
}`;
}
