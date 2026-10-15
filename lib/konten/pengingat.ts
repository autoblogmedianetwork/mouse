/**
 * Pengingat pada dashboard (feedback affiliate/Claude #2): alat ini pasif, dan
 * konsistensi lebih menentukan daripada kualitas tulisan. Modul ini menilai
 * daftar konten + draft kerja dan menghasilkan daftar pengingat:
 *
 *   jadwal_lewat      konten terjadwal waktunya sudah berlalu
 *   jadwal_hari_ini   konten terjadwal hari (kalender lokal) ini
 *   jadwal_minggu_ini konten terjadwal 1-7 hari ke depan
 *   draft_pustaka     konten draft/siap_posting tidak diangkat >= BATAS hari
 *   draft_kerja       draft di halaman Buat posting tidak disentuh >= BATAS hari
 *
 * Fungsi murni tanpa storage (mengikuti pola lib/konten/kalender.ts), jadi
 * seluruh aturan bisa diuji tanpa DOM. Panel UI yang membaca localStorage.
 */
import type { Konten } from "./skema";

/** Draft dianggap terbengkalai setelah sekian hari tanpa perubahan. */
export const BATAS_DRAFT_HARI = 3;

/**Rentang jadwal "minggu ini": besok sampai 7 hari ke depan. */
export const RENTANG_MINGGU = 7;

export type JenisPengingat =
  | "jadwal_lewat"
  | "jadwal_hari_ini"
  | "jadwal_minggu_ini"
  | "draft_pustaka"
  | "draft_kerja";

export interface PengingatItem {
  /** ID stabil untuk dismiss: "jenis:id-sumber". */
  id: string;
  jenis: JenisPengingat;
  /** Judul konten atau sumber draft. */
  judul: string;
  /** Kalimat singkat berbahasa Indonesia untuk ditampilkan. */
  detail: string;
  /** Tujuan aksi user. */
  href: string;
  /** Label tombol aksi. */
  labelAksi: string;
}

/** YYYY-MM-DD dalam waktu lokal, konvensi sama seperti kalender.ts. */
function kunciHari(tgl: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${tgl.getFullYear()}-${pad(tgl.getMonth() + 1)}-${pad(tgl.getDate())}`;
}

/** Kunci hari ini untuk dismiss harian; panel menyandingkan dengan data tersimpan. */
export function kunciHariIni(sekarang = new Date()): string {
  return kunciHari(sekarang);
}

/**
 * Kunci YYYY-MM-DD untuk n hari sebelum `hariKunci` ("YYYY-MM-DD"); null bila
 * input rusak. Dipakai panel untuk memangkas token dismissal yang lewat usia
 * simpannya, jadi localStorage tidak menumpuk entri mati.
 */
export function kunciHariLalu(hariKunci: string, n: number): string | null {
  const cocok = /^(\d{4})-(\d{2})-(\d{2})$/.exec(hariKunci);
  if (!cocok) return null;
  const d = new Date(Number(cocok[1]), Number(cocok[2]) - 1, Number(cocok[3]));
  d.setDate(d.getDate() - n);
  return kunciHari(d);
}

/** Pesan usia draft: >= 7 hari pakai kata "mingguan", di bawahnya harian. */
function usiaText(usiaHari: number): string {
  if (usiaHari >= 7) {
    const minggu = Math.floor(usiaHari / 7);
    return `tidak diubah ${minggu} minggu`;
  }
  return `tidak diubah ${usiaHari} hari`;
}

/** Usia dalam hari bulat; tanggal rusak dikembalikan null. */
function usiaHari(updatedAt: string, sekarang: number): number | null {
  const t = Date.parse(updatedAt);
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.floor((sekarang - t) / 86_400_000));
}

export interface InputPengingat {
  /** Pustaka konten valid (hasil kontenSkema.parse); panel sudah menyaring. */
  konten: Konten[];
  /** Draft kerja di halaman Buat posting (localStorage autothreads-draft-posting). */
  draftKerja?: { updatedAt?: string; punyaIsi: boolean };
  /** Timestamp "sekarang" (Date.now) supaya hasil memang deterministik. */
  sekarang: number;
  batasDraftHari?: number;
}

/**
 * Susun daftar pengingat. Urutan: jadwal lewat paling atas, lalu hari ini,
 * minggu ini, draft pustaka, draft kerja. Konten arsip dan non-terjadwal
 * diabaikan sesuai K3 (arsip di luar antrian).
 */
export function evaluasiPengingat({
  konten,
  draftKerja,
  sekarang,
  batasDraftHari = BATAS_DRAFT_HARI,
}: InputPengingat): PengingatItem[] {
  const hasil: PengingatItem[] = [];
  const hariIni = kunciHari(new Date(sekarang));
  const batasBulan = kunciHari(new Date(sekarang + RENTANG_MINGGU * 86_400_000));

  // Usia draft terlambat: hanya draft/siap_posting yang tidak diarsipkan.
  for (const k of konten) {
    if (k.arsip) continue;
    if (k.status === "terjadwal" && k.jadwal_at && Number.isFinite(Date.parse(k.jadwal_at))) {
      const tgl = new Date(k.jadwal_at);
      const kunci = kunciHari(tgl);
      if (Date.parse(k.jadwal_at) < sekarang) {
        hasil.push({
          id: `jadwal_lewat:${k.id}`,
          jenis: "jadwal_lewat",
          judul: k.judul,
          detail: `Jadwal sudah lewat (${tgl.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}). Pindah jadwal atau kirim sekarang.`,
          href: "/kalender",
          labelAksi: "Buka kalender",
        });
      } else if (kunci === hariIni) {
        hasil.push({
          id: `jadwal_hari_ini:${k.id}`,
          jenis: "jadwal_hari_ini",
          judul: k.judul,
          detail: `Jadwal hari ini pukul ${tgl.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}.`,
          href: "/kalender",
          labelAksi: "Buka kalender",
        });
      } else if (kunci > hariIni && kunci <= batasBulan) {
        hasil.push({
          id: `jadwal_minggu_ini:${k.id}`,
          jenis: "jadwal_minggu_ini",
          judul: k.judul,
          detail: `Terjadwal ${tgl.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" })}.`,
          href: "/kalender",
          labelAksi: "Buka kalender",
        });
      }
      continue;
    }

    // Draft terbengkalai di pustaka: hanya draft dan siap_posting yang belum
    // selesai. Terkirim/gagal/ditolak sudah punya tab sendiri di Antrian review.
    if (k.status !== "draft" && k.status !== "siap_posting") continue;
    const usia = usiaHari(k.updated_at, sekarang);
    if (usia !== null && usia >= batasDraftHari) {
      const alasanLabel =
        k.status === "siap_posting" ? "Siap posting" : k.status === "draft" ? "Draft" : k.status;
      hasil.push({
        id: `draft_pustaka:${k.id}`,
        jenis: "draft_pustaka",
        judul: k.judul,
        detail: `${alasanLabel} di pustaka, ${usiaText(usia)}. Lanjutkan atau arsipkan.`,
        href: "/antrian",
        labelAksi: "Buka antrian",
      });
    }
  }

  // Draft kerja halaman Buat posting: hanya jika isinya nyata dan memang lama.
  if (draftKerja?.punyaIsi) {
    const usia = usiaHari(draftKerja.updatedAt ?? "", sekarang);
    if (usia !== null && usia >= batasDraftHari) {
      hasil.push({
        id: "draft_kerja:draft-posting",
        jenis: "draft_kerja",
        judul: "Draft di Buat posting",
        detail: `Draft alur pembuat posting ${usiaText(usia)}.`,
        href: "/posting/baru",
        labelAksi: "Lanjutkan",
      });
    }
  }

  // Urutkan berdasarkan prioritas jenis, tidak dari urutan pustaka, supaya
  // "lewat" selalu tampil paling atas walau datanya belakangan.
  const urutan: Record<JenisPengingat, number> = {
    jadwal_lewat: 0,
    jadwal_hari_ini: 1,
    jadwal_minggu_ini: 2,
    draft_pustaka: 3,
    draft_kerja: 4,
  };
  return hasil.sort((a, b) => urutan[a.jenis] - urutan[b.jenis]);
}

/**
 * Buang pengingat yang memang ditutup user. Penutupan disimpan panel sebagai
 * { id: "YYYY-MM-DD" }: item hanya sembunyi di hari yang sama, jadi besok
 * pengingat muncul lagi tanpa ada state yang menumpuk selamanya.
 */
export function filterTertutup(
  items: PengingatItem[],
  ditutup: Record<string, string>,
  kunciHariIni: string,
): PengingatItem[] {
  return items.filter((item) => ditutup[item.id] !== kunciHariIni);
}
