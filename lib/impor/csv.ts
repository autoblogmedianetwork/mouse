/**
 * Parser CSV/TSV tanpa dependency (AGENTS rule 3).
 *
 * Laporan affiliate dari Shopee, TikTok Shop, dan Tokopedia semuanya berasal
 * dari ekspor tabel yang berbeda-beda: pemisahnya bisa koma, titik koma, atau
 * tab; sering ada baris judul di atas header; dan sel bisa berisi koma di dalam
 * tanda kutip. Parser ini menangani semua itu supaya adaptor marketplace tidak
 * perlu tahu bentuk mentah file.
 */

export interface Tabel {
  /** Baris header yang dipakai (sudah dipangkas). */
  header: string[];
  /** Baris data, jumlah kolom diselaraskan dengan header. */
  baris: string[][];
  /** Pemisah yang terdeteksi: ",", ";", atau "\t". */
  pemisah: string;
  /** Jumlah baris mentah yang dibuang sebelum header (judul laporan, dsb). */
  baris_dilewati: number;
}

const KANDIDAT_PEMISAH = [",", ";", "\t", "|"] as const;

/** Buang BOM dan normalisasi akhir baris supaya pemrosesan berikutnya seragam. */
export function normalisasiTeks(raw: string): string {
  return raw.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
}

/**
 * Pilih pemisah dengan menghitung kerataan jumlah kolom per baris.
 * Pemisah yang menghasilkan jumlah kolom paling konsisten dan paling banyak
 * dipakai. Ini lebih andal daripada sekadar melihat pemisah paling sering,
 * karena deskripsi produk sering memuat koma.
 */
export function deteksiPemisah(teks: string): string {
  const cuplikan = teks
    .split("\n")
    .filter((l) => l.trim().length > 0)
    .slice(0, 25);
  if (cuplikan.length === 0) return ",";

  let terbaik = ",";
  let skorTerbaik = -1;
  for (const pemisah of KANDIDAT_PEMISAH) {
    const jumlah = cuplikan.map((l) => hitungKolom(l, pemisah));
    const maks = Math.max(...jumlah);
    if (maks < 2) continue;
    const rata = jumlah.reduce((a, b) => a + b, 0) / jumlah.length;
    // Utamakan pemisah yang hasilnya banyak kolom DAN seragam antar baris.
    const seragam = rata / (maks || 1);
    const skor = maks * (0.5 + seragam);
    if (skor > skorTerbaik) {
      skorTerbaik = skor;
      terbaik = pemisah;
    }
  }
  return terbaik;
}

function hitungKolom(baris: string, pemisah: string): number {
  let kolom = 1;
  let dalamKutip = false;
  for (let i = 0; i < baris.length; i += 1) {
    const c = baris[i];
    if (c === '"') {
      if (dalamKutip && baris[i + 1] === '"') i += 1;
      else dalamKutip = !dalamKutip;
    } else if (c === pemisah && !dalamKutip) {
      kolom += 1;
    }
  }
  return kolom;
}

/**
 * Pecah teks menjadi baris dan kolom. Kutip ganda di dalam sel ditulis `""`.
 * Baris yang seluruhnya kosong dibuang, bukan dijadikan baris data kosong.
 */
export function parseCsv(raw: string, pemisah?: string): string[][] {
  const teks = normalisasiTeks(raw);
  const sep = pemisah ?? deteksiPemisah(teks);
  const hasil: string[][] = [];
  let sel = "";
  let baris: string[] = [];
  let dalamKutip = false;

  const tutupBaris = () => {
    baris.push(sel);
    sel = "";
    if (baris.some((s) => s.trim().length > 0)) hasil.push(baris);
    baris = [];
  };

  for (let i = 0; i < teks.length; i += 1) {
    const c = teks[i];
    if (dalamKutip) {
      if (c === '"') {
        if (teks[i + 1] === '"') {
          sel += '"';
          i += 1;
        } else {
          dalamKutip = false;
        }
      } else {
        sel += c;
      }
      continue;
    }
    if (c === '"' && sel.trim().length === 0) {
      dalamKutip = true;
      sel = "";
    } else if (c === sep) {
      baris.push(sel);
      sel = "";
    } else if (c === "\n") {
      tutupBaris();
    } else {
      sel += c;
    }
  }
  if (sel.length > 0 || baris.length > 0) tutupBaris();

  return hasil;
}

/** Baris header = baris dengan kolom terbanyak di antara beberapa baris awal. */
export function cariBarisHeader(baris: string[][]): number {
  const batas = Math.min(baris.length, 8);
  let indeks = 0;
  let maks = -1;
  for (let i = 0; i < batas; i += 1) {
    const terisi = baris[i].filter((s) => s.trim().length > 0).length;
    if (terisi > maks) {
      maks = terisi;
      indeks = i;
    }
  }
  return indeks;
}

/**
 * Ubah teks mentah menjadi tabel siap-petakan: header, baris data, pemisah,
 * dan jumlah baris yang dilewati sebelum header.
 */
export function parseTabel(raw: string, pemisah?: string): Tabel {
  const baris = parseCsv(raw, pemisah);
  return susunTabel(baris, pemisah ?? deteksiPemisah(normalisasiTeks(raw)));
}

/**
 * Susun matriks teks menjadi tabel siap-petakan. Dipakai jalur CSV maupun
 * jalur .xlsx, supaya deteksi header dan pemangkasan kolom hanya ada di satu
 * tempat.
 */
export function susunTabel(baris: string[][], pemisah: string): Tabel {
  if (baris.length === 0) return { header: [], baris: [], pemisah, baris_dilewati: 0 };

  const idx = cariBarisHeader(baris);
  const header = baris[idx].map((s) => s.trim());
  const lebar = header.length;
  const data = baris
    .slice(idx + 1)
    .map((r) => {
      const kolom = r.slice(0, lebar);
      while (kolom.length < lebar) kolom.push("");
      return kolom.map((s) => s.trim());
    })
    .filter((r) => r.some((s) => s.length > 0));

  return { header, baris: data, pemisah, baris_dilewati: idx };
}
