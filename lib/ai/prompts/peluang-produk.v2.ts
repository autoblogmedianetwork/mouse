/**
 * Prompt 11 — peluang produk (tahap 2 Content Machine, docs/content-machine.md).
 *
 * Versi: v2. Jangan menimpa versi lama; buat v3 jika isi berubah (AGENTS rule 13).
 *
 * Perubahan dari v1 (Fase 3, task 3-A): setiap kategori kini membawa SKOR
 * KELAYAKAN 1-5 untuk empat dimensi (permintaan, kompetisi, kemudahan konten,
 * potensi komisi) plus alasan satu kalimat per skor, supaya user tahu mana yang
 * dikerjakan lebih dulu tanpa harus membaca 20 kategori satu per satu.
 * Struktur lama (prioritas, kesulitan_konten, masalah_terkait) tetap ada supaya
 * data lama dan tampilan lama tidak rusak.
 */
export const PROMPT_VERSION = "peluang-produk.v2";

import { ATURAN_BAHASA } from "@/lib/ai/gaya-bahasa";

export interface PeluangProdukInput {
  niche: string;
  audiens: string;
  ringkasan: string;
  masalah: string[];
  /** Fase 3-C: ringkasan review pasar nyata (opsional). */
  reviewPasar?: string;
}

export function buildPeluangProdukPrompt(input: PeluangProdukInput): string {
  const daftarMasalah =
    input.masalah.length > 0
      ? input.masalah.map((m, i) => `${i + 1}. ${m}`).join("\n")
      : "-";

  const bagianReview = input.reviewPasar?.trim()
    ? `
Review pasar nyata (dari pembeli marketplace, sudah dianonimkan):
${input.reviewPasar.trim()}

Pakai review di atas sebagai bukti: kategori yang menyelesaikan keluhan nyata
di review harus dapat skor "permintaan" lebih tinggi, dan kosakata pembeli
boleh dipakai di "alasan".
`
    : "";

  return `Kamu strategist affiliate Shopee untuk konten Threads berbahasa Indonesia.

Niche: ${input.niche}
Target audiens: ${input.audiens}

Ringkasan riset audiens:
${input.ringkasan}

Masalah yang sudah ditemukan:
${daftarMasalah}
${bagianReview}
Tugasmu: susun tepat 20 KATEGORI produk yang berpotensi dipromosikan lewat Threads untuk audiens ini, lalu beri SKOR KELAYAKAN supaya user tahu mana yang dikerjakan lebih dulu.

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
- "prioritas": "tinggi", "sedang", atau "rendah".
- "kesulitan_konten": "rendah", "sedang", atau "tinggi" — seberapa sulit membuat konten menarik tanpa foto atau video produk.
- "skor": objek berisi empat skor bilangan bulat 1-5 dan alasannya satu kalimat masing-masing:
  - "permintaan" (1-5): seberapa sering masalah ini dikeluhkan audiens. 5 = hampir semua orang mengalaminya.
  - "kompetisi" (1-5): seberapa mudah menonjol. 5 = sedikit pesaing yang membahasnya dengan sudut berbeda.
  - "kemudahan_konten" (1-5): seberapa mudah dijadikan konten Threads tanpa foto/video. 5 = sangat mudah.
  - "potensi_komisi" (1-5): perkiraan potensi komisi relatif untuk kategori ini. 5 = paling menjanjikan.
  - "alasan_permintaan", "alasan_kompetisi", "alasan_kemudahan_konten", "alasan_potensi_komisi": satu kalimat singkat per skor, bahasa sehari-hari.
- "skor_total": bilangan bulat 4-20, yaitu jumlah keempat skor di atas. Hitung dengan benar.

Aturan skor:
- Nilai harus bervariasi. Jangan memberi semua kategori skor tinggi.
- Skor harus konsisten dengan "prioritas": prioritas "tinggi" umumnya skor_total 16 ke atas, "rendah" umumnya 11 ke bawah.
- Jangan mengarang angka penjualan, harga, atau rating untuk mendukung skor.

Aturan lain:
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
      "kesulitan_konten": "rendah | sedang | tinggi",
      "skor": {
        "permintaan": 1,
        "kompetisi": 1,
        "kemudahan_konten": 1,
        "potensi_komisi": 1,
        "alasan_permintaan": "string",
        "alasan_kompetisi": "string",
        "alasan_kemudahan_konten": "string",
        "alasan_potensi_komisi": "string"
      },
      "skor_total": 4
    }
  ]
}`;
}
