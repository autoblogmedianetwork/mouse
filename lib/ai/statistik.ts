/**
 * Statistik biaya dari baris tabel `generations` (Fase 5, K6, PRD F10).
 *
 * Fungsi di sini murni: mereka mengambil baris PostgREST dan menghitung
 * ringkasan, tanpa tahu tentang Supabase. Roda query ada di rute API, sehingga
 * semua ini bisa diuji unit dengan fixture kecil.
 */
import { BATAS_BIAYA_USD_BAWAAN } from "./biaya";

/** Row shape as PostgREST returns it (numeric arrives as string). */
export interface BarisGenerasi {
  jenis: string;
  status: string;
  biaya_usd: string | number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  created_at: string;
}

export interface RingkasanFungsi {
  panggilan: number;
  /** USD total; null when no row in this bucket carried a computable cost. */
  usd: number | null;
  inputTokens: number;
  outputTokens: number;
  /** Average per successful generation call; null when usd is null or zero calls. */
  rataRata: number | null;
}

export interface StatistikBiaya {
  hariIniUsd: number | null;
  bulanIniUsd: number | null;
  adaCatatan: boolean;
  batasUsd: number;
  /** 0..100 usage vs budget, clamped for the progress bar. */
  persenBulan: number;
  perFungsi: Record<string, RingkasanFungsi>;
  totalTokens: number;
}

export function batasBatasUsd(envValue?: string): number {
  const parsed = Number(envValue);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : BATAS_BIAYA_USD_BAWAAN;
}

function angkaBersih(nilai: string | number | null | undefined): number | null {
  if (nilai === null || nilai === undefined) return null;
  const n = Number(nilai);
  return Number.isFinite(n) ? n : null;
}

/**Aggregate month-to-date rows into the widget/API payload. */
export function agregasiGenerations(
  rows: BarisGenerasi[],
  batasUsd: number,
  now = new Date(),
): StatistikBiaya {
  const mulaiBulan = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const mulaiHari = new Date(now);
  mulaiHari.setHours(0, 0, 0, 0);

  let hariIniUsd: number | null = null;
  let bulanIniUsd: number | null = null;
  let adaCatatan = false;
  let totalTokens = 0;
  const buckets = new Map<string, RingkasanFungsi>();

  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row || typeof row !== "object") continue;
    const ts = Date.parse(row.created_at ?? "");
    if (!Number.isFinite(ts) || ts < mulaiBulan) continue;
    adaCatatan = true;

    const usd = angkaBersih(row.biaya_usd);
    const jenis = typeof row.jenis === "string" && row.jenis ? row.jenis : "lainnya";
    const bucket =
      buckets.get(jenis) ??
      { panggilan: 0, usd: null, inputTokens: 0, outputTokens: 0, rataRata: null };

    if (ts >= mulaiHari.getTime() && usd !== null) {
      hariIniUsd = (hariIniUsd ?? 0) + usd;
    }
    if (usd !== null) {
      bulanIniUsd = (bulanIniUsd ?? 0) + usd;
      bucket.usd = (bucket.usd ?? 0) + usd;
    }
    bucket.panggilan += 1;
    bucket.inputTokens += row.input_tokens ?? 0;
    bucket.outputTokens += row.output_tokens ?? 0;
    totalTokens += row.input_tokens ?? 0;
    totalTokens += row.output_tokens ?? 0;
    buckets.set(jenis, bucket);
  }

  const perFungsi: Record<string, RingkasanFungsi> = {};
  for (const [jenis, b] of buckets) {
    perFungsi[jenis] =
      b.usd === null || b.panggilan === 0
        ? { ...b, rataRata: null }
        : { ...b, rataRata: b.usd / b.panggilan };
  }

  const bulanIni = bulanIniUsd ?? 0;
  return {
    hariIniUsd,
    bulanIniUsd,
    adaCatatan,
    batasUsd,
    persenBulan: batasUsd > 0 ? Math.min(100, (bulanIni / batasUsd) * 100) : 0,
    perFungsi,
    totalTokens,
  };
}
