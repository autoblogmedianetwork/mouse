/**
 * Sinkronisasi draft wizard ke Supabase (Fase 2-C, ADR tidak baru: pola RLS
 * sama dengan tabel lain). localStorage tetap sumber kebenaran utama —
 * Supabase hanya cadangan supaya draft ikut pindah browser/perangkat.
 *
 * Semua fungsi aman dipanggil saat Supabase belum dikonfigurasi atau tabel
 * belum dibuat: gagal = kembalikan null/false, alur lokal tetap jalan.
 */
import { klienPeramban, supabaseSiap } from "./klien";

export const TABEL_DRAFT = "draft_posting";

/** Bentuk minimal yang dibandingkan untuk resolusi konflik. */
export interface DraftBertanda {
  updatedAt: string;
}

export type SumberDraft = "lokal" | "server" | "kosong";

/**
 * Pilih draft terbaru: updatedAt ISO lebih besar menang; kalau sama (atau
 * salah satu tidak bertanda), lokal menang supaya edit di layar tidak hilang.
 * Fungsi murni — diuji di draft-sync.test.ts.
 */
export function pilihTerbaru<T extends DraftBertanda>(
  lokal: T | null,
  server: T | null,
): { data: T | null; sumber: SumberDraft } {
  if (!lokal && !server) return { data: null, sumber: "kosong" };
  if (!server) return { data: lokal, sumber: "lokal" };
  if (!lokal) return { data: server, sumber: "server" };
  const waktuLokal = Date.parse(lokal.updatedAt) || 0;
  const waktuServer = Date.parse(server.updatedAt) || 0;
  if (waktuServer > waktuLokal) return { data: server, sumber: "server" };
  return { data: lokal, sumber: "lokal" };
}

/**
 * Ambil draft dari server. Null berarti tidak ada baris / tidak bisa akses.
 */
export async function muatDraftServer(): Promise<DraftBertanda | null> {
  if (!supabaseSiap()) return null;
  const klien = klienPeramban();
  if (!klien) return null;
  try {
    const { data: sesi } = await klien.auth.getUser();
    if (!sesi.user) return null;
    const { data, error } = await klien
      .from(TABEL_DRAFT)
      .select("data, updated_at")
      .eq("user_id", sesi.user.id)
      .maybeSingle();
    if (error || !data) return null;
    const isi = data.data as DraftBertanda | null;
    if (!isi || typeof isi.updatedAt !== "string") return null;
    return isi;
  } catch {
    return null;
  }
}

/**
 * Simpan draft ke server (upsert satu baris per user). False berarti gagal —
 * pemanggil cukup diam, karena localStorage tetap tersimpan.
 */
export async function simpanDraftServer(draft: DraftBertanda): Promise<boolean> {
  if (!supabaseSiap()) return false;
  const klien = klienPeramban();
  if (!klien) return false;
  try {
    const { data: sesi } = await klien.auth.getUser();
    if (!sesi.user) return false;
    const { error } = await klien.from(TABEL_DRAFT).upsert({
      user_id: sesi.user.id,
      data: draft,
      updated_at: draft.updatedAt,
    });
    return !error;
  } catch {
    return false;
  }
}
