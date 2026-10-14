/**
 * Log pengiriman posting ke tabel `posts` (Fase 7, skema-database bagian 11).
 *
 * Server-only dan best-effort, sama seperti catatGenerasi: kegagalan menulis log
 * tidak boleh membatalkan hasil kirim yang sudah terjadi di Threads. Kalau tabel
 * belum ada (migrasi 0006 belum dijalankan) pesannya muncul di log proses, bukan
 * hilang tanpa jejak.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CatatanKirim, HasilKirim } from "./skema";

export interface CatatanPost {
  kontenId: string;
  judul: string;
  hasil: HasilKirim;
  /** Berapa status yang ikut terkirim di percobaan ini. */
  jumlahStatus: number;
  mode: "manual" | "auto";
}

/** Satu baris per percobaan kirim (berhasil maupun gagal). */
export async function catatPost(
  supabase: SupabaseClient,
  userId: string,
  { kontenId, judul, hasil, jumlahStatus, mode }: CatatanPost,
): Promise<boolean> {
  try {
    const { error } = await supabase.from("posts").insert({
      user_id: userId,
      konten_id: kontenId,
      judul,
      platform: "threads",
      penyedia: hasil.penyedia,
      status: hasil.ok ? "terkirim" : "gagal",
      id_platform: hasil.id_terkirim[0] ?? null,
      jumlah_terkirim: hasil.id_terkirim.length,
      jumlah_status: jumlahStatus,
      mode,
      error: hasil.error ? hasil.error.slice(0, 500) : null,
    });
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("catatPost gagal:", e instanceof Error ? e.message : String(e));
    return false;
  }
}

/**
 * Riwayat kirim dari database untuk jendela 24 jam terakhir.
 *
 * Dipakai rute sebagai sumber kuota yang tidak bisa dipalsukan klien kalau
 * Supabase aktif. Saat Supabase belum dikonfigurasi, rute memakai riwayat yang
 * dikirim klien — lihat catatan batasan di docs/provider-posting.md.
 */
export async function riwayatKirimServer(
  supabase: SupabaseClient,
): Promise<CatatanKirim[]> {
  const mulai = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("posts")
    .select("konten_id,status,penyedia,created_at")
    .gte("created_at", mulai);
  if (error) return [];
  return (data ?? []).flatMap((row) => {
    const r = row as { konten_id?: string; status?: string; penyedia?: string; created_at?: string };
    if (!r.konten_id || !r.created_at) return [];
    return [
      {
        konten_id: r.konten_id,
        waktu: r.created_at,
        ok: r.status === "terkirim",
        penyedia: r.penyedia === "threads_api" ? ("threads_api" as const) : ("manual" as const),
      },
    ];
  });
}
