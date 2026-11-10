/**
 * Kalkulator komisi affiliate & kalkulasi target cuan bulanan (Gelombang 1 & 2).
 * 100% lokal di browser, tanpa ketergantungan API eksternal.
 */

export interface InputKalkulatorKomisi {
  hargaProduk: number;
  persenKomisi: number;
  targetBulanan: number;
}

export interface HasilKalkulatorKomisi {
  komisiPerPenjualan: number;
  penjualanDibutuhkan: number;
  estimasiOmset: number;
  targetHarian: {
    komisiHarian: number;
    penjualanHarian: number;
  };
}

export function hitungKomisiTarget(input: InputKalkulatorKomisi): HasilKalkulatorKomisi {
  const harga = Math.max(0, Number(input.hargaProduk) || 0);
  const persen = Math.max(0, Number(input.persenKomisi) || 0);
  const target = Math.max(0, Number(input.targetBulanan) || 0);

  const komisiPerPenjualan = Math.round((harga * persen) / 100);

  let penjualanDibutuhkan = 0;
  let estimasiOmset = 0;

  if (komisiPerPenjualan > 0 && target > 0) {
    penjualanDibutuhkan = Math.ceil(target / komisiPerPenjualan);
    estimasiOmset = penjualanDibutuhkan * harga;
  }

  const komisiHarian = Math.round(target / 30);
  const penjualanHarian = penjualanDibutuhkan > 0 ? Math.ceil(penjualanDibutuhkan / 30) : 0;

  return {
    komisiPerPenjualan,
    penjualanDibutuhkan,
    estimasiOmset,
    targetHarian: {
      komisiHarian,
      penjualanHarian,
    },
  };
}
