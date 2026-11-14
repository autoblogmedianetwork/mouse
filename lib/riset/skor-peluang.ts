/**
 * Skor kelayakan peluang (Fase 3, task 3-A).
 *
 * Fungsi murni supaya urutan dan penandaan bisa diuji tanpa React atau AI.
 * Skor datang dari prompt peluang-produk.v2; data lama (tanpa skor) tetap
 * dianggap 0 sehingga berada di urutan bawah, bukan error.
 */

export interface SkorPeluang {
  permintaan: number;
  kompetisi: number;
  kemudahan_konten: number;
  potensi_komisi: number;
  alasan_permintaan?: string;
  alasan_kompetisi?: string;
  alasan_kemudahan_konten?: string;
  alasan_potensi_komisi?: string;
}

export interface PeluangBerskor {
  skor_total?: number | null;
  /** Bentuk longgar: skor dari DB/prompt bisa berupa record bebas. */
  skor?: Record<string, unknown> | null;
}

/** Batas bawah sebuah kategori disebut "layak dikerjakan lebih dulu". */
export const AMBANG_DIREKOMENDASIKAN = 16;

export function skorTotal(p: PeluangBerskor): number {
  if (typeof p.skor_total === "number" && Number.isFinite(p.skor_total)) {
    return p.skor_total;
  }
  const s = p.skor;
  if (!s) return 0;
  const angka = (kunci: string) => {
    const nilai = Number(s[kunci]);
    return Number.isFinite(nilai) ? nilai : 0;
  };
  return (
    angka("permintaan") +
    angka("kompetisi") +
    angka("kemudahan_konten") +
    angka("potensi_komisi")
  );
}

/**
 * Urutkan dari skor tertinggi ke terendah. Stabil: skor sama mempertahankan
 * urutan asli dari AI, jadi tampilan tidak berubah-ubah antarrender.
 */
export function urutkanMenurutSkor<T extends PeluangBerskor>(daftar: readonly T[]): T[] {
  return daftar
    .map((item, indeks) => ({ item, indeks, skor: skorTotal(item) }))
    .sort((a, b) => (b.skor - a.skor) || (a.indeks - b.indeks))
    .map((x) => x.item);
}

export function direkomendasikan(p: PeluangBerskor): boolean {
  return skorTotal(p) >= AMBANG_DIREKOMENDASIKAN;
}

/**
 * Ambang "layak" proporsional untuk skor yang tidak memakai empat pilar penuh
 * (mis. Tempel Cepat hanya menilai dua pilar, maks 10). Setara dengan
 * AMBANG_DIREKOMENDASIKAN pada skala MAKS_PENUH, jadi makna "layak" tetap satu
 * di seluruh aplikasi dan tidak bisa berbeda antar fitur.
 */
const MAKS_PENUH = 20;

export function layakProporsional(total: number, maks: number): boolean {
  if (maks <= 0) return false;
  return total >= (AMBANG_DIREKOMENDASIKAN / MAKS_PENUH) * maks;
}
