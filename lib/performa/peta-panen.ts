/**
 * Peta panen komisi: kapan laporan marketplace menghasilkan uang.
 *
 * Pertanyaan yang dijawab: "hari apa dan jam berapa link saya paling banyak
 * dipakai orang". Sumbernya baris performa hasil impor, jadi angkanya nyata,
 * bukan tebakan. Fungsi di sini murni (tanpa storage) supaya bisa diuji dan
 * dipakai ulang kalau nanti agregasinya pindah ke SQL.
 *
 * Jam hanya tersedia bila laporan memuat waktu pesanan. Laporan yang hanya
 * memberi tanggal tetap menghasilkan peta per hari; grid jam dibiarkan kosong
 * dan UI menjelaskan kenapa, bukan mengarang jam.
 */
import type { BarisPerforma } from "@/lib/impor/skema";

/** Senin lebih dulu: pola kerja affiliate Indonesia dibaca per pekan kerja. */
export const LABEL_HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"] as const;

/** Enam blok 4 jam; 24 kolom terlalu sempit untuk dibaca dan terlalu jarang terisi. */
export const JAM_PER_BLOK = 4;
export const BLOK_JAM = [
  { indeks: 0, label: "00-04" },
  { indeks: 1, label: "04-08" },
  { indeks: 2, label: "08-12" },
  { indeks: 3, label: "12-16" },
  { indeks: 4, label: "16-20" },
  { indeks: 5, label: "20-24" },
] as const;

export interface HariPanen {
  indeks: number;
  label: string;
  baris: number;
  komisi: number;
  komisi_cair: number;
  pesanan: number;
  klik: number;
}

export interface SelPanen {
  hari: number;
  blok: number;
  baris: number;
  komisi: number;
  komisi_cair: number;
  pesanan: number;
  klik: number;
}

export interface PetaPanen {
  /** Selalu 7 baris, Senin–Minggu, termasuk hari tanpa data. */
  per_hari: HariPanen[];
  /** Grid 7 × 6 lengkap (baris = hari, kolom = blok jam); kosong berarti nol. */
  per_sel: SelPanen[];
  /** True bila setidaknya satu baris membawa jam. */
  ada_jam: boolean;
  baris_berjam: number;
  /** Komisi cair terbesar di satu sel; dipakai UI untuk skala warna. */
  maks_sel: number;
  total: { baris: number; komisi: number; pesanan: number; klik: number };
  hari_terbaik: HariPanen | null;
  sel_terbaik: SelPanen | null;
  /** Baris tanpa tanggal tidak bisa ditempatkan; tetap dihitung supaya jujur. */
  tanpa_tanggal: { baris: number; komisi: number };
}

interface Akumulasi {
  baris: number;
  komisi: number;
  komisi_cair: number;
  klik: number;
  pesanan: Set<string>;
}

function akumulasiBaru(): Akumulasi {
  return { baris: 0, komisi: 0, komisi_cair: 0, klik: 0, pesanan: new Set() };
}

/** Indeks hari 0 = Senin … 6 = Minggu, dihitung di UTC agar tidak bergeser zona waktu. */
export function indeksHari(tanggal: string): number | null {
  const cocok = /^(\d{4})-(\d{2})-(\d{2})/.exec(tanggal);
  if (!cocok) return null;
  const tahun = Number(cocok[1]);
  const bulan = Number(cocok[2]);
  const hari = Number(cocok[3]);
  const tanggalUtc = new Date(Date.UTC(tahun, bulan - 1, hari));
  if (
    tanggalUtc.getUTCFullYear() !== tahun ||
    tanggalUtc.getUTCMonth() !== bulan - 1 ||
    tanggalUtc.getUTCDate() !== hari
  ) {
    return null;
  }
  return (tanggalUtc.getUTCDay() + 6) % 7;
}

export function blokDariJam(jam: number): number {
  return Math.min(BLOK_JAM.length - 1, Math.max(0, Math.floor(jam / JAM_PER_BLOK)));
}

export function labelBlok(blok: number): string {
  return BLOK_JAM[blok]?.label ?? `${blok * JAM_PER_BLOK}-${(blok + 1) * JAM_PER_BLOK}`;
}

/**
 * Kunci pesanan: ID marketplace bila ada, kalau tidak satu baris penjualan
 * dihitung sebagai satu pesanan. Baris batal tidak dihitung sama sekali, sama
 * seperti `hitungAtribusi`, supaya pembatalan tidak menaikkan jumlah pesanan.
 */
function kunciPesanan(baris: BarisPerforma, nomor: number): string | null {
  if (baris.jenis !== "penjualan" || baris.status_kode === "batal") return null;
  const id = baris.id_pesanan.trim();
  return id !== "" ? id : `baris-${nomor}`;
}

function tambahkan(akum: Akumulasi, baris: BarisPerforma, nomor: number): void {
  akum.baris += 1;
  akum.klik += baris.klik;
  akum.komisi += baris.komisi;
  if (baris.status_kode !== "batal") akum.komisi_cair += baris.komisi;
  const pesanan = kunciPesanan(baris, nomor);
  if (pesanan) akum.pesanan.add(pesanan);
}

function keHari(indeks: number, akum: Akumulasi): HariPanen {
  return {
    indeks,
    label: LABEL_HARI[indeks],
    baris: akum.baris,
    komisi: akum.komisi,
    komisi_cair: akum.komisi_cair,
    pesanan: akum.pesanan.size,
    klik: akum.klik,
  };
}

function keSel(hari: number, blok: number, akum: Akumulasi): SelPanen {
  return {
    hari,
    blok,
    baris: akum.baris,
    komisi: akum.komisi,
    komisi_cair: akum.komisi_cair,
    pesanan: akum.pesanan.size,
    klik: akum.klik,
  };
}

export function hitungPetaPanen(baris: BarisPerforma[]): PetaPanen {
  const perHariAkum = LABEL_HARI.map(() => akumulasiBaru());
  // Hanya alokasi grid saat benar-benar ada baris berjam; laporan tanggal-saja
  // tidak perlu 42 wadah kosong.
  const perSelAkum = new Map<number, Akumulasi>();
  let barisBerjam = 0;
  const tanpaTanggal = { baris: 0, komisi: 0 };

  baris.forEach((b, i) => {
    const hari = b.tanggal ? indeksHari(b.tanggal) : null;
    if (hari === null) {
      tanpaTanggal.baris += 1;
      tanpaTanggal.komisi += b.komisi;
      return;
    }
    tambahkan(perHariAkum[hari], b, i);
    if (b.jam === null) return;
    barisBerjam += 1;
    const kunci = hari * BLOK_JAM.length + blokDariJam(b.jam);
    const akum = perSelAkum.get(kunci) ?? akumulasiBaru();
    tambahkan(akum, b, i);
    perSelAkum.set(kunci, akum);
  });

  const per_hari = perHariAkum.map((akum, indeks) => keHari(indeks, akum));

  const per_sel: SelPanen[] = [];
  for (let hari = 0; hari < LABEL_HARI.length; hari += 1) {
    for (let blok = 0; blok < BLOK_JAM.length; blok += 1) {
      const akum = perSelAkum.get(hari * BLOK_JAM.length + blok);
      per_sel.push(keSel(hari, blok, akum ?? akumulasiBaru()));
    }
  }

  const total = per_hari.reduce(
    (a, h) => ({
      baris: a.baris + h.baris,
      komisi: a.komisi + h.komisi,
      pesanan: a.pesanan + h.pesanan,
      klik: a.klik + h.klik,
    }),
    { baris: 0, komisi: 0, pesanan: 0, klik: 0 },
  );

  const maks_sel = per_sel.reduce((maks, s) => Math.max(maks, s.komisi_cair), 0);

  const hari_terbaik =
    total.baris === 0
      ? null
      : [...per_hari].sort(
          (a, b) => b.komisi_cair - a.komisi_cair || b.komisi - a.komisi || a.indeks - b.indeks,
        )[0];

  const selTerbaik =
    barisBerjam === 0
      ? null
      : [...per_sel].sort(
          (a, b) =>
            b.komisi_cair - a.komisi_cair ||
            b.komisi - a.komisi ||
            b.klik - a.klik ||
            a.hari - b.hari ||
            a.blok - b.blok,
        )[0];
  const sel_terbaik = selTerbaik && selTerbaik.baris > 0 ? selTerbaik : null;

  return {
    per_hari,
    per_sel,
    ada_jam: barisBerjam > 0,
    baris_berjam: barisBerjam,
    maks_sel,
    total,
    hari_terbaik,
    sel_terbaik,
    tanpa_tanggal: tanpaTanggal,
  };
}
