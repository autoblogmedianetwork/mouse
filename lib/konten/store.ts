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
