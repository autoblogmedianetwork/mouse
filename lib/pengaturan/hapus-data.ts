/**
 * Daftar data yang bisa dihapus (Opsi B, Gelombang 5).
 *
 * Setiap entri menjelaskan satu kelompok data localStorage milik Heaviliate
 * dan tingkat risikonya. Dipakai oleh fitur "Hapus data" di Pengaturan supaya
 * user bisa membersihkan data percobaan tanpa menghapus pengaturan yang sudah
 * benar-benar dipakai.
 *
 * Hanya kunci berawalan `autothreads-` yang boleh disentuh; kunci lain milik
 * aplikasi/halaman lain tidak pernah dihapus dari sini.
 */

export const AWALAN_KUNCI = "autothreads-";

export type RisikoHapus = "aman" | "perhatian" | "hati-hati";

export interface KelompokData {
  id: string;
  label: string;
  keterangan: string;
  /** Awalan/isi kunci localStorage yang termasuk kelompok ini. */
  kunci: readonly string[];
  risiko: RisikoHapus;
  /** Ikon teks singkat untuk UI (tanpa emoji, sesuai ADR 0013). */
  ikon: string;
}

export const KELOMPOK_DATA: KelompokData[] = [
  {
    id: "konten",
    label: "Bank konten",
    keterangan: "Semua draft, konten siap posting, terjadwal, dan riwayat kirim.",
    kunci: ["autothreads-konten", "autothreads-riwayat-kirim"],
    risiko: "hati-hati",
    ikon: "KTN",
  },
  {
    id: "produk",
    label: "Produk & favorit",
    keterangan: "Produk yang disimpan dari Tempel Cepat atau form manual.",
    kunci: ["autothreads-products", "autothreads-produk-favorit"],
    risiko: "hati-hati",
    ikon: "PRD",
  },
  {
    id: "riset",
    label: "Catatan riset lokal",
    keterangan:
      "Bank masalah, hasil review pasar, perbandingan, dan riwayat riset di peramban ini. Riset di server tidak ikut terhapus.",
    kunci: [
      "autothreads-bank-masalah",
      "autothreads-review-pasar",
      "autothreads-riset-banding",
      "autothreads-riwayat-riset",
    ],
    risiko: "perhatian",
    ikon: "RST",
  },
  {
    id: "performa",
    label: "Data performa & atribusi",
    keterangan: "Klik/komisi manual, impor performa, dan atribusi konten.",
    kunci: ["autothreads-performa", "autothreads-atribusi", "autothreads-eksperimen-hook"],
    risiko: "perhatian",
    ikon: "PRF",
  },
  {
    id: "progres",
    label: "Progres & streak",
    keterangan:
      "Rencana Perdana, Fokus harian, dan gamifikasi. Menghapus ini membuat hitungan hari mulai dari nol.",
    kunci: ["autothreads-rencana-perdana", "autothreads-fokus-selesai", "autothreads-gamifikasi"],
    risiko: "perhatian",
    ikon: "PRG",
  },
  {
    id: "draft",
    label: "Draft posting yang belum disimpan",
    keterangan: "Isi form Buat Posting yang tersimpan otomatis sebagai draft.",
    kunci: ["autothreads-draft-posting", "autothreads-video-draf", "autothreads-batch-produk"],
    risiko: "aman",
    ikon: "DRF",
  },
  {
    id: "persona",
    label: "Persona & tag",
    keterangan:
      "Nama & gaya bicara persona bernama, serta tag Shopee terakhir per konten (autothreads-tag-shopee-*).",
    kunci: ["autothreads-persona-bernama"],
    risiko: "perhatian",
    ikon: "PRS",
  },
  {
    id: "pengaturan",
    label: "Pengaturan aplikasi",
    keterangan:
      "Profil, aturan konten, pengaturan generate, link program, dan akun sosial. Menghapus ini mengembalikan aplikasi ke setelan awal.",
    kunci: [
      "autothreads-pengaturan",
      "autothreads-pengaturan-posting",
      "autothreads-link-programs",
      "autothreads-akun-sosial",
      "autothreads-snippet-cta",
      "autothreads-pengingat-ditutup",
      "autothreads-onboarding-selesai",
    ],
    risiko: "hati-hati",
    ikon: "SET",
  },
];

/**
 * Kunci tambahan yang memakai awalan (bukan nama tetap), mis.
 * `autothreads-tag-shopee-<id>` atau `autothreads-cadangan-<tanggal>`.
 */
export const AWALAN_DINAMIS: readonly string[] = ["autothreads-tag-shopee-"];

/** Semua kunci Heaviliate di storage, diurutkan. */
export function semuaKunciHeaviliate(kunciStorage: readonly string[]): string[] {
  return [...kunciStorage].filter((k) => k.startsWith(AWALAN_KUNCI)).sort();
}

/** Kunci yang termasuk satu kelompok (termasuk awalan dinamis). */
export function kunciKelompok(
  kelompok: KelompokData,
  kunciStorage: readonly string[],
): string[] {
  const tetap = new Set<string>(kelompok.kunci);
  const dinamis =
    kelompok.id === "persona" ? AWALAN_DINAMIS.filter((a) => a !== "autothreads-cadangan-") : [];
  return kunciStorage
    .filter((k) => tetap.has(k) || dinamis.some((a) => k.startsWith(a)))
    .sort();
}

/** Perkiraan ukuran data (byte) untuk satu kelompok; membantu user memilih. */
export function ukuranKelompok(
  kelompok: KelompokData,
  baca: (kunci: string) => string | null,
  kunciStorage: readonly string[],
): number {
  return kunciKelompok(kelompok, kunciStorage).reduce((total, k) => {
    const nilai = baca(k) ?? "";
    // UTF-16 di localStorage: 2 byte per karakter untuk ASCII.
    return total + (k.length + nilai.length) * 2;
  }, 0);
}

/** Format byte menjadi teks singkat (B / KB / MB). */
export function formatByte(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
