/**
 * Pembangkit hashtag lokal (Level 3, tanpa API). Menyusun maksimal 10 tagar
 * aman dari nama produk + kategori memakai kamus lokal, lalu menyaring kata
 * berisiko lewat kamus kata terlarang supaya tagar tidak ikut overclaim.
 */
import { mengandungKataTerlarang } from "./kata-terlarang";

export const MAKS_HASHTAG = 10;

/** Tagar umum yang aman untuk konten affiliate Indonesia. */
const TAGAR_UMUM = [
  "racunbelanja",
  "rekomendasiproduk",
  "reviewjujur",
  "belanjahemat",
  "produkviral",
  "tipshemat",
  "wajibpunya",
  "shopeefinds",
];

/** Tagar tambahan per kategori (kunci huruf kecil, dicocokkan longgar). */
const TAGAR_KATEGORI: Record<string, string[]> = {
  fashion: ["ootd", "outfitinspo", "fashionhijab", "styleharian"],
  kecantikan: ["skincareroutine", "beautytips", "glowup", "skincarelokal"],
  perawatan: ["selfcare", "bodycare", "perawatantubuh"],
  elektronik: ["gadget", "techtips", "aksesorisdigital"],
  rumah: ["rumahrapi", "dekorasirumah", "homehacks"],
  dapur: ["dapurpraktis", "peralatanmasak", "masakharian"],
  olahraga: ["workoutdirumah", "olahragamurah", "fitnesspemula"],
  bayi: ["momandbaby", "perlubayi", "ibudananak"],
  makanan: ["kuliner", "snackviral", "makananfavorit"],
  aksesoris: ["aksesorisfashion", "detailoutfit", "tasviral"],
};

function kataDari(teks: string): string[] {
  return teks
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((k) => k.length >= 4);
}

/**
 * Hashtag siap tempel. Nama produk dipecah jadi kata kunci, digabung dengan
 * tagar kategori dan tagar umum, lalu dipotong ke MAKS_HASHTAG tanpa duplikat.
 */
export function bangkitkanHashtag(input: { nama: string; kategori?: string }): string[] {
  const hasil: string[] = [];
  const sudah = new Set<string>();

  const tambah = (tag: string) => {
    const bersih = tag.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (bersih.length < 3 || sudah.has(bersih)) return;
    // Jangan pernah menghasilkan tagar yang memuat klaim berisiko.
    if (mengandungKataTerlarang(bersih)) return;
    sudah.add(bersih);
    hasil.push(`#${bersih}`);
  };

  const namaKata = kataDari(input.nama);
  // Kata pertama + gabungan dua kata pertama (mis. "tumbler" + "tumblerstainless").
  namaKata.slice(0, 3).forEach(tambah);
  if (namaKata.length >= 2) tambah(`${namaKata[0]}${namaKata[1]}`);

  const kategori = (input.kategori ?? "").toLowerCase();
  const kunciKategori = Object.keys(TAGAR_KATEGORI).find(
    (k) => kategori.includes(k) || k.includes(kategori),
  );
  if (kunciKategori) TAGAR_KATEGORI[kunciKategori].forEach(tambah);

  TAGAR_UMUM.forEach(tambah);

  return hasil.slice(0, MAKS_HASHTAG);
}
