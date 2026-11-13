/**
 * Tempel Cepat (Riset) — membaca data produk dari teks yang user salin dari
 * Shopee/Tokopedia/TikTok, lalu menilai kelayakan dari 2 pilar yang bisa
 * dihitung dari data nyata (permintaan + potensi komisi).
 *
 * Bukan scraping: tidak ada request ke marketplace, hanya pengurai teks.
 * Pilar kompetisi & kemudahan konten tetap perlu penilaian sendiri/AI.
 */
import { labelMarketplace } from "@/lib/affiliate/rules";
import { komisiPerUnit, kebutuhanUntukTarget } from "@/lib/kalkulator/kalkulator-cuan";

export interface ProdukTempelan {
  nama: string;
  harga: number | null;
  terjual: number | null;
  rating: number | null;
  link: string;
  marketplace: string;
}

export interface PilarSkor {
  nama: string;
  nilai: number;
  maks: number;
  alasan: string;
}

export interface HasilTempelCepat {
  produk: ProdukTempelan;
  pilar: PilarSkor[];
  total: number;
  maks: number;
  /** Komisi per penjualan (rupiah) memakai rate yang diberikan. */
  komisiPerPenjualan: number;
  /** Penjualan per bulan yang dibutuhkan untuk menembus target. */
  penjualanUntukTarget: number | null;
  layak: boolean;
  catatan: string[];
}

const POLA_LINK = /https?:\/\/[^\s]+/i;

/** Ubah "89rb"/"2,3rb"/"1,2 jt"/"89.000" menjadi angka. */
export function uraiAngka(teks: string): number | null {
  const bersih = teks.toLowerCase().replace(/\s+/g, "");
  const m = bersih.match(/(\d+(?:[.,]\d+)?)(rb|ribu|k|jt|juta)?/);
  if (!m) return null;
  const dasar = Number(m[1].replace(",", "."));
  if (!Number.isFinite(dasar)) return null;
  const satuan = m[2];
  if (satuan === "rb" || satuan === "ribu" || satuan === "k") return Math.round(dasar * 1_000);
  if (satuan === "jt" || satuan === "juta") return Math.round(dasar * 1_000_000);
  // Tanpa satuan: "89.000" -> 89000, "89,000" -> 89000, "4.8" tetap 4.8.
  if (/^\d{1,3}([.,]\d{3})+$/.test(m[1])) return Number(m[1].replace(/[.,]/g, ""));
  return dasar;
}

function cariHarga(teks: string): number | null {
  // "Rp89.000", "89rb", "harga 89000" — hindari menangkap rating/terjual.
  const polaRp = teks.match(/rp\.?\s*([\d.,]+)\s*(rb|ribu|jt|juta|k)?/i);
  if (polaRp) {
    const n = uraiAngka(polaRp[1] + (polaRp[2] ?? ""));
    if (n !== null && n >= 500) return n;
  }
  const polaAngka = teks.match(/([\d][\d.,]*)\s*(rb|ribu|jt|juta)\b/i);
  if (polaAngka) {
    const n = uraiAngka(polaAngka[1] + polaAngka[2]);
    if (n !== null) return n;
  }
  return null;
}

function cariTerjual(teks: string): number | null {
  const m = teks.match(/([\d.,]+\s*(?:rb|ribu|jt|juta|k)?)\s*(?:terjual|sold|terjual\s*:?)/i);
  if (!m) return null;
  return uraiAngka(m[1]);
}

function cariRating(teks: string): number | null {
  // 1) Paling kuat: ditandai bintang / kata rating. Shopee menulis "4,9".
  const ditandai = teks.match(/(?:⭐|bintang|rating)\s*:?\s*([0-5](?:[.,]\d+)?)/i);
  if (ditandai) {
    const n = Number(ditandai[1].replace(",", "."));
    if (n >= 0 && n <= 5) return Math.round(n * 10) / 10;
  }
  // 2) Desimal apa pun 0-5 yang berdiri sendiri ("4.9", "4,9").
  const desimal = teks.match(/\b([0-5][.,]\d{1,2})\b/);
  if (desimal) {
    const n = Number(desimal[1].replace(",", "."));
    if (n >= 0 && n <= 5) return Math.round(n * 10) / 10;
  }
  // 3) Bilangan bulat 0-5 hanya bila jelas soal rating.
  const bulat = teks.match(/(?:⭐|bintang|rating)\s*:?\s*([0-5])\b/i);
  if (bulat) return Number(bulat[1]);
  return null;
}

/** Ambil nama: baris terpanjang yang bukan angka/link/baris metadata. */
function cariNama(teks: string): string {
  const baris = teks
    .split(/\r?\n|·|\||;|\u2022/)
    .map((b) => b.trim())
    .filter((b) => b !== "" && !POLA_LINK.test(b))
    .filter((b) => !/(terjual|sold|rating|⭐|rp\s?[\d])/i.test(b))
    .filter((b) => !/^[\d.,\s%]+$/.test(b));
  if (baris.length === 0) return "";
  return baris.reduce((a, b) => (b.length > a.length ? b : a), "").slice(0, 200);
}

/** Urai teks tempelan menjadi data produk terstruktur. */
export function uraiTempelan(teks: string): ProdukTempelan {
  const mentah = (teks ?? "").trim();
  const link = (mentah.match(POLA_LINK)?.[0] ?? "").replace(/[),.]+$/, "");
  return {
    nama: cariNama(mentah),
    harga: cariHarga(mentah),
    terjual: cariTerjual(mentah),
    rating: cariRating(mentah),
    link,
    // labelMarketplace menerima URL; null untuk link kosong.
    marketplace: labelMarketplace(link) ?? "",
  };
}

/** Skor permintaan 0-5 dari bukti penjualan + rating. */
export function skorPermintaan(terjual: number | null, rating: number | null): PilarSkor {
  let nilai = 0;
  const alasan: string[] = [];
  if (terjual !== null) {
    if (terjual >= 1_000) {
      nilai = 5;
      alasan.push(`${terjual.toLocaleString("id-ID")} terjual — permintaan terbukti kuat`);
    } else if (terjual >= 300) {
      nilai = 4;
      alasan.push(`${terjual.toLocaleString("id-ID")} terjual — permintaan bagus`);
    } else if (terjual >= 100) {
      nilai = 3;
      alasan.push(`${terjual.toLocaleString("id-ID")} terjual — cukup laku`);
    } else if (terjual >= 20) {
      nilai = 2;
      alasan.push(`${terjual.toLocaleString("id-ID")} terjual — baru mulai`);
    } else {
      nilai = 1;
      alasan.push(`${terjual.toLocaleString("id-ID")} terjual — sepi`);
    }
  } else {
    alasan.push("Jumlah terjual tidak terbaca");
  }
  if (rating !== null) {
    if (rating >= 4.7 && nilai < 5) {
      nilai += 1;
      alasan.push(`rating ${rating} menambah keyakinan`);
    } else if (rating < 4) {
      nilai = Math.max(0, nilai - 1);
      alasan.push(`rating ${rating} rendah — banyak keluhan`);
    }
  }
  return { nama: "Permintaan", nilai: Math.min(5, nilai), maks: 5, alasan: alasan.join("; ") };
}

/** Skor potensi komisi 0-5 dari komisi per penjualan. */
export function skorPotensiKomisi(harga: number | null, ratePersen: number): PilarSkor {
  if (harga === null || harga <= 0) {
    return { nama: "Potensi komisi", nilai: 0, maks: 5, alasan: "Harga tidak terbaca" };
  }
  const komisi = komisiPerUnit(harga, ratePersen);
  let nilai = 1;
  if (komisi >= 50_000) nilai = 5;
  else if (komisi >= 20_000) nilai = 4;
  else if (komisi >= 8_000) nilai = 3;
  else if (komisi >= 3_000) nilai = 2;
  return {
    nama: "Potensi komisi",
    nilai,
    maks: 5,
    alasan: `Komisi ±Rp${komisi.toLocaleString("id-ID")} per penjualan (${ratePersen}% dari Rp${harga.toLocaleString("id-ID")})`,
  };
}

/**
 * Nilai produk tempelan. Total maksimal 10 (2 pilar), label "layak" memakai
 * ambang proporsional 8/10 — setara 16/20 pada skor 4 pilar.
 */
export function nilaiTempelan(
  produk: ProdukTempelan,
  opsi: { ratePersen?: number; targetBulan?: number } = {},
): HasilTempelCepat {
  const rate = opsi.ratePersen ?? 10;
  const pilar = [skorPermintaan(produk.terjual, produk.rating), skorPotensiKomisi(produk.harga, rate)];
  const total = pilar.reduce((a, p) => a + p.nilai, 0);
  const maks = pilar.reduce((a, p) => a + p.maks, 0);
  const komisiPerPenjualan = produk.harga ? komisiPerUnit(produk.harga, rate) : 0;

  let penjualanUntukTarget: number | null = null;
  if (opsi.targetBulan !== undefined && komisiPerPenjualan > 0) {
    const kebutuhan = kebutuhanUntukTarget(opsi.targetBulan, komisiPerPenjualan, 1);
    penjualanUntukTarget = kebutuhan ? kebutuhan.unitPerBulan : null;
  }

  const catatan: string[] = [];
  if (produk.harga === null) catatan.push("Harga belum terbaca — isi manual agar potensi komisi dihitung.");
  if (produk.terjual === null) catatan.push("Jumlah terjual belum terbaca — permintaan dinilai 0.");
  if (!produk.link) catatan.push("Link belum ada — tempel link afiliasi agar produk bisa dipakai.");
  if (!produk.nama) catatan.push("Nama produk belum terbaca — isi manual.");

  return {
    produk,
    pilar,
    total,
    maks,
    komisiPerPenjualan,
    penjualanUntukTarget,
    layak: total >= 8,
    catatan,
  };
}
