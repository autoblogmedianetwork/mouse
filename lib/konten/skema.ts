/**
 * Bank konten (PRD F5). localStorage-backed until Supabase connects (P3);
 * shapes mirror `contents` + `threads_statuses` in skema-database.md so the
 * later migration is a field copy, not a redesign.
 */
import { z } from "zod";
import type { ContentStatus } from "@/components/status-badge";
import { MAX_STATUS_LENGTH, charLength, validateStatusList } from "@/lib/statuses/validator-500";

export const kontenSkema = z.object({
  id: z.string().min(1),
  /** Internal title, shown in the library grid. */
  judul: z.string().min(1),
  produk_nama: z.string().default(""),
  ide_judul: z.string().default(""),
  statuses: z
    .array(
      z
        .string()
        .refine((s) => s.trim().length > 0, "ada status kosong")
        .refine((s) => charLength(s) <= MAX_STATUS_LENGTH, "status melebihi 500 karakter"),
    )
    .min(1),
  status: z.enum(["draft", "siap_posting", "terjadwal", "terkirim", "gagal"]),
  letak_link: z.enum(["status_terakhir", "balasan", "tanpa_link"]),
  link_produk: z.string().default(""),
  arsip: z.boolean().default(false),
  arsip_at: z.string().nullable().default(null),
  /** Manual click/commission notes (F5, no auto tracking in MVP). */
  klik_manual: z.number().int().min(0).default(0),
  komisi_manual: z.number().min(0).default(0),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Konten = z.infer<typeof kontenSkema>;

/* --------------------------------- Filter ---------------------------------- */

export interface KontenFilter {
  /** Free text over judul and status contents. */
  q: string;
  status: ContentStatus | "semua";
  /** "7d" | "30d" | "semua" — based on updated_at. */
  rentang: "7d" | "30d" | "semua";
}

export const FILTER_AWAL: KontenFilter = { q: "", status: "semua", rentang: "semua" };

export function filterKonten(list: Konten[], filter: KontenFilter, now = Date.now()): Konten[] {
  const q = filter.q.trim().toLowerCase();
  const batas =
    filter.rentang === "7d"
      ? now - 7 * 86_400_000
      : filter.rentang === "30d"
        ? now - 30 * 86_400_000
        : null;

  return list
    .filter((k) => {
      if (filter.status !== "semua" && k.status !== filter.status) return false;
      if (batas !== null && Date.parse(k.updated_at) < batas) return false;
      if (q === "") return true;
      return (
        k.judul.toLowerCase().includes(q) ||
        k.produk_nama.toLowerCase().includes(q) ||
        k.statuses.some((s) => s.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
}

/** Summary numbers for StatCard (UI-Spec 3.3 / dashboard). */
export function ringkasanKonten(list: Konten[]) {
  const aktif = list.filter((k) => !k.arsip);
  return {
    total: aktif.length,
    draft: aktif.filter((k) => k.status === "draft").length,
    siap: aktif.filter((k) => k.status === "siap_posting").length,
    arsip: list.filter((k) => k.arsip).length,
  };
}

/** Valid only when every status passes the 500-char rule (PRD F4). */
export function kontenValid(k: Pick<Konten, "statuses">): boolean {
  return validateStatusList(k.statuses).ok;
}
