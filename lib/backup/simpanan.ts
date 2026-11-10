/**
 * Cadangkan & pulihkan data localStorage (Fase 4-B).
 *
 * Data utama aplikasi tinggal di localStorage (prinsip "data milik user").
 * Kalau cache browser terhapus, data hilang. Fitur ini adalah asuransinya:
 * satu file JSON berisi semua kunci `autothreads-*`, dan pulihkan yang
 * memvalidasi dulu sebelum menimpa apa pun. Tidak ada jaringan, tidak ada
 * dependensi baru.
 */

export const CADANGAN_VERSI = 1;
export const CADANGAN_AWALAN = "autothreads-";

export interface BerkasCadangan {
  /** Versi bentuk berkas; naik kalau bentuknya berubah nanti. */
  versi: number;
  dibuat: string;
  jumlah_kunci: number;
  /** Kunci localStorage (tanpa awalan autothreads-) -> nilai mentah string. */
  isi: Record<string, string>;
}

export interface HasilCadangkan {
  ok: boolean;
  pesan: string;
  berkas?: BerkasCadangan;
}

export interface HasilPulihkan {
  ok: boolean;
  pesan: string;
  dipulihkan: number;
}

/** Kunci yang memang milik aplikasi (awalan autothreads-). */
export function kunciMilikAplikasi(): string[] {
  if (typeof window === "undefined") return [];
  const keluar: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const kunci = window.localStorage.key(i);
    if (kunci && kunci.startsWith(CADANGAN_AWALAN)) keluar.push(kunci);
  }
  return keluar.sort();
}

/**
 * Kumpulkan semua data aplikasi jadi satu objek cadangan. Fungsi murni terhadap
 * sumber (Storage diuji lewat jsdom); tidak menulis apa pun.
 */
export function kumpulkanCadangan(
  baca: (kunci: string) => string | null = (k) => window.localStorage.getItem(k),
  daftarKunci: string[] = kunciMilikAplikasi(),
): HasilCadangkan {
  if (daftarKunci.length === 0) {
    return { ok: false, pesan: "Belum ada data untuk dicadangkan." };
  }
  const isi: Record<string, string> = {};
  for (const kunci of daftarKunci) {
    const nilai = baca(kunci);
    if (nilai !== null) isi[kunci] = nilai;
  }
  const berkas: BerkasCadangan = {
    versi: CADANGAN_VERSI,
    dibuat: new Date().toISOString(),
    jumlah_kunci: Object.keys(isi).length,
    isi,
  };
  return {
    ok: true,
    pesan: `${berkas.jumlah_kunci} kelompok data siap diunduh.`,
    berkas,
  };
}

/** Validasi berkas cadangan sebelum dipakai menimpa apa pun. */
export function validasiBerkasCadangan(teks: string): BerkasCadangan | null {
  try {
    const data = JSON.parse(teks) as Partial<BerkasCadangan>;
    if (typeof data.versi !== "number" || data.versi < 1) return null;
    if (typeof data.isi !== "object" || data.isi === null) return null;
    const isiMentah = data.isi as Record<string, unknown>;
    const isi: Record<string, string> = {};
    for (const [kunci, nilai] of Object.entries(isiMentah)) {
      if (typeof nilai !== "string") return null;
      isi[kunci] = nilai;
    }
    return {
      versi: data.versi,
      dibuat: String(data.dibuat ?? ""),
      jumlah_kunci: Object.keys(isi).length,
      isi,
    };
  } catch {
    return null;
  }
}

/**
 * Pulihkan: tulis kembali semua kunci dari berkas cadangan. Kunci yang bukan
 * milik aplikasi diabaikan (penjagaan keamanan). Tidak menghapus kunci yang
 * tidak ada di cadangan — pemulihan bersifat menimpa, bukan menghapus.
 */
export function pulihkanCadangan(
  berkas: BerkasCadangan,
  tulis: (kunci: string, nilai: string) => void = (k, v) => window.localStorage.setItem(k, v),
): HasilPulihkan {
  let dipulihkan = 0;
  for (const [kunci, nilai] of Object.entries(berkas.isi)) {
    if (!kunci.startsWith(CADANGAN_AWALAN)) continue;
    tulis(kunci, nilai);
    dipulihkan += 1;
  }
  return {
    ok: dipulihkan > 0,
    pesan:
      dipulihkan > 0
        ? `${dipulihkan} kelompok data dipulihkan. Muat ulang halaman untuk melihat hasilnya.`
        : "Berkas tidak berisi data aplikasi yang bisa dipulihkan.",
    dipulihkan,
  };
}
