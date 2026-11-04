/**
 * Ekspor CSV tahap 1-2 untuk dipakai di Google Sheets
 * (docs/content-machine.md bagian 7).
 *
 * Fungsi di sini murni: input data, output teks. Unduhan berkas ada di
 * komponen (butuh DOM), sehingga modul ini bisa diuji tanpa peramban.
 */
import type { Peluang, Riset } from "./skema";

export const NAMA_BERKAS = {
  riset: "riset.csv",
  peluang: "peluang.csv",
} as const;

/** Sel CSV: dibungkus tanda kutip kalau memuat pemisah, kutip, atau baris baru. */
function sel(nilai: string | number | null | undefined): string {
  const teks = nilai === null || nilai === undefined ? "" : String(nilai);
  if (/[",\r\n]/.test(teks)) return `"${teks.replace(/"/g, '""')}"`;
  return teks;
}

/** Tabel → teks CSV (CRLF, sesuai RFC 4180). */
export function keCsv(rows: Array<Array<string | number | null | undefined>>): string {
  return rows.map((row) => row.map(sel).join(",")).join("\r\n");
}

/** Satu baris per masalah audiens. */
export function csvRiset(riset: Riset): string {
  const rows: Array<Array<string | number | null | undefined>> = [
    ["niche", "audiens", "masalah", "situasi", "produk_contoh", "alasan"],
    ...riset.masalah.map((m) => [
      riset.niche,
      riset.audiens,
      m.masalah,
      m.situasi,
      m.produk_contoh.join("; "),
      m.alasan,
    ]),
  ];
  return keCsv(rows);
}

/** Satu baris per kategori peluang, urut seperti yang disusun AI. */
export function csvPeluang(peluang: Peluang[]): string {
  const rows: Array<Array<string | number | null | undefined>> = [
    [
      "urutan",
      "kategori",
      "prioritas",
      "kesulitan_konten",
      "masalah_terkait",
      "contoh_produk",
      "alasan",
      "dipilih",
    ],
    ...[...peluang]
      .sort((a, b) => a.urutan - b.urutan)
      .map((p) => [
        p.urutan,
        p.kategori,
        p.prioritas,
        p.kesulitan_konten,
        p.masalah_terkait ?? "",
        p.contoh_produk.join("; "),
        p.alasan,
        p.dipilih ? "ya" : "belum",
      ]),
  ];
  return keCsv(rows);
}
