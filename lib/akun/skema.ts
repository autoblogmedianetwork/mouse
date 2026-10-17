import { z } from "zod";

export const DAFTAR_PLATFORM = ["Threads", "Instagram", "Twitter", "TikTok"] as const;
export type PlatformSosial = (typeof DAFTAR_PLATFORM)[number];

export const STATUS_KONEKSI = [
  "terhubung",
  "akan_kedaluwarsa",
  "kedaluwarsa",
  "menunggu_konfigurasi",
] as const;
export type StatusKoneksiAkun = (typeof STATUS_KONEKSI)[number];

export interface AkunSosial {
  id: string;
  platform: PlatformSosial;
  username: string; // e.g. "@username"
  nama_tampilan?: string;
  threads_user_id?: string;
  status: StatusKoneksiAkun;
  token_kedaluwarsa_at?: string | null;
  terakhir_sinkron_at?: string;
  mode: "otomatis" | "manual";
  catatan?: string;
}

export const akunBaruSkema = z.object({
  platform: z.enum(DAFTAR_PLATFORM).default("Threads"),
  username: z
    .string()
    .trim()
    .min(1, "Username wajib diisi")
    .max(50, "Username maksimal 50 karakter"),
  nama_tampilan: z.string().trim().max(100, "Nama tampilan maksimal 100 karakter").optional(),
  threads_user_id: z.string().trim().optional(),
  access_token: z.string().trim().optional(),
  mode: z.enum(["otomatis", "manual"]).default("manual"),
  catatan: z.string().trim().max(250, "Catatan maksimal 250 karakter").optional(),
});

export type InputAkunBaru = z.infer<typeof akunBaruSkema>;

/**
 * Normalisasi username agar selalu berawalan '@' dan tanpa spasi.
 */
export function normalisasiUsername(raw: string): string {
  const bersih = raw.trim().replace(/^@+/, "");
  return bersih ? `@${bersih}` : "";
}

/** Ambang batas peringatan token kedaluwarsa: 7 hari dalam ms */
const AMBANG_KEDALUWARSA_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Evaluasi status koneksi akun berdasarkan tanggal token dan mode kerja.
 */
export function tentukanStatusKoneksi(
  tokenKedaluwarsaAt: string | null | undefined,
  mode: "otomatis" | "manual" = "manual",
  sekarang = new Date(),
): StatusKoneksiAkun {
  if (mode === "manual") {
    return "terhubung";
  }
  if (!tokenKedaluwarsaAt) {
    return "menunggu_konfigurasi";
  }
  const exp = Date.parse(tokenKedaluwarsaAt);
  if (!Number.isFinite(exp)) {
    return "menunggu_konfigurasi";
  }
  const sisa = exp - sekarang.getTime();
  if (sisa <= 0) {
    return "kedaluwarsa";
  }
  if (sisa <= AMBANG_KEDALUWARSA_MS) {
    return "akan_kedaluwarsa";
  }
  return "terhubung";
}
