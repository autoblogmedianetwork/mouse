/**
 * Preset riset audiens (Fase 3-B, ditata ulang per masukan review UI):
 * kategori dipisah tegas — Demografi, Minat, Perilaku belanja, Kebutuhan —
 * dan tiap persona siap pakai membawa kombinasi chip, bukan kategori baru.
 * Data statis, tanpa dependency. Kolom ketik manual tetap ada — preset hanya
 * mengisi, tidak pernah mengunci (PRD F1).
 */

export interface ChipPersona {
  usia?: string;
  gender?: string;
  minat: readonly string[];
  kebutuhan: readonly string[];
  perilaku: readonly string[];
}

export interface KartuPersona {
  id: string;
  nama: string;
  /** Kalimat yang langsung mengisi kolom "Target audiens". */
  deskripsi: string;
  /** Niche yang paling cocok untuk persona ini (petunjuk, bukan paksaan). */
  kelompok: string;
  /** Kombinasi chip yang diisi otomatis saat persona dipilih. */
  chips: ChipPersona;
}

export const KARTU_PERSONA: readonly KartuPersona[] = [
  {
    id: "ibu-muda",
    nama: "Ibu muda 25–40",
    deskripsi:
      "Ibu muda 25–40 tahun, belanja online rutin untuk rumah dan anak, aktif di grup WhatsApp, percaya review sebelum beli.",
    kelompok: "rumah tangga",
    chips: {
      usia: "25–34 tahun",
      gender: "wanita",
      minat: ["bayi & anak", "organisasi rumah"],
      kebutuhan: ["hemat ongkir", "review jujur"],
      perilaku: ["pembaca review dulu"],
    },
  },
  {
    id: "mahasiswa",
    nama: "Mahasiswa",
    deskripsi:
      "Mahasiswa 18–24 tahun, budget terbatas, keputusan beli cepat dari TikTok dan rekomendasi teman, suka barang estetik tapi murah.",
    kelompok: "muda",
    chips: {
      usia: "18–24 tahun",
      gender: "semua",
      minat: ["fashion", "gadget"],
      kebutuhan: ["harga sensitif"],
      perilaku: ["impulse buyer"],
    },
  },
  {
    id: "pekerja-kantoran",
    nama: "Pekerja kantoran",
    deskripsi:
      "Pekerja kantoran 24–35 tahun, cari yang praktis dan hemat waktu, belanja malam lewat ponsel, sensitif terhadap ongkir.",
    kelompok: "pekerja",
    chips: {
      usia: "25–34 tahun",
      gender: "semua",
      minat: [],
      kebutuhan: ["hemat ongkir"],
      perilaku: ["langganan live shopping"],
    },
  },
  {
    id: "wirausaha-rumahan",
    nama: "Wirausaha rumahan",
    deskripsi:
      "Pemilik usaha kecil di rumah, belanja alat dan bahan untuk usaha, hitung untung-rugi detail, suka promo grosir.",
    kelompok: "pekerja",
    chips: {
      gender: "semua",
      minat: [],
      kebutuhan: ["harga sensitif"],
      perilaku: ["pemburu promo"],
    },
  },
  {
    id: "gadget-freak",
    nama: "Penggila gadget",
    deskripsi:
      "Pria 20–35 tahun yang mengikuti review gadget, membandingkan spesifikasi sebelum beli, rela menabung untuk barang yang pas.",
    kelompok: "hobi",
    chips: {
      usia: "25–34 tahun",
      gender: "pria",
      minat: ["gadget"],
      kebutuhan: ["review jujur"],
      perilaku: ["pembaca review dulu"],
    },
  },
  {
    id: "kecantikan-aware",
    nama: "Rutin skincare",
    deskripsi:
      "Wanita 20–35 tahun dengan rutinitas skincare, paham kandungan produk, waspada klaim berlebihan, sering beli ulang produk yang cocok.",
    kelompok: "kecantikan",
    chips: {
      usia: "25–34 tahun",
      gender: "wanita",
      minat: ["skincare"],
      kebutuhan: ["review jujur"],
      perilaku: ["pembeli ulang"],
    },
  },
  {
    id: "keluarga-baru",
    nama: "Keluarga baru",
    deskripsi:
      "Pasangan muda yang baru menikah atau punya anak pertama, sedang melengkapi rumah, membandingkan harga dan ketahanan barang.",
    kelompok: "rumah tangga",
    chips: {
      usia: "25–34 tahun",
      gender: "semua",
      minat: ["dekorasi rumah", "bayi & anak"],
      kebutuhan: ["harga sensitif"],
      perilaku: ["pembaca review dulu"],
    },
  },
  {
    id: "penghobi-rumah",
    nama: "Penghobi di rumah",
    deskripsi:
      "Orang 25–45 tahun yang punya hobi di rumah (masak, tanam, baca), rela beli alat yang mempermudah hobi, suka cerita pengalaman.",
    kelompok: "hobi",
    chips: {
      usia: "25–34 tahun",
      gender: "semua",
      minat: ["masak", "hobi tanam"],
      kebutuhan: [],
      perilaku: ["pembeli ulang"],
    },
  },
  {
    id: "kesehatan-aware",
    nama: "Mulai hidup sehat",
    deskripsi:
      "Orang 27–40 tahun yang baru mulai hidup sehat, cari alat dan konsumsi pendukung, butuh penjelasan sederhana tanpa istilah medis.",
    kelompok: "kesehatan",
    chips: {
      usia: "25–34 tahun",
      gender: "semua",
      minat: ["kesehatan", "olahraga"],
      kebutuhan: [],
      perilaku: ["pembaca review dulu"],
    },
  },
  {
    id: "pengirim-hadiah",
    nama: "Pencari kado",
    deskripsi:
      "Orang yang sedang mencari hadiah untuk orang terdekat, butuh cepat, lebih percaya rekomendasi konkret daripada daftar panjang.",
    kelompok: "muda",
    chips: {
      gender: "semua",
      minat: [],
      kebutuhan: [],
      perilaku: ["impulse buyer"],
    },
  },
] as const;

// ------------------------------------------------------------- demografi --
/** Kelompok usia ala Meta Ads. */
export const PILIHAN_USIA = [
  "18–24 tahun",
  "25–34 tahun",
  "35–44 tahun",
  "45–54 tahun",
  "55+ tahun",
] as const;

export const PILIHAN_GENDER = ["wanita", "pria", "semua"] as const;

// ------------------------------------------------------------------ minat --
/** Chip minat — kebiasaan atau topik, dipilih multi. */
export const PILIHAN_MINAT = [
  "skincare",
  "masak",
  "dekorasi rumah",
  "kesehatan",
  "gadget",
  "fashion",
  "bayi & anak",
  "organisasi rumah",
  "hobi tanam",
  "olahraga",
] as const;

// -------------------------------------------------------- perilaku belanja --
/** Chip perilaku belanja — cara membeli, dipilih multi. */
export const PILIHAN_PERILAKU = [
  "pembaca review dulu",
  "impulse buyer",
  "langganan live shopping",
  "pemburu promo",
  "pembeli ulang",
] as const;

// -------------------------------------------------------------- kebutuhan --
/** Chip kebutuhan — masalah yang ingin diselesaikan, dipilih multi. */
export const PILIHAN_KEBUTUHAN = [
  "hemat ongkir",
  "produk halal",
  "harga sensitif",
  "review jujur",
] as const;

export interface PilihanAudiens {
  usia?: string;
  gender?: string;
  minat: readonly string[];
  kebutuhan: readonly string[];
  perilaku: readonly string[];
}

const gabung = (daftar: readonly string[]): string =>
  daftar.length > 0 ? daftar.join(", ") : "";

/**
 * Susun kalimat audiens dari pilihan chip. Urutan tetap: usia, gender,
 * minat, kebutuhan, perilaku — supaya kalimat stabil dan mudah diuji.
 * Mengembalikan string kosong kalau belum ada pilihan sama sekali.
 */
export function bangunDeskripsiAudiens(p: PilihanAudiens): string {
  const bagian: string[] = [];
  if (p.usia) bagian.push(`Usia ${p.usia}`);
  if (p.gender && p.gender !== "semua") bagian.push(p.gender);
  const minat = gabung(p.minat);
  if (minat) bagian.push(`minat: ${minat}`);
  const kebutuhan = gabung(p.kebutuhan);
  if (kebutuhan) bagian.push(`kebutuhan: ${kebutuhan}`);
  const perilaku = gabung(p.perilaku);
  if (perilaku) bagian.push(`perilaku: ${perilaku}`);
  return bagian.join(", ");
}

/**
 * Bandingkan pilihan chip saat ini dengan chip milik persona.
 * Dipakai untuk menampilkan tanda "dimodifikasi dari persona X".
 */
export function personaDimodifikasi(
  kartu: KartuPersona,
  p: PilihanAudiens,
): boolean {
  const c = kartu.chips;
  const sama = (
    a: readonly string[] | undefined,
    b: readonly string[] | undefined,
  ) =>
    (a ?? []).length === (b ?? []).length &&
    (a ?? []).every((x) => (b ?? []).includes(x));
  return (
    (p.usia ?? undefined) !== (c.usia ?? undefined) ||
    (p.gender ?? "semua") !== (c.gender ?? "semua") ||
    !sama(p.minat, c.minat) ||
    !sama(p.kebutuhan, c.kebutuhan) ||
    !sama(p.perilaku, c.perilaku)
  );
}
