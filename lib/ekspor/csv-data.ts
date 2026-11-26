/**
 * Ekspor CSV semua data Heaviliate (bank ide #1, riset 17 Nov).
 *
 * Tujuan: user kerja di Google Sheets — konten, Katalog, dan Performa
 * kini bisa diunduh sebagai CSV dan dianalisis bebas di sana. Murni fungsi
 * (input data, output teks); unduhan berkas ada di komponen (butuh DOM),
 * mengikuti pola lib/riset/ekspor.ts.
 *
 * Keamanan spreadsheet: sel yang diawali = + - @ diprefix kutip tunggal
 * supaya tidak dieksekusi sebagai rumus saat ditempel (formula injection).
 */
import { keCsv } from "@/lib/riset/ekspor";
import type { Konten } from "@/lib/konten/skema";
import type { ProdukRingkas } from "@/lib/produk/store";
import type { BarisPerforma } from "@/lib/impor/skema";

export const NAMA_BERKAS_CSV = {
  konten: "konten.csv",
  katalog: "katalog.csv",
  performa: "performa.csv",
} as const;

/** Sel CSV dengan penangkal formula injection untuk Sheets/Excel. */
function selAman(nilai: string | number | null | undefined): string {
  const teks = nilai === null || nilai === undefined ? "" : String(nilai);
  const berbahaya = /^[=+\-@\t\r]/.test(teks);
  return berbahaya ? `'${teks}` : teks;
}

function barisCsv(rows: Array<Array<string | number | null | undefined>>): string {
  return keCsv(rows.map((r) => r.map(selAman)));
}

/** Satu baris per konten — statuses digabung dengan pemisah baris dalam sel. */
export function csvKonten(konten: readonly Konten[]): string {
  const rows: Array<Array<string | number | null | undefined>> = [
    ["id", "judul", "produk", "status", "jumlah_status", "hook", "kerangka", "letak_link", "link_produk", "arsip", "dibuat", "diubah", "isi"],
    ...[...konten].map((k) => [
      k.id,
      k.judul,
      k.produk_nama,
      k.status,
      k.statuses.length,
      k.gaya_hook,
      k.kerangka,
      k.letak_link,
      k.link_produk,
      k.arsip ? "ya" : "tidak",
      k.created_at,
      k.updated_at,
      k.statuses.join("\n---\n"),
    ]),
  ];
  return barisCsv(rows);
}

/** Satu baris per produk Katalog. */
export function csvKatalog(produk: readonly ProdukRingkas[]): string {
  const rows: Array<Array<string | number | null | undefined>> = [
    ["nama", "varian", "harga", "tag", "url", "gambar", "toko", "arsip"],
    ...produk.map((p) => [
      p.nama_internal ?? p.nama ?? "",
      p.varian ?? "",
      p.harga ?? "",
      (p.tag ?? []).join("; "),
      p.url_referensi ?? "",
      p.gambar_url ?? "",
      p.nama_toko ?? "",
      p.arsip ? "ya" : "tidak",
    ]),
  ];
  return barisCsv(rows);
}

/** Satu baris per baris laporan performa yang sudah diimpor. */
export function csvPerforma(baris: readonly BarisPerforma[]): string {
  const rows: Array<Array<string | number | null | undefined>> = [
    ["marketplace", "jenis", "id_pesanan", "produk", "varian", "tanggal", "jam", "jumlah", "harga", "komisi", "status_pesanan", "sub_id", "klik", "diimpor_pada"],
    ...baris.map((b) => [
      b.marketplace,
      b.jenis,
      b.id_pesanan,
      b.produk,
      b.varian,
      b.tanggal ?? "",
      b.jam ?? "",
      b.jumlah,
      b.harga,
      b.komisi,
      b.status_pesanan,
      b.sub_id,
      b.klik,
      b.diimpor_pada,
    ]),
  ];
  return barisCsv(rows);
}
