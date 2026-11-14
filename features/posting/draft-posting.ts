/**
 * Tipe & helper bersama untuk alur Buat posting (refactor R3).
 * Dipisah dari alur-buat-posting.tsx supaya tiap tahap dan hook draft
 * memakai satu sumber definisi. Tidak ada logika baru di sini.
 */
import type { Analisis, Ide, Pengaturan, CarouselResponse } from "@/lib/ai/schemas";
import { PENGATURAN_AWAL } from "@/lib/ai/schemas";
import { normalkanPersonaId } from "@/lib/ai/persona";
import type { ContentStatus } from "@/components/status-badge";
import type { PengaturanApp } from "@/app/(dashboard)/pengaturan/form-pengaturan";
import type { SavedProduct } from "./form-produk-manual";
import type { ChecklistId } from "./checklist-gate";
import { CHECKLIST_AWAL } from "@/lib/konten/checklist";

/**
 * Alur bertahap Buat posting (PRD F0 checkpoint per tahap):
 * Penawaran → Analisis → Ide → Generate → Preview/Edit/Salin.
 * Semua output berstatus draft sampai user menekan "Tandai siap posting".
 */

export type Langkah = "produk" | "analisis" | "ide" | "generate" | "preview";

export const LANGKAH_LIST: Array<{ id: Langkah; label: string }> = [
  // Fase 2-B: analisis dan ide tampil jadi satu layar; "ide" tetap ada
  // sebagai state internal supaya logika generate ide tidak berubah.
  { id: "produk", label: "1. Penawaran" },
  { id: "analisis", label: "2. Analisis & ide" },
  { id: "generate", label: "3. Generate" },
  { id: "preview", label: "4. Preview & salin" },
];

export const DRAFT_KEY = "autothreads-draft-posting";

export interface KontenKerja {
  ide: Ide;
  statuses: string[];
  carousel?: CarouselResponse;
  /** ID of the matching entry in the content bank (Pustaka), if saved. */
  bankId?: string;
}

export interface DraftState {
  produk: SavedProduct | null;
  analisis: Analisis | null;
  analisisManual: string;
  ideList: Ide[];
  ideDipilih: string[];
  pengaturan: Pengaturan;
  konten: KontenKerja[];
  kontenAktif: number;
  checklist: Record<ChecklistId, boolean>;
  status: ContentStatus;
  updatedAt: string;
}

export const DRAFT_AWAL: DraftState = {
  produk: null,
  analisis: null,
  analisisManual: "",
  ideList: [],
  ideDipilih: [],
  pengaturan: PENGATURAN_AWAL,
  konten: [],
  kontenAktif: 0,
  checklist: CHECKLIST_AWAL,
  status: "draft",
  updatedAt: "",
};

export function loadDraft(): DraftState {
  if (typeof window === "undefined") return DRAFT_AWAL;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return DRAFT_AWAL;
    const parsed = JSON.parse(raw) as Partial<DraftState>;
    // Draf lama menyimpan label persona ("Bawaan", "Sahabat", "Ahli");
    // normalkanPersonaId mengubahnya ke id supaya pilihan di form tidak kosong.
    let pengaturan: Pengaturan = {
      ...PENGATURAN_AWAL,
      ...(parsed.pengaturan ?? {}),
      persona: normalkanPersonaId(parsed.pengaturan?.persona),
    };
    if (!parsed.pengaturan) {
      // Fase 2-B: default dari halaman Pengaturan, jadi pemula tidak ditanya
      // dua kali. Pengaturan yang sudah ada di draft tidak ditimpa.
      try {
        const rawApp = window.localStorage.getItem("autothreads-pengaturan");
        if (rawApp) {
          const app = JSON.parse(rawApp) as Partial<PengaturanApp>;
          pengaturan = {
            ...pengaturan,
            aturan_kepercayaan: app.sebut_kekurangan ?? pengaturan.aturan_kepercayaan,
            anti_ai_slop: app.anti_ai_slop ?? pengaturan.anti_ai_slop,
            gaya_hook:
              app.gaya_hook_default && app.gaya_hook_default !== "bawaan"
                ? app.gaya_hook_default
                : pengaturan.gaya_hook,
          };
        }
      } catch {
        // localStorage tidak tersedia: pakai default bawaan.
      }
    }
    return {
      ...DRAFT_AWAL,
      ...parsed,
      pengaturan,
      checklist: { ...CHECKLIST_AWAL, ...parsed.checklist },
    };
  } catch {
    return DRAFT_AWAL;
  }
}

export interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  /** HTTP status, so a 401 can offer the sign-in link. */
  status?: number;
}

export async function postJson<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as ApiResult<T>;
    return { ...json, status: res.status };
  } catch {
    return { ok: false, error: "Jaringan bermasalah. Coba lagi." };
  }
}

export const primaryBtn =
  "inline-flex h-10 items-center bg-primary px-5 text-badan font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60";
export const ghostBtn =
  "inline-flex h-10 items-center border border-surface-border px-5 text-badan font-medium transition-colors hover:bg-muted disabled:opacity-60";
