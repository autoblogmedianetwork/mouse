/**
 * Dedupe dan agregasi performa affiliate (Fase 6: Analitik dari data impor).
 *
 * Semua fungsi di sini murni (tanpa akses storage) supaya bisa diuji dan
 * dipakai ulang oleh dashboard, halaman Analitik, maupun exporter nanti.
 */
import type { Marketplace } from "./marketplace";
import type { BarisPerforma } from "./skema";

/**
 * Kunci dedupe. Kalau ada ID pesanan, satu pesanan dihitung sekali walau
 * laporannya tumpang tindih. Tanpa ID pesanan, kunci memakai produk+tanggal+komisi
 * supaya impor berulang file yang sama tetap tidak menggandakan.
 */
export function kunciBaris(b: {
  marketplace: string;
  id_pesanan?: string;
  produk?: string;
  tanggal?: string | null;
  komisi?: number;
}): string {
  const bersih = (s: string) => s.trim().toLowerCase();
  if (b.id_pesanan && bersih(b.id_pesanan) !== "") {
    return `${b.marketplace}|${bersih(b.id_pesanan)}|${bersih(b.produk ?? "")}`;
  }
  return `${b.marketplace}|-|${bersih(b.produk ?? "")}|${b.tanggal ?? ""}|${b.komisi ?? 0}`;
}

/** FNV-1a 32-bit: id pendek yang stabil dari kunci dedupe. */
export function buatIdBaris(kunci: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < kunci.length; i += 1) {
    hash ^= kunci.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `p${hash.toString(16).padStart(8, "0")}`;
}

export interface HasilGabung {
  baris: BarisPerforma[];
  ditambah: number;
  diperbarui: number;
}

/**
 * Gabungkan baris baru ke simpanan lama. Baris dengan kunci sama dianggap
 * pembaruan (laporan berikutnya biasanya lebih akurat, misalnya status berubah
 * dari menunggu ke selesai), bukan duplikat baru.
 */
export function gabungPerforma(lama: BarisPerforma[], baru: BarisPerforma[]): HasilGabung {
  const peta = new Map<string, BarisPerforma>();
  for (const b of lama) peta.set(kunciBaris(b), b);

  let ditambah = 0;
  let diperbarui = 0;
  for (const b of baru) {
    const kunci = kunciBaris(b);
    if (peta.has(kunci)) diperbarui += 1;
    else ditambah += 1;
    peta.set(kunci, b);
  }

  const baris = [...peta.values()].sort((a, b) => (b.tanggal ?? "").localeCompare(a.tanggal ?? ""));
  return { baris, ditambah, diperbarui };
}

export interface RingkasanMarketplace {
  marketplace: Marketplace;
  komisi: number;
  gmv: number;
  pesanan: number;
  klik: number;
  baris: number;
}

export interface PeringkatProduk {
  produk: string;
  marketplace: Marketplace;
  komisi: number;
  gmv: number;
  pesanan: number;
  klik: number;
}

export interface TitikBulanan {
  bulan: string;
  label: string;
  komisi: number;
  gmv: number;
  pesanan: number;
}

export interface RingkasanPerforma {
  baris: number;
  /** Baris penjualan saja; baris klik dari ekspor analitik tidak dihitung. */
  baris_penjualan: number;
  pesanan: number;
  produk: number;
  /** Total klik dari laporan marketplace (klik manual ditambahkan di atribusi). */
  klik: number;
  /** Pesanan dibagi klik, dalam persen. 0 bila klik tidak tersedia. */
  konversi: number;
  /** Baris analitik (klik/impresi) yang bukan pesanan. */
  baris_klik: number;
  /** Baris pesanan berstatus batal; tidak dihitung di `pesanan`. */
  pesanan_batal: number;
  komisi: number;
  komisi_selesai: number;
  komisi_tertunda: number;
  komisi_batal: number;
  gmv: number;
  gmv_selesai: number;
  /** Komisi dibagi GMV, dalam persen. */
  persen_komisi: number;
  rata_komisi: number;
  per_marketplace: RingkasanMarketplace[];
  teratas: PeringkatProduk[];
  bulanan: TitikBulanan[];
  awal: string | null;
  akhir: string | null;
}

const NAMA_BULAN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

/** Hanya status selesai yang dihitung sebagai komisi cair; sisanya dipisah. */
function kelompokKomisi(baris: BarisPerforma): "selesai" | "batal" | "lain" {
  if (baris.status_kode === "selesai") return "selesai";
  if (baris.status_kode === "batal") return "batal";
  return "lain";
}

export function ringkasPerforma(baris: BarisPerforma[]): RingkasanPerforma {
  let komisi = 0;
  let komisiSelesai = 0;
  let komisiTertunda = 0;
  let komisiBatal = 0;
  let gmv = 0;
  let gmvSelesai = 0;
  const pesanan = new Set<string>();
  const produk = new Set<string>();
  const perMkt = new Map<Marketplace, RingkasanMarketplace>();
  const perProduk = new Map<string, PeringkatProduk>();
  const perBulan = new Map<string, TitikBulanan>();
  let klik = 0;
  let barisPenjualan = 0;
  let barisKlik = 0;
  let barisBatal = 0;
  let awal: string | null = null;
  let akhir: string | null = null;

  baris.forEach((b, i) => {
    const penjualan = b.jenis !== "klik";
    klik += b.klik;

    const mkt = perMkt.get(b.marketplace) ?? {
      marketplace: b.marketplace,
      komisi: 0,
      gmv: 0,
      pesanan: 0,
      klik: 0,
      baris: 0,
    };
    mkt.klik += b.klik;
    mkt.baris += 1;
    perMkt.set(b.marketplace, mkt);

    const entriProduk = b.produk.trim() !== "" ? perProduk.get(`${b.produk.trim().toLowerCase()}|${b.marketplace}`) ?? {
      produk: b.produk.trim(),
      marketplace: b.marketplace,
      komisi: 0,
      gmv: 0,
      pesanan: 0,
      klik: 0,
    } : null;
    if (entriProduk) {
      entriProduk.klik += b.klik;
      perProduk.set(`${b.produk.trim().toLowerCase()}|${b.marketplace}`, entriProduk);
    }

    // Produk unik dihitung dari semua baris, termasuk produk yang baru diklik
    // dan belum menghasilkan komisi.
    if (b.produk.trim() !== "") produk.add(b.produk.trim().toLowerCase());

    if (!penjualan) {
      barisKlik += 1;
      return;
    }

    barisPenjualan += 1;
    komisi += b.komisi;
    gmv += b.harga;
    const kelompok = kelompokKomisi(b);
    if (kelompok === "selesai") {
      komisiSelesai += b.komisi;
      gmvSelesai += b.harga;
    } else if (kelompok === "batal") {
      komisiBatal += b.komisi;
      barisBatal += 1;
    } else {
      komisiTertunda += b.komisi;
    }

    // Pesanan yang dibatalkan tidak dihitung sebagai pesanan, supaya angka di
    // kartu ringkasan sama dengan angka di tabel per konten.
    if (b.status_kode !== "batal") {
      pesanan.add(b.id_pesanan && b.id_pesanan.trim() !== "" ? b.id_pesanan : `baris-${i}`);
    }

    mkt.komisi += b.komisi;
    mkt.gmv += b.harga;

    if (entriProduk) {
      entriProduk.komisi += b.komisi;
      entriProduk.gmv += b.harga;
      entriProduk.pesanan += b.id_pesanan.trim() !== "" ? 1 : 0;
    }

    if (b.tanggal) {
      if (awal === null || b.tanggal < awal) awal = b.tanggal;
      if (akhir === null || b.tanggal > akhir) akhir = b.tanggal;
      const bulan = b.tanggal.slice(0, 7);
      const titik = perBulan.get(bulan) ?? {
        bulan,
        label: `${NAMA_BULAN[Number(bulan.slice(5, 7)) - 1]} ${bulan.slice(2, 4)}`,
        komisi: 0,
        gmv: 0,
        pesanan: 0,
      };
      titik.komisi += b.komisi;
      titik.gmv += b.harga;
      titik.pesanan += 1;
      perBulan.set(bulan, titik);
    }
  });

  // Hitung jumlah pesanan unik per marketplace.
  const pesananPerMkt = new Map<Marketplace, Set<string>>();
  baris.forEach((b, i) => {
    if (b.jenis === "klik" || b.status_kode === "batal") return;
    const kunci = b.id_pesanan.trim() !== "" ? b.id_pesanan : `baris-${i}`;
    const set = pesananPerMkt.get(b.marketplace) ?? new Set<string>();
    set.add(kunci);
    pesananPerMkt.set(b.marketplace, set);
  });
  for (const [kode, mkt] of perMkt) mkt.pesanan = pesananPerMkt.get(kode)?.size ?? 0;

  const perMarketplace = [...perMkt.values()].sort((a, b) => b.komisi - a.komisi);
  const teratas = [...perProduk.values()].sort((a, b) => b.komisi - a.komisi).slice(0, 5);
  const bulanan = [...perBulan.values()].sort((a, b) => a.bulan.localeCompare(b.bulan));

  return {
    baris: baris.length,
    baris_penjualan: barisPenjualan,
    pesanan: pesanan.size,
    produk: produk.size,
    klik,
    konversi: klik > 0 ? (pesanan.size / klik) * 100 : 0,
    komisi,
    komisi_selesai: komisiSelesai,
    komisi_tertunda: komisiTertunda,
    komisi_batal: komisiBatal,
    baris_klik: barisKlik,
    pesanan_batal: barisBatal,
    gmv,
    gmv_selesai: gmvSelesai,
    persen_komisi: gmv > 0 ? (komisi / gmv) * 100 : 0,
    rata_komisi: barisPenjualan > 0 ? komisi / barisPenjualan : 0,
    per_marketplace: perMarketplace,
    teratas,
    bulanan,
    awal,
    akhir,
  };
}

/** Ambil baris dalam rentang bulan terakhir, untuk filter cepat di dashboard. */
export function saringPeriode(
  baris: BarisPerforma[],
  bulan: number | null,
  sekarang = new Date(),
): BarisPerforma[] {
  if (bulan === null) return baris;
  const batas = new Date(Date.UTC(sekarang.getUTCFullYear(), sekarang.getUTCMonth() - bulan + 1, 1));
  const batasIso = `${batas.getUTCFullYear()}-${`${batas.getUTCMonth() + 1}`.padStart(2, "0")}-01`;
  return baris.filter((b) => b.tanggal !== null && b.tanggal >= batasIso);
}
