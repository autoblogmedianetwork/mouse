/**
 * Registry provider posting (ADR 0002). Aturannya:
 *   - `manual` selalu tersedia, tidak butuh akun atau API (AGENTS aturan 7).
 *   - Provider API hanya dipanggil setelah `isAvailable()` benar (aturan 8).
 *   - Kalau provider pilihan tidak siap, pemanggil otomatis jatuh ke manual.
 *
 * Server-only: env token dibaca di sini, jadi modul ini tidak boleh diimpor
 * komponen klien. UI menanyakan ketersediaan lewat /api/posting/ketersediaan.
 */
import {
  PENYEDIA_POSTING,
  type HasilKirim,
  type KetersediaanProvider,
  type PenyediaPosting,
} from "./skema";
import { kirimUtasThreads } from "./threads";

export interface ProviderPosting {
  id: PenyediaPosting;
  label: string;
  /** True hanya kalau provider memang bisa dipakai sekarang. */
  isAvailable(): boolean;
  /** Pesan kenapa belum tersedia; null saat tersedia. */
  alasanTidakTersedia(): string | null;
  kirim(statuses: string[]): Promise<HasilKirim>;
}

const manual: ProviderPosting = {
  id: "manual",
  label: "Manual (salin utas)",
  // Mode manual tidak butuh apa pun: user menyalin utas lalu menempelnya sendiri.
  isAvailable: () => true,
  alasanTidakTersedia: () => null,
  kirim: async () => ({
    ok: true,
    penyedia: "manual",
    id_terkirim: [],
    error: null,
    jatuh_ke_manual: false,
  }),
};

function kredensialThreads(): { userId: string; token: string } | null {
  const userId = process.env.THREADS_USER_ID?.trim();
  const token = process.env.THREADS_ACCESS_TOKEN?.trim();
  if (!userId || !token) return null;
  return { userId, token };
}

const threadsApi: ProviderPosting = {
  id: "threads_api",
  label: "Threads API",
  isAvailable: () => kredensialThreads() !== null,
  alasanTidakTersedia: () =>
    kredensialThreads() === null
      ? "Isi THREADS_USER_ID dan THREADS_ACCESS_TOKEN di server (lihat docs/provider-posting.md)."
      : null,
  kirim: async (statuses) => {
    const kredensial = kredensialThreads();
    if (!kredensial) {
      return {
        ok: false,
        penyedia: "threads_api",
        id_terkirim: [],
        error: threadsApi.alasanTidakTersedia(),
        jatuh_ke_manual: true,
      };
    }
    return kirimUtasThreads(statuses, kredensial);
  },
};

export const PROVIDER_POSTING: Record<PenyediaPosting, ProviderPosting> = {
  manual,
  threads_api: threadsApi,
};

/** Pilihan default dari env; nilai tak dikenal dianggap manual. */
export function penyediaDariEnv(raw = process.env.POSTING_PROVIDER): PenyediaPosting {
  const nilai = raw?.trim();
  return (PENYEDIA_POSTING as readonly string[]).includes(nilai ?? "")
    ? (nilai as PenyediaPosting)
    : "manual";
}

/**
 * Provider yang benar-benar dipakai: permintaan dihormati hanya kalau provider
 * itu siap. Selain itu jatuh ke manual, sesuai ADR 0002 ("jika provider gagal,
 * konten kembali ke mode manual").
 */
export function penyediaEfektif(diminta: PenyediaPosting): PenyediaPosting {
  return PROVIDER_POSTING[diminta].isAvailable() ? diminta : "manual";
}

export type { KetersediaanProvider };

/** Untuk /api/posting/ketersediaan dan Pengaturan: status tiap provider. */
export function daftarKetersediaan(): KetersediaanProvider[] {
  return PENYEDIA_POSTING.map((id) => {
    const provider = PROVIDER_POSTING[id];
    const tersedia = provider.isAvailable();
    return {
      id,
      label: provider.label,
      tersedia,
      alasan: tersedia ? null : provider.alasanTidakTersedia(),
    };
  });
}

/** Ambil provider yang akan dipakai setelah fallback. */
export function ambilProvider(diminta: PenyediaPosting): ProviderPosting {
  return PROVIDER_POSTING[penyediaEfektif(diminta)];
}
