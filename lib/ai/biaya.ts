/**
 * AI cost log (UI-Spec 3.9 header widget, PRD F10: warn at 80%, stop at 100%
 * of the monthly budget).
 *
 * Nothing writes real numbers here yet: `generateJSON` does not read usage
 * metadata from the provider response, so cost recording lands with the cost
 * limit task. Until then the widget reads an empty log and says so instead of
 * showing invented zeros.
 */
export interface CatatanBiaya {
  /** ISO timestamp of the AI call. */
  ts: string;
  usd: number;
}

/** AI_MONTHLY_BUDGET_USD default (K6). Vercel holds the live value. */
export const BATAS_BIAYA_USD_BAWAAN = 5;

const KEY_BIAYA = "autothreads-biaya";

export interface RingkasBiaya {
  hariIniUsd: number | null;
  bulanIniUsd: number | null;
  /** False when nothing has been recorded, so the UI can say so. */
  adaCatatan: boolean;
}

/** Sum of logged costs for today and for the current month. */
export function ringkasBiaya(
  list: CatatanBiaya[],
  now = new Date(),
): RingkasBiaya {
  const kosong = { hariIniUsd: null, bulanIniUsd: null, adaCatatan: false };
  if (!Array.isArray(list) || list.length === 0) return kosong;

  const mulaiHari = new Date(now);
  mulaiHari.setHours(0, 0, 0, 0);
  const mulaiBulan = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  let hariIni = 0;
  let bulanIni = 0;
  let adaCatatan = false;

  for (const catatan of list) {
    const ts = Date.parse(catatan?.ts ?? "");
    const usd = Number(catatan?.usd);
    if (!Number.isFinite(ts) || !Number.isFinite(usd)) continue;
    adaCatatan = true;
    if (ts < mulaiBulan) continue;
    bulanIni += usd;
    if (ts >= mulaiHari.getTime()) hariIni += usd;
  }

  return adaCatatan
    ? { hariIniUsd: hariIni, bulanIniUsd: bulanIni, adaCatatan }
    : kosong;
}

/** Reads the local log. Server-side and first paint both get an empty list. */
export function muatBiayaLokal(): CatatanBiaya[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY_BIAYA);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is CatatanBiaya =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as CatatanBiaya).ts === "string" &&
        typeof (x as CatatanBiaya).usd === "number",
    );
  } catch {
    return [];
  }
}

/** Appends one cost entry. Called later by the AI call sites (PRD F10). */
export function catatBiaya(usd: number, ts = new Date().toISOString()): void {
  if (typeof window === "undefined") return;
  const list = muatBiayaLokal();
  list.push({ ts, usd });
  try {
    window.localStorage.setItem(KEY_BIAYA, JSON.stringify(list.slice(-500)));
  } catch {
    // storage full: cost tracking is best-effort, never blocks the feature
  }
}
