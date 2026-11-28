/**
 * Daftar prinsip persuasi untuk konten afiliasi (adaptasi kerangka
 * "marketing-psychology").
 *
 * Dua kelompok dipisah tegas:
 *  - BOLEH: prinsip yang bekerja karena kontennya memang lebih jelas/berguna.
 *  - DILARANG: trik yang menipu pembaca. Bukan cuma soal etika — scarcity palsu
 *    dan otoritas karangan termasuk clickbait yang dilarang pasal 6.3(n) Syarat
 *    dan Ketentuan Shopee Affiliate, dan bisa membuat komisi hangus.
 */

export type IdPrinsip =
  | "spesifik"
  | "loss_aversion"
  | "social_proof"
  | "curiosity"
  | "kesesuaian"
  | "kontras";

export type IdPrinsipDilarang = "scarcity_palsu" | "otoritas_tanpa_dasar" | "urgensi_karangan";

export interface Prinsip {
  id: IdPrinsip;
  label: string;
  /** Kenapa ini bekerja, satu kalimat. */
  kenapa: string;
  /** Cara memakainya tanpa menipu. */
  cara: string;
}

export interface PrinsipDilarang {
  id: IdPrinsipDilarang;
  label: string;
  /** Akibatnya kalau dipakai. */
  akibat: string;
}

export const PRINSIP: readonly Prinsip[] = [
  {
    id: "spesifik",
    label: "Angka dan detail",
    kenapa: "Otak percaya pada yang bisa diukur, bukan pada kata sifat.",
    cara: 'Sebut ukuran, durasi, atau harga nyata: "750 ml", "tahan 12 jam", "Rp89 ribu".',
  },
  {
    id: "loss_aversion",
    label: "Rasa kehilangan",
    kenapa: "Orang lebih takut kehilangan daripada tertarik mendapat.",
    cara: 'Bicara yang bikin repot kalau dilewat: "tiap pagi numpahin kopi di tas".',
  },
  {
    id: "social_proof",
    label: "Bukti orang lain",
    kenapa: "Kita menilai aman dari perilaku orang banyak.",
    cara: 'Pakai pengalaman sendiri yang jujur: "aku pakai dua bulan, ini yang berubah".',
  },
  {
    id: "curiosity",
    label: "Rasa penasaran",
    kenapa: "Kalimat menggantung memaksa mata lanjut ke baris berikutnya.",
    cara: "Buka dengan satu hal yang belum dijelaskan, lalu jelaskan di baris ke-2.",
  },
  {
    id: "kesesuaian",
    label: "Sesuai orangnya",
    kenapa: "Pembaca berhenti kalau merasa disebut namanya.",
    cara: 'Sebut siapa yang cocok: "buat yang kerja shift malam".',
  },
  {
    id: "kontras",
    label: "Sebelum dan sesudah",
    kenapa: "Perubahan mudah dipahami kalau ada pembandingnya.",
    cara: 'Tunjukkan keadaan lama lalu sekarang, tanpa melebih-lebihkan.',
  },
];

export const PRINSIP_DILARANG: readonly PrinsipDilarang[] = [
  {
    id: "scarcity_palsu",
    label: "Stok atau kuota karangan",
    akibat: 'Pasal 6.3(n) melarang iklan clickbait; klaim "sisa 3" yang tidak benar bisa membuat komisi hangus.',
  },
  {
    id: "otoritas_tanpa_dasar",
    label: "Mengaku-ngaku ahli",
    akibat: 'Kanibalisasi kepercayaan. Kalau klaim kesehatan, ini juga melanggar aturan iklan di Indonesia.',
  },
  {
    id: "urgensi_karangan",
    label: "Desakan waktu palsu",
    akibat: 'Pembaca yang tertipu sekali tidak akan kembali. Sumber komisi jangka panjangnya hilang.',
  },
];

export const LABEL_PRINSIP: Record<IdPrinsip, string> = {
  spesifik: "Angka dan detail",
  loss_aversion: "Rasa kehilangan",
  social_proof: "Bukti orang lain",
  curiosity: "Rasa penasaran",
  kesesuaian: "Sesuai orangnya",
  kontras: "Sebelum dan sesudah",
};
