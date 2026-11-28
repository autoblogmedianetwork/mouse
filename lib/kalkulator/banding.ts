/**
 * Perbandingan dua produk (pengembangan Kalkulator Cuan).
 *
 * Pertanyaan yang dijawab: "dari dua produk ini, mana yang lebih cepat
 * balik modal WAKTU?" — waktu = konten yang harus dibuat. Produk dengan
 * komisi per unit lebih besar butuh lebih sedikit konten untuk target
 * yang sama, meski harganya sama.
 */
import { komisiPerUnit, kebutuhanUntukTarget } from "./kalkulator-cuan";

export interface ProdukBanding {
  nama: string;
  harga: number;
  ratePersen: number;
}

export interface HasilBandingProduk {
  nama: string;
  komisiPerUnit: number;
  unitPerBulan: number;
  kontenPerBulan: number;
  kontenPerHari: number;
}

export type HasilBanding =
  | { ok: true; a: HasilBandingProduk; b: HasilBandingProduk; pemenang: "a" | "b" | "seri"; alasan: string }
  | { ok: false; galat: string };

function hitungSisi(p: ProdukBanding, targetBulan: number, penjualanPerKonten: number): HasilBandingProduk | null {
  if (!(p.harga > 0) || !(p.ratePersen > 0)) return null;
  const perUnit = komisiPerUnit(p.harga, p.ratePersen);
  const kebutuhan = kebutuhanUntukTarget(targetBulan, perUnit, penjualanPerKonten);
  if (!kebutuhan) return null;
  return {
    nama: p.nama,
    komisiPerUnit: perUnit,
    unitPerBulan: kebutuhan.unitPerBulan,
    kontenPerBulan: kebutuhan.kontenPerBulan,
    kontenPerHari: kebutuhan.kontenPerHari,
  };
}

export function bandingkanProduk(
  a: ProdukBanding,
  b: ProdukBanding,
  targetBulan: number,
  penjualanPerKonten: number,
): HasilBanding {
  if (!(targetBulan > 0)) return { ok: false, galat: "Target bulanan harus lebih dari 0." };
  if (!(penjualanPerKonten > 0)) {
    return { ok: false, galat: "Estimasi penjualan per konten harus lebih dari 0 (mis. 20 = 1 penjualan tiap 20 konten)." };
  }
  const sisiA = hitungSisi(a, targetBulan, penjualanPerKonten);
  const sisiB = hitungSisi(b, targetBulan, penjualanPerKonten);
  if (!sisiA) return { ok: false, galat: "Produk A: harga dan persen komisi harus lebih dari 0." };
  if (!sisiB) return { ok: false, galat: "Produk B: harga dan persen komisi harus lebih dari 0." };

  if (sisiA.kontenPerBulan === sisiB.kontenPerBulan) {
    return {
      ok: true,
      a: sisiA,
      b: sisiB,
      pemenang: "seri",
      alasan: "Keduanya butuh jumlah konten yang sama untuk target ini — pilih yang paling kamu kuasai ceritanya.",
    };
  }
  const pemenang = sisiA.kontenPerBulan < sisiB.kontenPerBulan ? "a" : "b";
  const menang = pemenang === "a" ? sisiA : sisiB;
  const kalah = pemenang === "a" ? sisiB : sisiA;
  const selisih = kalah.kontenPerBulan - menang.kontenPerBulan;
  return {
    ok: true,
    a: sisiA,
    b: sisiB,
    pemenang,
    alasan: `${menang.nama} lebih hemat waktu: butuh ${selisih} konten lebih sedikit per bulan (${menang.kontenPerBulan} vs ${kalah.kontenPerBulan}) untuk target yang sama.`,
  };
}
