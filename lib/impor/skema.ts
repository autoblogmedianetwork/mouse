/**
 * Skema Zod untuk data performa affiliate (AGENTS rule 9).
 *
 * Bentuknya dibuat sejajar dengan rencana tabel `performa_imports` dan
 * `performa_rows` di docs/skema-database.md, supaya saat Supabase tersambung
 * (P3) pemindahannya hanya memindahkan field, bukan mendesain ulang.
 */
import { z } from "zod";

export const KUNCI_PERFORMA = "autothreads-performa";
export const VERSI_PERFORMA = 1;

export const marketplaceSkema = z.enum(["shopee", "tiktok", "tokopedia", "lainnya"]);
export const statusPesananSkema = z.enum(["selesai", "menunggu", "batal", "lainnya"]);

/**
 * Satu baris bisa berupa penjualan (ada komisi) atau hanya klik (dari ekspor
 * analitik marketplace yang tidak memuat komisi). Agregasi uang hanya memakai
 * baris `penjualan`, sedangkan klik dihitung dari keduanya.
 */
export const jenisBarisSkema = z.enum(["penjualan", "klik"]);

export const barisPerformaSkema = z.object({
  /** id stabil dari kunci dedupe; impor ulang tidak menggandakan baris. */
  id: z.string().min(1),
  marketplace: marketplaceSkema,
  jenis: jenisBarisSkema.default("penjualan"),
  id_pesanan: z.string().default(""),
  produk: z.string().default(""),
  varian: z.string().default(""),
  /** ISO date (YYYY-MM-DD) atau null bila kolom tanggal tidak ada. */
  tanggal: z.string().nullable().default(null),
  jumlah: z.number().default(1),
  harga: z.number().default(0),
  komisi: z.number().default(0),
  tingkat_komisi: z.number().nullable().default(null),
  status_pesanan: z.string().default(""),
  status_kode: statusPesananSkema.default("lainnya"),
  sub_id: z.string().default(""),
  /** Klik dari ekspor marketplace; 0 bila kolomnya tidak ada. */
  klik: z.number().min(0).default(0),
  /** Nama berkas atau "tempel" — untuk jejak asal data. */
  sumber: z.string().default(""),
  /** ISO timestamp saat baris masuk. */
  diimpor_pada: z.string(),
});

export type BarisPerforma = z.infer<typeof barisPerformaSkema>;

export const sumberImporSkema = z.object({
  id: z.string().min(1),
  nama: z.string().min(1),
  marketplace: marketplaceSkema,
  baris: z.number().int().min(0),
  ditolak: z.number().int().min(0),
  komisi: z.number(),
  gmv: z.number(),
  diimpor_pada: z.string(),
});

export type SumberImpor = z.infer<typeof sumberImporSkema>;

export const simpananPerformaSkema = z.object({
  versi: z.number().int().min(1),
  sumber: z.array(sumberImporSkema),
  baris: z.array(barisPerformaSkema),
});

export type SimpananPerforma = z.infer<typeof simpananPerformaSkema>;

export const SIMPANAN_PERFORMA_AWAL: SimpananPerforma = {
  versi: VERSI_PERFORMA,
  sumber: [],
  baris: [],
};

/** Satu baris yang gagal dibaca, disimpan agar user tahu penyebabnya. */
export const barisDitolakSkema = z.object({
  nomor: z.number().int().min(1),
  alasan: z.string().min(1),
});

export type BarisDitolak = z.infer<typeof barisDitolakSkema>;

export const hasilBacaSkema = z.object({
  nama_sumber: z.string(),
  marketplace: marketplaceSkema,
  skor_deteksi: z.number().min(0),
  alasan_deteksi: z.string(),
  pemisah: z.string(),
  baris_dilewati: z.number().int().min(0),
  header: z.array(z.string()),
  peta: z.record(z.string(), z.number()),
  kolom_tak_dikenali: z.array(z.string()),
  kolom_kurang: z.array(z.string()),
  baris: z.array(barisPerformaSkema),
  total_baris: z.number().int().min(0),
  ditolak: z.array(barisDitolakSkema),
});

export type HasilBaca = z.infer<typeof hasilBacaSkema>;
