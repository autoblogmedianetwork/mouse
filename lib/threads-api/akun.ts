/**
 * Penyimpanan akun Threads (Fase 7, ADR 0023) — token TERENKRIPSI.
 *
 * Memakai pola ADR 0031: AES-256-GCM dengan master key AI_PROVIDER_SECRET
 * (fungsi enkripsiApiKey/dekripsiApiKey dipakai ulang dari provider-store).
 * Token tidak pernah dikembalikan terang ke klien — UI hanya melihat
 * username, id, dan status kedaluwarsa.
 */
import { klienServer } from "@/lib/supabase/server";
import { dekripsiApiKey, enkripsiApiKey } from "@/lib/ai/provider-store";

export interface AkunThreads {
  threadsUserId: string;
  username: string;
  tokenKedaluwarsa: string | null;
}

export interface AkunThreadsRahasia extends AkunThreads {
  accessToken: string;
}

/** Simpan/refresh koneksi Threads milik user. */
export async function simpanAkun(
  userId: string,
  data: { threadsUserId: string; username: string; accessToken: string; kedaluwarsaDetik: number },
): Promise<{ ok: true } | { ok: false; galat: string }> {
  const supabase = await klienServer();
  if (!supabase) return { ok: false, galat: "Database belum terhubung." };
  const kedaluwarsa = new Date(Date.now() + data.kedaluwarsaDetik * 1000).toISOString();
  const { error } = await supabase.from("threads_akun").upsert(
    {
      user_id: userId,
      threads_user_id: data.threadsUserId,
      username: data.username,
      token_terenkripsi: enkripsiApiKey(data.accessToken),
      token_kedaluwarsa: kedaluwarsa,
      diperbarui_pada: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) return { ok: false, galat: `Gagal menyimpan akun: ${error.message}` };
  return { ok: true };
}

/** Ambil akun + token terang (HANYA di server, untuk pengirim). */
export async function ambilAkunRahasia(userId: string): Promise<AkunThreadsRahasia | null> {
  const supabase = await klienServer();
  if (!supabase) return null;
  const { data } = await supabase
    .from("threads_akun")
    .select("threads_user_id, username, token_terenkripsi, token_kedaluwarsa")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  try {
    return {
      threadsUserId: data.threads_user_id as string,
      username: (data.username as string) ?? "",
      tokenKedaluwarsa: (data.token_kedaluwarsa as string) ?? null,
      accessToken: dekripsiApiKey(data.token_terenkripsi as string),
    };
  } catch {
    // Master key hilang/berubah — token tak bisa dibuka; minta sambung ulang.
    return null;
  }
}

/** Status koneksi untuk UI (tanpa token). */
export async function statusAkun(userId: string): Promise<AkunThreads | null> {
  const supabase = await klienServer();
  if (!supabase) return null;
  const { data } = await supabase
    .from("threads_akun")
    .select("threads_user_id, username, token_kedaluwarsa")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  return {
    threadsUserId: data.threads_user_id as string,
    username: (data.username as string) ?? "",
    tokenKedaluwarsa: (data.token_kedaluwarsa as string) ?? null,
  };
}

/** Putuskan koneksi: hapus baris akun (jadwal tertunda ikut dihapus cascade? tidak — dibiarkan, tapi tak bisa terkirim tanpa token). */
export async function hapusAkun(userId: string): Promise<void> {
  const supabase = await klienServer();
  if (!supabase) return;
  await supabase.from("threads_akun").delete().eq("user_id", userId);
}
