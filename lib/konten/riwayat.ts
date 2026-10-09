/**
 * Riwayat posting (UI-Spec 3.5): waktu, konten, mode, status akhir, catatan.
 * Only manual mode exists in MVP (F8); auto arrives at M6.
 * Event log in localStorage until Supabase connects.
 */
import { z } from "zod";
import type { ContentStatus } from "@/components/status-badge";

export const riwayatSkema = z.object({
  id: z.string().min(1),
  waktu: z.string(),
  konten_judul: z.string(),
  mode: z.enum(["manual", "auto"]),
  status_akhir: z.enum(["draft", "siap_posting", "terjadwal", "terkirim", "gagal"]),
  catatan: z.string(),
});

export type RiwayatEntry = z.infer<typeof riwayatSkema>;

const RIWAYAT_KEY = "autothreads-riwayat";
const MAX_ENTRIES = 500;

export function muatRiwayat(): RiwayatEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RIWAYAT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry) => {
      const result = riwayatSkema.safeParse(entry);
      return result.success ? [result.data] : [];
    });
  } catch {
    return [];
  }
}

export function catatRiwayat(
  entry: Omit<RiwayatEntry, "id" | "waktu"> & Partial<Pick<RiwayatEntry, "waktu">>,
): RiwayatEntry[] {
  const full: RiwayatEntry = {
    id: crypto.randomUUID(),
    waktu: entry.waktu ?? new Date().toISOString(),
    konten_judul: entry.konten_judul,
    mode: entry.mode,
    status_akhir: entry.status_akhir as ContentStatus,
    catatan: entry.catatan,
  };
  const list = [full, ...muatRiwayat()].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(RIWAYAT_KEY, JSON.stringify(list));
  } catch {
    // ignore quota errors
  }
  return list;
}

export interface RiwayatFilter {
  /** Inclusive lower bound (ISO date, yyyy-mm-dd), empty = no limit. */
  dari: string;
  sampai: string;
  status: RiwayatEntry["status_akhir"] | "semua";
}

export const RIWAYAT_FILTER_AWAL: RiwayatFilter = { dari: "", sampai: "", status: "semua" };

export function filterRiwayat(list: RiwayatEntry[], filter: RiwayatFilter): RiwayatEntry[] {
  const dariMs = filter.dari ? Date.parse(`${filter.dari}T00:00:00`) : null;
  const sampaiMs = filter.sampai ? Date.parse(`${filter.sampai}T23:59:59.999`) : null;
  return list.filter((e) => {
    if (filter.status !== "semua" && e.status_akhir !== filter.status) return false;
    const t = Date.parse(e.waktu);
    if (dariMs !== null && t < dariMs) return false;
    if (sampaiMs !== null && t > sampaiMs) return false;
    return true;
  });
}
