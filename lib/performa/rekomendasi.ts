/**
 * Rekomendasi riset dari data performa (Fase 3, task 3-E).
 *
 * Menutup lingkaran: riset → konten → performa → riset. Fungsi murni supaya
 * mudah diuji; UI hanya menampilkan hasilnya. Prinsip: tidak ada rekomendasi
 * dari data yang terlalu tipis — lebih baik jujur bilang "belum cukup data".
 */
import type { HasilAtribusi, RingkasanDimensi } from "./atribusi";

export interface RekomendasiPerforma {
  dimensi: string;
  teks: string;
}

/** Minimal 2 konten per nilai variabel supaya perbandingan tidak menyesatkan. */
export const MIN_KONTEN = 2;

function pemenang(dimensi: readonly RingkasanDimensi[]): RingkasanDimensi | null {
  const layak = dimensi.filter((d) => d.konten >= MIN_KONTEN && d.komisi_cair > 0);
  if (layak.length < 2) return null;
  return [...layak].sort((a, b) => b.komisi_cair - a.komisi_cair)[0];
}

const rupiah = (nilai: number): string =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    nilai,
  );

/**
 * Susun rekomendasi dari ringkasan atribusi. Rekomendasi hanya muncul untuk
 * dimensi yang datanya cukup; kalau semua tipis, kembalikan satu catatan.
 */
export function rekomendasiDariPerforma(hasil: HasilAtribusi): RekomendasiPerforma[] {
  const keluar: RekomendasiPerforma[] = [];

  const pasangan: Array<{ dimensi: string; daftar: readonly RingkasanDimensi[] }> = [
    { dimensi: "gaya pembuka", daftar: hasil.per_hook },
    { dimensi: "posisi link", daftar: hasil.per_letak_link },
  ];

  for (const { dimensi, daftar } of pasangan) {
    const juara = pemenang(daftar);
    if (!juara) continue;
    keluar.push({
      dimensi,
      teks: `${juara.label} unggul: komisi cair ${rupiah(juara.komisi_cair)} dari ${juara.konten} konten (${juara.klik} klik). Pertimbangkan jadi pilihan utama untuk konten berikutnya.`,
    });
  }

  if (keluar.length === 0) {
    return [
      {
        dimensi: "umum",
        teks: "Data performa belum cukup untuk rekomendasi — butuh minimal 2 konten dengan komisi pada tiap pilihan. Impor laporan affiliate dan petakan sub_id dulu di menu Analitik.",
      },
    ];
  }
  return keluar;
}
