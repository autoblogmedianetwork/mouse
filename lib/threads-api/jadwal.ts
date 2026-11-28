/**
 * Antrean "titip kirim" (Fase 7, ADR 0023) — akses data jadwal_kirim.
 *
 * Arsitektur "titip kirim": konten & jadwal user ada di localStorage, dan
 * server TIDAK membacanya. Yang ada di server hanyalah teks yang user
 * TITIPKAN secara eksplisit lewat tombol Jadwalkan otomatis — persetujuan
 * ganda: (1) konten lolos checklist di klien, (2) user menekan jadwalkan.
 *
 * Dua klien Supabase:
 *  - klienServer (sesi user, RLS) untuk aksi dari UI.
 *  - klienService (bypass RLS, dilindungi CRON_SECRET) khusus pengirim cron
 *    yang membaca antrean lintas user — query selalu eksplisit per baris.
 */
import { klienServer } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export type StatusJadwal = "terjadwal" | "terkirim" | "gagal" | "dibatalkan";

export interface BarisJadwal {
  id: string;
  user_id: string;
  judul: string;
  teks: string;
  jadwal_pada: string;
  status: StatusJadwal;
  threads_post_id: string | null;
  pesan_galat: string | null;
  terkirim_pada: string | null;
  dibuat_pada: string;
}

/** Klien service-role; null bila env belum diisi (cron tidak jalan). */
export function klienService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface MasukanJadwal {
  judul: string;
  teks: string;
  jadwalPada: Date;
}

export type HasilJadwalkan =
  | { ok: true; id: string }
  | { ok: false; galat: string };

/** Validasi murni — dipisah agar bisa diuji tanpa database. */
export function validasiTitipan(
  masukan: MasukanJadwal,
  batasKarakter: number,
  sekarang = new Date(),
): { ok: true } | { ok: false; galat: string } {
  const teks = masukan.teks.trim();
  if (!teks) return { ok: false, galat: "Teks kosong." };
  if (teks.length > batasKarakter) {
    return { ok: false, galat: `Teks ${teks.length} karakter, melebihi batas ${batasKarakter}.` };
  }
  if (masukan.jadwalPada.getTime() <= sekarang.getTime()) {
    return { ok: false, galat: "Jadwal harus di masa depan. Untuk kirim sekarang, pakai tombol Buka di Threads." };
  }
  if (masukan.jadwalPada.getTime() > sekarang.getTime() + 90 * 24 * 60 * 60 * 1000) {
    return { ok: false, galat: "Jadwal maksimal 90 hari ke depan." };
  }
  return { ok: true };
}

/** Titipkan satu kiriman (dari sesi user). */
export async function titipkan(
  userId: string,
  masukan: MasukanJadwal,
): Promise<HasilJadwalkan> {
  const supabase = await klienServer();
  if (!supabase) return { ok: false, galat: "Database belum terhubung." };
  const { data, error } = await supabase
    .from("jadwal_kirim")
    .insert({
      user_id: userId,
      judul: masukan.judul.slice(0, 200),
      teks: masukan.teks.trim(),
      jadwal_pada: masukan.jadwalPada.toISOString(),
    })
    .select("id")
    .single();
  if (error) return { ok: false, galat: `Gagal menyimpan jadwal: ${error.message}` };
  return { ok: true, id: data.id as string };
}

/** Antrean milik satu user (terjadwal + riwayat), terbaru dulu. */
export async function daftarMilik(userId: string): Promise<BarisJadwal[]> {
  const supabase = await klienServer();
  if (!supabase) return [];
  const { data } = await supabase
    .from("jadwal_kirim")
    .select("*")
    .eq("user_id", userId)
    .order("jadwal_pada", { ascending: false })
    .limit(50);
  return (data ?? []) as BarisJadwal[];
}

/** Kill switch: batalkan SEMUA kiriman terjadwal milik user. */
export async function batalkanSemuaMilik(userId: string): Promise<number> {
  const supabase = await klienServer();
  if (!supabase) return 0;
  const { data } = await supabase
    .from("jadwal_kirim")
    .update({ status: "dibatalkan" })
    .eq("user_id", userId)
    .eq("status", "terjadwal")
    .select("id");
  return (data ?? []).length;
}

/** Batalkan satu. */
export async function batalkanSatu(userId: string, id: string): Promise<void> {
  const supabase = await klienServer();
  if (!supabase) return;
  await supabase
    .from("jadwal_kirim")
    .update({ status: "dibatalkan" })
    .eq("user_id", userId)
    .eq("id", id)
    .eq("status", "terjadwal");
}

/** Pilih item yang jatuh tempo (untuk pengirim cron, service-role). */
export function pilihDue(
  semua: BarisJadwal[],
  sekarang = new Date(),
): BarisJadwal[] {
  return semua
    .filter((b) => b.status === "terjadwal" && Date.parse(b.jadwal_pada) <= sekarang.getTime())
    .sort((a, b) => Date.parse(a.jadwal_pada) - Date.parse(b.jadwal_pada))
    .slice(0, 10); // kecil, terukur — kuota Threads 250/hari jauh di atas ini
}

/** Tandai hasil kirim (service-role, dari pengirim cron). */
export async function tandaiHasil(
  id: string,
  hasil: { ok: true; postId: string } | { ok: false; galat: string },
): Promise<void> {
  const supabase = klienService();
  if (!supabase) return;
  if (hasil.ok) {
    await supabase
      .from("jadwal_kirim")
      .update({ status: "terkirim", threads_post_id: hasil.postId, terkirim_pada: new Date().toISOString(), pesan_galat: null })
      .eq("id", id);
  } else {
    await supabase
      .from("jadwal_kirim")
      .update({ status: "gagal", pesan_galat: hasil.galat.slice(0, 300) })
      .eq("id", id);
  }
}
