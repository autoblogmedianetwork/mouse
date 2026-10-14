/**
 * Bentuk data lapisan posting (Fase 7, ADR 0002).
 *
 * Satu antarmuka untuk semua provider posting: mode manual selalu ada sebagai
 * cadangan, dan provider API (Threads) hanya dipanggil kalau `isAvailable()`.
 * Berkas ini sengaja bebas dari fetch dan Supabase supaya bisa dipakai klien
 * maupun server.
 */
import { z } from "zod";

export const PENYEDIA_POSTING = ["manual", "threads_api"] as const;
export type PenyediaPosting = (typeof PENYEDIA_POSTING)[number];

export const LABEL_PENYEDIA: Record<PenyediaPosting, string> = {
  manual: "Manual (salin utas)",
  threads_api: "Threads API",
};

export const hasilKirimSkema = z.object({
  ok: z.boolean(),
  penyedia: z.enum(PENYEDIA_POSTING),
  /** ID postingan yang sudah terbit, urut dari akar utas. Kosong untuk manual. */
  id_terkirim: z.array(z.string()).default([]),
  error: z.string().nullable().default(null),
  /**
   * True saat provider API gagal atau tidak siap, jadi user harus memakai mode
   * manual (ADR 0002: "jika provider gagal, konten kembali ke mode manual").
   * False berarti permintaan memang ditolak aturan, bukan kegagalan provider.
   */
  jatuh_ke_manual: z.boolean().default(false),
});
export type HasilKirim = z.infer<typeof hasilKirimSkema>;

/**
 * Pengaturan pengiriman. `jeda_detik` dan `batas_harian` ditulis di sini, bukan
 * di hardcode, karena batas resmi Threads bisa berubah (250 posting/24 jam saat
 * dokumen ini ditulis) dan user pribadi mungkin ingin lebih konservatif.
 */
export const pengaturanPostingSkema = z.object({
  penyedia: z.enum(PENYEDIA_POSTING).default("manual"),
  /** Jeda minimum antar postingan (detik). */
  jeda_detik: z.number().int().min(0).default(60),
  /** Batas posting yang berhasil dalam 24 jam berjalan. */
  batas_harian: z.number().int().min(1).default(20),
});
export type PengaturanPosting = z.infer<typeof pengaturanPostingSkema>;

export const PENGATURAN_POSTING_AWAL: PengaturanPosting = {
  penyedia: "manual",
  jeda_detik: 60,
  batas_harian: 20,
};

/** Status konten yang boleh dikirim: hanya yang sudah lolos persetujuan user. */
export const STATUS_BOLEH_KIRIM = ["siap_posting", "terjadwal", "gagal"] as const;

export interface CatatanKirim {
  konten_id: string;
  /** ISO timestamp saat percobaan kirim. */
  waktu: string;
  ok: boolean;
  penyedia: PenyediaPosting;
}

/** Status tiap provider untuk UI dan /api/posting/ketersediaan. */
export interface KetersediaanProvider {
  id: PenyediaPosting;
  label: string;
  tersedia: boolean;
  alasan: string | null;
}

/* ------------------------------ request API ------------------------------- */

/**
 * Isi POST /api/posting/kirim. Konten dikirim apa adanya dari klien karena
 * pustaka masih di localStorage; server tetap memvalidasi bentuknya dan
 * menolak status yang belum disetujui (lib/posting/antrian.ts).
 */
export const kirimRequestSkema = z.object({
  konten: z.object({
    id: z.string().min(1),
    judul: z.string().min(1),
    status: z.enum(["draft", "siap_posting", "terjadwal", "terkirim", "gagal", "ditolak"]),
    statuses: z.array(z.string().min(1)).min(1),
    jadwal_at: z.string().nullable().default(null),
  }),
  pengaturan: pengaturanPostingSkema,
  /** Riwayat kirim terakhir dari klien (maksimal 500 baris). */
  riwayat: z
    .array(
      z.object({
        konten_id: z.string(),
        waktu: z.string(),
        ok: z.boolean(),
        penyedia: z.enum(PENYEDIA_POSTING),
      }),
    )
    .max(500)
    .default([]),
});
export type KirimRequest = z.infer<typeof kirimRequestSkema>;
