/**
 * Content bank persistence (localStorage until Supabase connects).
 * All functions are pure w.r.t. their inputs: they take the current list and
 * return the next list, so pages own the state and this file owns the shape.
 */
import { kontenSkema, type Konten } from "./skema";

const KONTEN_KEY = "autothreads-konten";

export function muatKonten(): Konten[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KONTEN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    // Tolerant load: entries that fail validation are dropped, never crash.
    return Array.isArray(parsed)
      ? parsed.flatMap((entry) => {
          const result = kontenEntrySafeParse(entry);
          return result ? [result] : [];
        })
      : [];
  } catch {
    return [];
  }
}

export function simpanKonten(list: Konten[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KONTEN_KEY, JSON.stringify(list));
  } catch {
    // storage penuh/di-block: abaikan, state tetap di memori
  }
}

/**
 * Duplicate a content entry as a fresh draft copy (UI-Spec 3.3).
 * The copy is manual work, so the "Otomatis" label and the checklist answers
 * belong to the original and are dropped (UI-Spec 3.9, PRD F0).
 */
export function duplikatKonten(k: Konten): Konten {
  const now = new Date().toISOString();
  return {
    ...k,
    id: crypto.randomUUID(),
    judul: `${k.judul} (salinan)`,
    status: "draft",
    otomatis: false,
    checklist: {},
    arsip: false,
    arsip_at: null,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Schedule a ready-to-post content (Fase 6, UI-Spec 2.5/3.4): only siap_posting
 * can be scheduled, per Workflow "terjadwal dapat dibatalkan sebelum waktunya".
 * The checklist stays intact; cancel returns the content to siap_posting.
 */
export function jadwalkanKonten(
  list: Konten[],
  id: string,
  jadwalAt: string,
): { list: Konten[]; ok: boolean; alasan?: string } {
  if (!Number.isFinite(Date.parse(jadwalAt))) {
    return { list, ok: false, alasan: "Tanggal jadwal tidak valid." };
  }
  const target = list.find((k) => k.id === id);
  if (!target) return { list, ok: false, alasan: "Konten tidak ditemukan." };
  if (target.status !== "siap_posting") {
    return { list, ok: false, alasan: "Hanya konten berstatus siap posting yang bisa dijadwalkan." };
  }
  const now = new Date().toISOString();
  return {
    ok: true,
    list: list.map((k) =>
      k.id === id ? { ...k, status: "terjadwal", jadwal_at: jadwalAt, updated_at: now } : k,
    ),
  };
}

/**
 * Move an already scheduled content to another date/time (Fase 6, UI-Spec 3.4
 * "drag untuk memindah jadwal, dengan konfirmasi"). Only content whose status
 * is already `terjadwal` can move; everything else is returned untouched so a
 * drag can never skip the checklist gate (PRD F0).
 */
export function pindahJadwal(
  list: Konten[],
  id: string,
  jadwalAt: string,
): { list: Konten[]; ok: boolean; alasan?: string } {
  if (!Number.isFinite(Date.parse(jadwalAt))) {
    return { list, ok: false, alasan: "Tanggal jadwal tidak valid." };
  }
  const target = list.find((k) => k.id === id);
  if (!target) return { list, ok: false, alasan: "Konten tidak ditemukan." };
  if (target.status !== "terjadwal") {
    return { list, ok: false, alasan: "Hanya konten terjadwal yang bisa dipindah jadwalnya." };
  }
  const now = new Date().toISOString();
  return {
    ok: true,
    list: list.map((k) =>
      k.id === id ? { ...k, jadwal_at: jadwalAt, updated_at: now } : k,
    ),
  };
}

/** Cancel the schedule: back to siap_posting, schedule field cleared. */
export function batalkanJadwal(list: Konten[], id: string): Konten[] {
  const now = new Date().toISOString();
  return list.map((k) =>
    k.id === id && k.status === "terjadwal"
      ? { ...k, status: "siap_posting", jadwal_at: null, updated_at: now }
      : k,
  );
}

/**
 * Mark a content as published (Fase 7). The schedule marker is kept on purpose:
 * it is the record of when the post was planned, and Riwayat already stores the
 * exact send time.
 */
export function tandaiTerkirim(list: Konten[], id: string): Konten[] {
  const now = new Date().toISOString();
  return list.map((k) => (k.id === id ? { ...k, status: "terkirim", updated_at: now } : k));
}

/**
 * Mark a content as failed (Fase 7). The content stays in the bank with all of
 * its statuses so the user can retry or copy it manually — a failed API call
 * must never remove content from the library (exit criteria Fase 7).
 */
export function tandaiGagal(list: Konten[], id: string): Konten[] {
  const now = new Date().toISOString();
  return list.map((k) => (k.id === id ? { ...k, status: "gagal", updated_at: now } : k));
}

/** Archive/unarchive (retention K3 counts from arsip_at). */
export function arsipkanKonten(list: Konten[], id: string, arsip: boolean): Konten[] {
  return list.map((k) =>
    k.id === id
      ? { ...k, arsip, arsip_at: arsip ? new Date().toISOString() : null, updated_at: new Date().toISOString() }
      : k,
  );
}

export function hapusKonten(list: Konten[], id: string): Konten[] {
  return list.filter((k) => k.id !== id);
}

export function upsertKonten(list: Konten[], konten: Konten): Konten[] {
  const idx = list.findIndex((k) => k.id === konten.id);
  if (idx === -1) return [konten, ...list];
  const next = [...list];
  next[idx] = konten;
  return next;
}

function kontenEntrySafeParse(entry: unknown): Konten | null {
  const result = kontenSkema.safeParse(entry);
  return result.success ? result.data : null;
}
