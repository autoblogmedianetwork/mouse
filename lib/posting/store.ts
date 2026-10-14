/**
 * Penyimpanan sisi klien untuk posting (Fase 7): pengaturan kirim dan riwayat
 * percobaan kirim. Bentuknya sengaja sama dengan tabel `posts` dan pengaturan
 * server, jadi saat pustaka pindah ke Supabase tidak ada pemetaan ulang.
 *
 * Fingerprint: sama seperti lib/konten/store.ts — fungsi murni untuk bagian yang
 * bisa diuji, pembungkus localStorage untuk sisanya.
 */
import {
  PENGATURAN_POSTING_AWAL,
  pengaturanPostingSkema,
  type CatatanKirim,
  type PengaturanPosting,
} from "./skema";

export const KEY_PENGATURAN_POSTING = "autothreads-pengaturan-posting";
export const KEY_RIWAYAT_KIRIM = "autothreads-riwayat-kirim";
const MAKS_RIWAYAT = 500;

/** Tambahkan satu catatan di depan daftar dan potong sesuai batas. */
export function tambahCatatan(
  list: CatatanKirim[],
  entry: CatatanKirim,
  maks = MAKS_RIWAYAT,
): CatatanKirim[] {
  return [entry, ...list].slice(0, maks);
}

export function muatPengaturanPosting(): PengaturanPosting {
  if (typeof window === "undefined") return PENGATURAN_POSTING_AWAL;
  try {
    const raw = window.localStorage.getItem(KEY_PENGATURAN_POSTING);
    if (!raw) return PENGATURAN_POSTING_AWAL;
    const hasil = pengaturanPostingSkema.safeParse(JSON.parse(raw));
    return hasil.success ? hasil.data : PENGATURAN_POSTING_AWAL;
  } catch {
    return PENGATURAN_POSTING_AWAL;
  }
}

export function simpanPengaturanPosting(value: PengaturanPosting): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY_PENGATURAN_POSTING, JSON.stringify(value));
  } catch {
    // storage penuh/di-block: abaikan
  }
}

export function muatRiwayatKirim(): CatatanKirim[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY_RIWAYAT_KIRIM);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry) => {
      const e = entry as Partial<CatatanKirim>;
      if (typeof e?.konten_id !== "string" || typeof e?.waktu !== "string") return [];
      return [
        {
          konten_id: e.konten_id,
          waktu: e.waktu,
          ok: e.ok === true,
          penyedia: e.penyedia === "threads_api" ? ("threads_api" as const) : ("manual" as const),
        },
      ];
    });
  } catch {
    return [];
  }
}

/** Catat satu percobaan kirim dan kembalikan riwayat terbaru. */
export function catatKirim(entry: CatatanKirim): CatatanKirim[] {
  const next = tambahCatatan(muatRiwayatKirim(), entry);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY_RIWAYAT_KIRIM, JSON.stringify(next));
    } catch {
      // abaikan
    }
  }
  return next;
}
