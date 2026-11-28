/**
 * Perangking sudut konten (adaptasi kerangka "content-angle-ranker").
 *
 * Bedanya dengan skor peluang: skor peluang menebak sebelum posting, berkas ini
 * menilai SESUDAH ada data komisi nyata dari laporan marketplace. Datanya
 * dipakai apa adanya dari `lib/performa/atribusi.ts`, jadi tidak ada angka baru
 * yang dikarang di sini.
 *
 * Prinsipnya sama dengan rekomendasi performa: lebih baik bilang "data masih
 * tipis" daripada menyimpulkan dari satu konten.
 */
import type { RingkasanAngle } from "./atribusi";

/** Minimal konten per sudut sebelum putusan "ganti sudut" boleh diambil. */
export const MIN_SUDUT = 2;

/** Minimal konten sebelum keyakinan disebut kuat. */
export const MIN_KUAT = 4;

export type Putusan = "lanjutkan" | "uji-lagi" | "ganti-sudut" | "belum-data";

export type Keyakinan = "kuat" | "cukup" | "tipis";

export interface PeringkatAngle {
  angle: string;
  konten: number;
  klik: number;
  pesanan: number;
  komisi_cair: number;
  /** Komisi cair dibagi klik. Nol kalau belum ada klik. */
  rupiah_per_klik: number;
  putusan: Putusan;
  keyakinan: Keyakinan;
  alasan: string;
}

const rupiah = (nilai: number): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai);

function keyakinanDari(konten: number): Keyakinan {
  if (konten >= MIN_KUAT) return "kuat";
  if (konten >= MIN_SUDUT) return "cukup";
  return "tipis";
}

/** Median dari daftar kosong dianggap 0 supaya pembanding tetap aman. */
function median(nilai: readonly number[]): number {
  if (nilai.length === 0) return 0;
  const urut = [...nilai].sort((a, b) => a - b);
  const tengah = Math.floor(urut.length / 2);
  return urut.length % 2 === 0 ? (urut[tengah - 1] + urut[tengah]) / 2 : urut[tengah];
}

function putusanUntuk(a: RingkasanAngle, rpk: number, rpkMedian: number): { putusan: Putusan; alasan: string } {
  const dasar = `${a.konten} konten, ${a.klik} klik, ${rupiah(a.komisi_cair)} komisi cair.`;

  if (a.klik === 0 && a.komisi_cair === 0) {
    return {
      putusan: "belum-data",
      alasan: `${dasar} Belum ada klik yang tercatat, jadi sudut ini belum bisa dinilai.`,
    };
  }

  if (a.komisi_cair > 0) {
    const pembanding =
      rpkMedian > 0 && rpk >= rpkMedian
        ? "efisiensinya di atas atau sama dengan median sudut lain"
        : "efisiensinya di bawah median, tapi masih menghasilkan";
    return {
      putusan: "lanjutkan",
      alasan: `${dasar} ${rupiah(rpk)} per klik; ${pembanding}.`,
    };
  }

  if (a.konten >= MIN_SUDUT) {
    return {
      putusan: "ganti-sudut",
      alasan: `${dasar} Klik sudah masuk tapi tidak ada komisi sama sekali dari ${a.konten} konten — sudutnya perlu diganti, bukan diperbanyak.`,
    };
  }

  return {
    putusan: "uji-lagi",
    alasan: `${dasar} Baru ${a.konten} konten dan belum ada komisi. Tambah minimal ${MIN_SUDUT} konten sebelum menyimpulkan.`,
  };
}

const URUTAN_PUTUSAN: Record<Putusan, number> = {
  lanjutkan: 0,
  "uji-lagi": 1,
  "ganti-sudut": 2,
  "belum-data": 3,
};

/**
 * Urutkan sudut dari yang paling layak dilanjutkan. Sudut tanpa nama
 * ("(tanpa angle)") tetap ditampilkan apa adanya, tidak dibuang — kalau
 * dibuang, konten lama yang lupa diisi sudutnya jadi tak terlihat.
 */
export function rangkingAngle(perAngle: readonly RingkasanAngle[]): PeringkatAngle[] {
  const denganRpk = perAngle
    .filter((a) => a.klik > 0)
    .map((a) => a.komisi_cair / a.klik);
  const rpkMedian = median(denganRpk);

  return perAngle
    .map((a) => {
      const rpk = a.klik > 0 ? a.komisi_cair / a.klik : 0;
      const { putusan, alasan } = putusanUntuk(a, rpk, rpkMedian);
      return {
        angle: a.angle.trim() === "" ? "(tanpa sudut)" : a.angle,
        konten: a.konten,
        klik: a.klik,
        pesanan: a.pesanan,
        komisi_cair: a.komisi_cair,
        rupiah_per_klik: rpk,
        putusan,
        keyakinan: keyakinanDari(a.konten),
        alasan,
      };
    })
    .sort(
      (a, b) =>
        URUTAN_PUTUSAN[a.putusan] - URUTAN_PUTUSAN[b.putusan] ||
        b.komisi_cair - a.komisi_cair ||
        b.klik - a.klik ||
        b.konten - a.konten,
    );
}

/** Sudut yang paling layak dikerjakan lagi, atau null kalau tidak ada yang lulus. */
export function sudutTerbaik(perAngle: readonly RingkasanAngle[]): PeringkatAngle | null {
  const urut = rangkingAngle(perAngle);
  return urut.find((p) => p.putusan === "lanjutkan") ?? null;
}
