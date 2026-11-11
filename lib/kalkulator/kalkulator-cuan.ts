/**
 * Kalkulator cuan (Gelombang 4): hitung komisi, kebutuhan konten, dan target
 * penghasilan. Fungsi murni supaya mudah diuji; UI hanya menampilkan hasil.
 * Prinsip: angka dari input user + data performa nyata bila ada — tidak ada
 * asumsi tersembunyi.
 */

/** Format angka jadi rupiah tanpa desimal (mis. Rp 120.000). */
export function formatRupiah(nilai: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai);
}

export interface EstimasiKomisi {
  /** Komisi satu penjualan. */
  perUnit: number;
  /** Total kalau terjual sebanyak `jumlahTerjual`. */
  total: number;
}

/** Komisi dari harga produk dan rate persen (mis. rate 10 berarti 10%). */
export function komisiPerUnit(harga: number, ratePersen: number): number {
  return Math.round((harga * ratePersen) / 100);
}

export function estimasiKomisi(
  harga: number,
  ratePersen: number,
  jumlahTerjual: number,
): EstimasiKomisi {
  const perUnit = komisiPerUnit(harga, ratePersen);
  return { perUnit, total: perUnit * jumlahTerjual };
}

export interface KebutuhanTarget {
  /** Berapa unit produk harus terjual per bulan. */
  unitPerBulan: number;
  /** Berapa konten harus dibuat per bulan. */
  kontenPerBulan: number;
  /** Dibulatkan ke atas, minimal 1 kalau target > 0. */
  kontenPerHari: number;
}

/**
 * Kebutuhan konten untuk mencapai target bulanan.
 * `penjualanPerKonten` = estimasi user (mis. 1 penjualan tiap 20 konten = 0.05).
 * Bila ada data nyata, pakai `komisiPerKontenDariData` sebagai pengganti.
 */
export function kebutuhanUntukTarget(
  targetBulan: number,
  komisiPerUnitNilai: number,
  penjualanPerKonten: number,
): KebutuhanTarget | null {
  if (targetBulan <= 0 || komisiPerUnitNilai <= 0 || penjualanPerKonten <= 0) return null;
  const komisiPerKonten = komisiPerUnitNilai * penjualanPerKonten;
  if (komisiPerKonten <= 0) return null;
  const kontenPerBulan = Math.ceil(targetBulan / komisiPerKonten);
  return {
    unitPerBulan: Math.ceil(targetBulan / komisiPerUnitNilai),
    kontenPerBulan,
    kontenPerHari: Math.max(1, Math.ceil(kontenPerBulan / 30)),
  };
}

/** Komisi rata-rata per konten dari data performa nyata. Null kalau data tipis. */
export function komisiPerKontenDariData(
  totalKomisi: number,
  jumlahKontenBerdata: number,
): number | null {
  if (jumlahKontenBerdata < 3 || totalKomisi <= 0) return null;
  return Math.round(totalKomisi / jumlahKontenBerdata);
}
