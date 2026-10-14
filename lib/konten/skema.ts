/**
 * Bank konten (PRD F5). localStorage-backed until Supabase connects (P3);
 * shapes mirror `contents` + `threads_statuses` in skema-database.md so the
 * later migration is a field copy, not a redesign.
 */
import { z } from "zod";
import type { ContentStatus } from "@/components/status-badge";
import { MAX_STATUS_LENGTH, charLength, validateStatusList } from "@/lib/statuses/validator-500";
import { checklistLengkap } from "./checklist";

/**
 * Hook styles offered in Pengaturan generate (PRD F3a). Declared as a tuple so
 * the Zod enum and the analytics labels stay in sync from one source.
 */
export const GAYA_HOOK = [
  "pertanyaan",
  "masalah_relatif",
  "pernyataan_mengejutkan",
  "bawaan",
] as const;
export type GayaHook = (typeof GAYA_HOOK)[number];

/** Human labels for the hook style (used by the analytics tables). */
export const LABEL_GAYA_HOOK: Record<GayaHook, string> = {
  pertanyaan: "Pertanyaan",
  masalah_relatif: "Masalah relatable",
  pernyataan_mengejutkan: "Pernyataan mengejutkan",
  bawaan: "Bawaan",
};

/** Human labels for the link placement (F3a, used by the analytics tables). */
export const LABEL_LETAK_LINK: Record<
  "status_terakhir" | "balasan" | "tanpa_link",
  string
> = {
  status_terakhir: "Status terakhir",
  balasan: "Balasan terpisah",
  tanpa_link: "Tanpa link",
};

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
  status: z.enum(["draft", "siap_posting", "terjadwal", "terkirim", "gagal", "ditolak"]),
  letak_link: z.enum(["status_terakhir", "balasan", "tanpa_link"]),
  /**
   * Hook style used when this content was generated (F3a). Stored per content so
   * Analitik can answer "gaya hook mana yang paling banyak klik" (Fase 6).
   * Older rows have no value and fall back to "bawaan".
   */
  gaya_hook: z.enum(GAYA_HOOK).default("bawaan"),
  link_produk: z.string().default(""),
  arsip: z.boolean().default(false),
  arsip_at: z.string().nullable().default(null),
  /** Idea score 0-100 from prompt 02 v2; null until that prompt ships (F10). */
  skor: z.number().min(0).max(100).nullable().default(null),
  /** True when created by the semi/auto work mode; false for manual work (F10). */
  otomatis: z.boolean().default(false),
  /** Checklist answers ticked in Buat posting, needed by bulk "tandai siap". */
  checklist: z.record(z.string(), z.boolean()).default({}),
  /** Schedule date/time; non-null only for the terjadwal status (Fase 6, UI-Spec 3.4). */
  jadwal_at: z.string().nullable().default(null),
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

/* ------------------------------ Antrian review ------------------------------ */

/** Tabs of Antrian review (UI-Spec 3.9), one per content status. */
export const TAB_REVIEW = [
  { value: "perlu_review", label: "Perlu review", status: "draft" },
  { value: "disetujui", label: "Disetujui", status: "siap_posting" },
  { value: "terjadwal", label: "Terjadwal", status: "terjadwal" },
  { value: "gagal", label: "Gagal posting", status: "gagal" },
  { value: "terkirim", label: "Sudah posting", status: "terkirim" },
  { value: "ditolak", label: "Ditolak", status: "ditolak" },
] as const;

export type TabReview = (typeof TAB_REVIEW)[number]["value"];

/** Content status shown in the given tab. */
export function statusDariTab(tab: TabReview): ContentStatus {
  return TAB_REVIEW.find((t) => t.value === tab)?.status ?? "draft";
}

/** Counts per tab. Archived content sits outside the queue (K3). */
export function hitungTab(list: Konten[]): Record<TabReview, number> {
  const hasil: Record<TabReview, number> = {
    perlu_review: 0,
    disetujui: 0,
    terjadwal: 0,
    gagal: 0,
    terkirim: 0,
    ditolak: 0,
  };
  for (const k of list) {
    if (k.arsip) continue;
    if (k.status === "draft") hasil.perlu_review += 1;
    else if (k.status === "siap_posting") hasil.disetujui += 1;
    else if (k.status === "terjadwal") hasil.terjadwal += 1;
    else if (k.status === "gagal") hasil.gagal += 1;
    else if (k.status === "terkirim") hasil.terkirim += 1;
    else hasil.ditolak += 1;
  }
  return hasil;
}

export interface HasilTandaiSiap {
  boleh: boolean;
  alasan?: string;
}

/**
 * The same gate as the ActionBar in Buat posting (UI-Spec 3.2): content only
 * leaves draft when every status is valid and the checklist is complete.
 * Bulk "tandai siap" in Antrian review runs this per content so mass actions
 * cannot bypass the gate (PRD F0: no siap_posting without a user action).
 */
export function bisaTandaiSiap(k: Konten, aturanKepercayaanAktif = true): HasilTandaiSiap {
  const valid = validateStatusList(k.statuses);
  if (!valid.ok) {
    return { boleh: false, alasan: "Ada status yang tidak lolos aturan 500 karakter." };
  }
  if (!checklistLengkap(k.checklist, aturanKepercayaanAktif)) {
    return { boleh: false, alasan: "Checklist di Buat posting belum lengkap." };
  }
  return { boleh: true };
}
