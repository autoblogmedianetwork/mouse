/**
 * Preset riset audiens (Fase 3, task 3-B): kartu persona siap pilih + chip
 * ala Meta Ads. Data statis, tanpa dependency. Kolom ketik manual tetap ada —
 * preset hanya mengisi, tidak pernah mengunci (PRD F1).
 */

export interface KartuPersona {
  id: string;
  nama: string;
  /** Kalimat yang langsung mengisi kolom "Target audiens". */
  deskripsi: string;
  kelompok: string;
}

export const KARTU_PERSONA: readonly KartuPersona[] = [
  {
    id: "ibu-muda",
    nama: "Ibu muda 25–40",
    deskripsi:
      "Ibu muda 25–40 tahun, belanja online rutin untuk rumah dan anak, aktif di grup WhatsApp, percaya review sebelum beli.",
    kelompok: "rumah tangga",
  },
  {
    id: "mahasiswa",
    nama: "Mahasiswa",
    deskripsi:
      "Mahasiswa 18–24 tahun, budget terbatas, keputusan beli cepat dari TikTok dan rekomendasi teman, suka barang estetik tapi murah.",
    kelompok: "muda",
  },
  {
    id: "pekerja-kantoran",
    nama: "Pekerja kantoran",
    deskripsi:
      "Pekerja kantoran 24–35 tahun, cari yang praktis dan hemat waktu, belanja malam lewat ponsel, sensitif terhadap ongkir.",
    kelompok: "pekerja",
  },
  {
    id: "wirausaha-rumahan",
    nama: "Wirausaha rumahan",
    deskripsi:
      "Pemilik usaha kecil di rumah, belanja alat dan bahan untuk usaha, hitung untung-rugi detail, suka promo grosir.",
    kelompok: "pekerja",
  },
  {
    id: "gadget-freak",
    nama: "Penggila gadget",
    deskripsi:
      "Pria 20–35 tahun yang mengikuti review gadget, membandingkan spesifikasi sebelum beli, rela menabung untuk barang yang pas.",
    kelompok: "hobi",
  },
  {
    id: "kecantikan-aware",
    nama: "Rutin skincare",
    deskripsi:
      "Wanita 20–35 tahun dengan rutinitas skincare, paham kandungan produk, waspada klaim berlebihan, sering beli ulang produk yang cocok.",
    kelompok: "kecantikan",
  },
  {
    id: "keluarga-baru",
    nama: "Keluarga baru",
    deskripsi:
      "Pasangan muda yang baru menikah atau punya anak pertama, sedang melengkapi rumah, membandingkan harga dan ketahanan barang.",
    kelompok: "rumah tangga",
  },
  {
    id: "penghobi-rumah",
    nama: "Penghobi di rumah",
    deskripsi:
      "Orang 25–45 tahun yang punya hobi di rumah (masak, tanam, baca), rela beli alat yang mempermudah hobi, suka cerita pengalaman.",
    kelompok: "hobi",
  },
  {
    id: "kesehatan-aware",
    nama: "Mulai hidup sehat",
    deskripsi:
      "Orang 27–40 tahun yang baru mulai hidup sehat, cari alat dan konsumsi pendukung, butuh penjelasan sederhana tanpa istilah medis.",
    kelompok: "kesehatan",
  },
  {
    id: "pengirim-hadiah",
    nama: "Pencari kado",
    deskripsi:
      "Orang yang sedang mencari hadiah untuk orang terdekat, butuh cepat, lebih percaya rekomendasi konkret daripada daftar panjang.",
    kelompok: "muda",
  },
] as const;

/** Kelompok usia ala Meta Ads. */
export const PILIHAN_USIA = [
  "18–24 tahun",
  "25–34 tahun",
  "35–44 tahun",
  "45–54 tahun",
  "55+ tahun",
] as const;

export const PILIHAN_GENDER = ["wanita", "pria", "semua"] as const;

/** Chip minat — dipilih multi. */
export const PILIHAN_MINAT = [
  "skincare",
  "masak",
  "dekorasi rumah",
  "kesehatan",
  "gadget",
  "fashion",
  "bayi & anak",
  "hemat ongkir",
  "review jujur",
  "produk halal",
  "organisasi rumah",
  "hobi tanam",
] as const;

/** Chip perilaku belanja — dipilih multi. */
export const PILIHAN_PERILAKU = [
  "pembaca review dulu",
  "impulse buyer",
  "harga sensitif",
  "langganan live shopping",
  "pemburu promo",
  "pembeli ulang",
] as const;

export interface PilihanAudiens {
  usia?: string;
  gender?: string;
  minat: readonly string[];
  perilaku: readonly string[];
}

const gabung = (daftar: readonly string[]): string =>
  daftar.length > 0 ? daftar.join(", ") : "";

/**
 * Susun kalimat audiens dari pilihan chip. Urutan tetap: usia, gender,
 * minat, perilaku — supaya kalimat stabil dan mudah diuji.
 * Mengembalikan string kosong kalau belum ada pilihan sama sekali.
 */
export function bangunDeskripsiAudiens(p: PilihanAudiens): string {
  const bagian: string[] = [];
  if (p.usia) bagian.push(`Usia ${p.usia}`);
  if (p.gender && p.gender !== "semua") bagian.push(p.gender);
  const minat = gabung(p.minat);
  if (minat) bagian.push(`minat: ${minat}`);
  const perilaku = gabung(p.perilaku);
  if (perilaku) bagian.push(`perilaku: ${perilaku}`);
  return bagian.join(", ");
}
