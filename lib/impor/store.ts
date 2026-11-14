/**
 * Simpanan performa affiliate di localStorage.
 *
 * Pola ini mengikuti Bank Konten: data bertahan di peramban sampai Supabase
 * tersambung (P3). Beda dari `useLocalState`, penulisan di sini melaporkan
 * kegagalan (misalnya kuota localStorage habis) supaya UI bisa memberi pesan
 * alih-alih diam-diam kehilangan data impor.
 */
import { bacaSkema, hapusKunci, tulisJsonHasil } from "@/lib/storage/kotak";
import { gabungPerforma } from "./performa";
import {
  KUNCI_PERFORMA,
  SIMPANAN_PERFORMA_AWAL,
  VERSI_PERFORMA,
  simpananPerformaSkema,
  type HasilBaca,
  type SimpananPerforma,
  type SumberImpor,
} from "./skema";

export type HasilSimpan = { ok: true } | { ok: false; pesan: string };

const PESAN_KUOTA =
  "Penyimpanan peramban penuh. Hapus data performa lama di halaman ini, lalu impor ulang.";

export function muatPerforma(): SimpananPerforma {
  return bacaSkema(KUNCI_PERFORMA, simpananPerformaSkema, SIMPANAN_PERFORMA_AWAL);
}

export function simpanPerforma(simpanan: SimpananPerforma): HasilSimpan {
  return tulisJsonHasil(KUNCI_PERFORMA, simpanan, PESAN_KUOTA);
}

export function hapusPerforma(): void {
  hapusKunci(KUNCI_PERFORMA);
}

export interface HasilTambahImpor {
  simpanan: SimpananPerforma;
  sumber: SumberImpor;
  ditambah: number;
  diperbarui: number;
}

/**
 * Gabungkan satu hasil baca ke simpanan. Baris dengan kunci sama diperbarui,
 * bukan ditumpuk, sehingga impor laporan yang tumpang tindih tetap akurat.
 */
export function tambahImporKeSimpanan(
  sekarang: SimpananPerforma,
  hasil: HasilBaca,
): HasilTambahImpor {
  const { baris, ditambah, diperbarui } = gabungPerforma(sekarang.baris, hasil.baris);
  const diimporPada = new Date().toISOString();
  const sumber: SumberImpor = {
    id: `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    nama: hasil.nama_sumber,
    marketplace: hasil.marketplace,
    baris: hasil.baris.length,
    ditolak: hasil.ditolak.length,
    komisi: hasil.baris.reduce((a, b) => a + b.komisi, 0),
    gmv: hasil.baris.reduce((a, b) => a + b.harga, 0),
    diimpor_pada: diimporPada,
  };

  return {
    simpanan: { versi: VERSI_PERFORMA, sumber: [sumber, ...sekarang.sumber], baris },
    sumber,
    ditambah,
    diperbarui,
  };
}
