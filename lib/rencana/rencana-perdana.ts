/**
 * Rencana Perdana — 21 hari menuju komisi pertama (Threads).
 *
 * Sumber teks tugas: file "Rencana Perdana 21 Hari Menuju Komisi.txt"
 * dari user (dipakai apa adanya, bukan parafrasa). Prinsip:
 * - Beban harian 1 konten + 3 balasan (~30 menit); hari terlewat tidak
 *   dikejar dengan menggandakan tugas.
 * - Tidak ada target penjualan dipaksakan — tujuannya kebiasaan + data.
 * - Tugas kerja manusia (menulis, membalas) tanpa tombol; tugas yang
 *   memakai fitur aplikasi diberi tautan lompat.
 */

export const KEY_RENCANA = "autothreads-rencana-perdana";

export type FaseRencana = "tanam" | "tembak" | "panen";

export interface FiturRencana {
  label: string;
  href: string;
}

export interface TugasRencana {
  /** Stabil: "h3t2" = hari 3, tugas 2. */
  id: string;
  teks: string;
  fitur?: FiturRencana;
}

export interface HariRencana {
  hari: number;
  fase: FaseRencana;
  tugas: TugasRencana[];
}

export const LABEL_FASE: Record<FaseRencana, string> = {
  tanam: "Tanam — bangun kenal dan riset, tanpa link",
  tembak: "Tembak — mulai menyebut produk dengan jujur",
  panen: "Panen — evaluasi dengan data nyata",
};

function tugas(hari: number, urut: number, teks: string, fitur?: FiturRencana): TugasRencana {
  return { id: `h${hari}t${urut}`, teks, fitur };
}

/** 21 hari, teks dari file user apa adanya. */
export const RENCANA_PERDANA: HariRencana[] = [
  {
    hari: 1,
    fase: "tanam",
    tugas: [
      tugas(1, 1, "Pilih satu niche produk yang kamu pahami. Jalankan riset dan pilih satu kategori.", {
        label: "Buka Riset audiens",
        href: "/riset",
      }),
    ],
  },
  {
    hari: 2,
    fase: "tanam",
    tugas: [
      tugas(2, 1, "Tulis satu cerita pengalaman pribadi tentang masalah sehari-hari yang benar-benar kamu alami."),
    ],
  },
  {
    hari: 3,
    fase: "tanam",
    tugas: [
      tugas(3, 1, "Baca 5 review pembeli produk itu di marketplace. Catat keluhan yang paling sering muncul.", {
        label: "Buka Review pasar (opsional)",
        href: "/riset",
      }),
    ],
  },
  {
    hari: 4,
    fase: "tanam",
    tugas: [
      tugas(4, 1, "Tulis konten tentang salah satu keluhan itu, dengan bahasa kamu sendiri."),
    ],
  },
  {
    hari: 5,
    fase: "tanam",
    tugas: [
      tugas(5, 1, "Balas 3 thread yang relevan dengan niche-mu. Bantu dengan jujur, tanpa menyebut produk."),
    ],
  },
  {
    hari: 6,
    fase: "tanam",
    tugas: [
      tugas(6, 1, "Tulis satu konten tentang cara kamu memilih barang yang layak dibeli."),
    ],
  },
  {
    hari: 7,
    fase: "tanam",
    tugas: [
      tugas(7, 1, "Evaluasi minggu pertama. Catat konten mana yang dapat respons paling baik."),
    ],
  },
  {
    hari: 8,
    fase: "tembak",
    tugas: [
      tugas(8, 1, "Pilih satu produk yang sudah kamu coba atau pelajari dengan serius.", {
        label: "Buat produk + isi link afiliasi",
        href: "/posting/baru",
      }),
    ],
  },
  {
    hari: 9,
    fase: "tembak",
    tugas: [
      tugas(9, 1, "Tulis konten tentang produk itu. Sebut kekurangannya lebih dulu."),
    ],
  },
  {
    hari: 10,
    fase: "tembak",
    tugas: [
      tugas(10, 1, "Balas 3 thread. Tetap tanpa jualan."),
    ],
  },
  {
    hari: 11,
    fase: "tembak",
    tugas: [
      tugas(11, 1, "Tulis dua versi hook untuk produk yang sama. Pilih satu untuk dipublikasikan.", {
        label: "Buka Eksperimen hook",
        href: "/analitik",
      }),
    ],
  },
  {
    hari: 12,
    fase: "tembak",
    tugas: [
      tugas(12, 1, "Cek link afiliasi: pastikan parameter tracking terpasang sebelum dipublikasikan.", {
        label: "Buka Detektor link",
        href: "/link",
      }),
      tugas(12, 2, "Publikasikan konten produk. Tambahkan keterangan afiliasi sesuai aturan platform."),
    ],
  },
  {
    hari: 13,
    fase: "tembak",
    tugas: [
      tugas(13, 1, "Balas 3 thread. Catat respons untuk hook yang kamu pakai."),
    ],
  },
  {
    hari: 14,
    fase: "tembak",
    tugas: [
      tugas(14, 1, "Evaluasi. Putuskan apakah produk ini layak dilanjutkan atau diganti."),
    ],
  },
  {
    hari: 15,
    fase: "panen",
    tugas: [
      tugas(15, 1, "Tulis satu konten produk dengan hook terbaik dari minggu sebelumnya."),
    ],
  },
  {
    hari: 16,
    fase: "panen",
    tugas: [
      tugas(16, 1, "Balas 3 thread yang membahas masalah serupa."),
    ],
  },
  {
    hari: 17,
    fase: "panen",
    tugas: [
      tugas(17, 1, "Cek manual: apakah kontenmu terlihat dari akun lain, atau hanya di profilmu sendiri?"),
    ],
  },
  {
    hari: 18,
    fase: "panen",
    tugas: [
      tugas(18, 1, "Tulis satu konten tentang pengalaman memakai produk itu lebih lama."),
    ],
  },
  {
    hari: 19,
    fase: "panen",
    tugas: [
      tugas(19, 1, "Balas 3 thread. Fokus pada bantuan, bukan penjualan."),
    ],
  },
  {
    hari: 20,
    fase: "panen",
    tugas: [
      tugas(20, 1, "Isi Kalkulator Cuan dengan angka nyata: klik, penjualan, dan komisi yang sudah cair.", {
        label: "Buka Kalkulator Cuan",
        href: "/",
      }),
    ],
  },
  {
    hari: 21,
    fase: "panen",
    tugas: [
      tugas(21, 1, "Tinjau 21 hari. Tentukan apa yang diulang dan apa yang dihentikan."),
    ],
  },
];


export interface StatusRencana {
  /** Tanggal mulai, YYYY-MM-DD lokal. */
  mulai: string;
  /** Id tugas yang sudah dicentang. */
  selesai: string[];
}

/** Mulai rencana baru (atau ulang). */
export function mulaiRencana(hariIni: string): StatusRencana {
  return { mulai: hariIni, selesai: [] };
}

/** Centang/hapus centang satu tugas. Fungsi murni. */
export function tandaiTugas(status: StatusRencana, idTugas: string): StatusRencana {
  const ada = status.selesai.includes(idTugas);
  return {
    ...status,
    selesai: ada
      ? status.selesai.filter((t) => t !== idTugas)
      : [...status.selesai, idTugas],
  };
}

/** Hari ke berapa sekarang (1..21), dihitung dari tanggal mulai. */
export function hariAktif(status: StatusRencana, hariIni: string): number {
  const mulai = Date.parse(status.mulai);
  const sekarang = Date.parse(hariIni);
  if (!Number.isFinite(mulai) || !Number.isFinite(sekarang) || sekarang < mulai) return 1;
  const lewat = Math.floor((sekarang - mulai) / 86_400_000) + 1;
  return Math.min(21, Math.max(1, lewat));
}

/** Apakah semua tugas pada hari tersebut sudah dicentang. */
export function hariSelesaiSemua(status: StatusRencana, hari: number): boolean {
  const data = RENCANA_PERDANA.find((h) => h.hari === hari);
  if (!data || data.tugas.length === 0) return false;
  return data.tugas.every((t) => status.selesai.includes(t.id));
}

/** Persen tugas selesai dari total 21 hari. */
export function progressPersen(status: StatusRencana): number {
  const total = RENCANA_PERDANA.reduce((a, h) => a + h.tugas.length, 0);
  if (total === 0) return 0;
  return Math.round((status.selesai.length / total) * 100);
}

/** Apakah seluruh 21 hari tuntas. */
export function rencanaTuntas(status: StatusRencana): boolean {
  return RENCANA_PERDANA.every((h) => hariSelesaiSemua(status, h.hari));
}
