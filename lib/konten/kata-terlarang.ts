/**
 * Aturan deteksi kata klaim berlebihan dan pelanggaran platform (ADR 0020).
 * Murni lokal tanpa AI untuk menjaga keamanan akun affiliate.
 */

export interface KataTerlarangRule {
  kata: string;
  alasan: string;
  kategori: "klaim_berlebihan" | "pelanggaran_platform" | "urgensi_palsu";
  saran?: string;
}

export const DAFTAR_KATA_TERLARANG: KataTerlarangRule[] = [
  // Klaim Berlebihan (Overclaiming)
  { kata: "terbaik", alasan: "Klaim absolut tanpa bukti resmi", kategori: "klaim_berlebihan", saran: "salah satu favorit" },
  { kata: "paling murah", alasan: "Harga marketplace dinamis", kategori: "klaim_berlebihan", saran: "harganya terjangkau" },
  { kata: "termurah", alasan: "Klaim harga terendah rawan sanggahan", kategori: "klaim_berlebihan", saran: "ramah kantong" },
  { kata: "100%", alasan: "Klaim kesempurnaan absolut", kategori: "klaim_berlebihan", saran: "sangat / terbukti" },
  { kata: "dijamin", alasan: "Janji garansi tanpa dasar hukum listing", kategori: "klaim_berlebihan", saran: "bisa dicoba" },
  { kata: "pasti sembuh", alasan: "Klaim medis dilarang keras", kategori: "klaim_berlebihan" },
  { kata: "tanpa efek samping", alasan: "Klaim keamanan absolut produk", kategori: "klaim_berlebihan" },
  { kata: "garansi seumur hidup", alasan: "Harus sesuai deskripsi resmi seller", kategori: "klaim_berlebihan" },

  // Pelanggaran UI / Manipulasi Marketplace
  { kata: "klik keranjang kuning", alasan: "Penyebutan langsung elemen UI spesifik", kategori: "pelanggaran_platform", saran: "cek link di bio / bawah" },
  { kata: "klik keranjang", alasan: "Pemicu penalti algoritma di beberapa platform", kategori: "pelanggaran_platform", saran: "cek tautan produk" },
  { kata: "keranjang kuning", alasan: "Frasa terlarang di Threads/non-TikTok", kategori: "pelanggaran_platform", saran: "link produk" },
  { kata: "check out sekarang", alasan: "Agresif hard-selling", kategori: "pelanggaran_platform", saran: "bisa dicek dulu" },
  
  // Urgensi Palsu (False Urgency)
  { kata: "sebelum kehabisan", alasan: "Urgensi palsu pemicu filter spam", kategori: "urgensi_palsu", saran: "stok terbatas sesuai seller" },
  { kata: "stok habis", alasan: "Klaim stok kecuali terverifikasi", kategori: "urgensi_palsu" },
  { kata: "hanya hari ini", alasan: "Klaim waktu promo sepihak", kategori: "urgensi_palsu" },
];

export interface HasilDeteksiKata {
  ditemukan: boolean;
  temuan: {
    rule: KataTerlarangRule;
    posisiTeks: string;
  }[];
}

/**
 * Memeriksa satu teks atau beberapa baris status terhadap daftar kata terlarang.
 */
export function periksaKataTerlarang(teksAtauList: string | string[]): HasilDeteksiKata {
  const gabungan = Array.isArray(teksAtauList) ? teksAtauList.join(" \n ") : teksAtauList;
  if (!gabungan || !gabungan.trim()) {
    return { ditemukan: false, temuan: [] };
  }

  const temuan: HasilDeteksiKata["temuan"] = [];
  const teksKecil = gabungan.toLowerCase();

  for (const rule of DAFTAR_KATA_TERLARANG) {
    const kataKecil = rule.kata.toLowerCase();
    const escaped = kataKecil.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    // Gunakan word boundary jika awal/akhir adalah karakter kata (\w), jika simbol seperti % gunakan boundary non-kata
    const prefix = /^\w/.test(kataKecil) ? "\\b" : "(?:^|\\s)";
    const suffix = /\w$/.test(kataKecil) ? "\\b" : "(?:$|\\s)";
    const regex = new RegExp(`${prefix}${escaped}${suffix}`, "i");
    if (regex.test(teksKecil)) {
      temuan.push({
        rule,
        posisiTeks: rule.kata,
      });
    }
  }

  return {
    ditemukan: temuan.length > 0,
    temuan,
  };
}
