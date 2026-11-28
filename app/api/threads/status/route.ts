/**
 * GET /api/threads/status — status koneksi Threads + antrean titip kirim.
 * Tanpa token terang: hanya username, id, kedaluwarsa, dan daftar antrean.
 */
import { NextResponse } from "next/server";
import { klienServer, penggunaSaatIni } from "@/lib/supabase/server";
import { konfigurasiThreads } from "@/lib/threads-api/config";
import { statusAkun } from "@/lib/threads-api/akun";
import { daftarMilik } from "@/lib/threads-api/jadwal";

export async function GET() {
  const supabase = await klienServer();
  const user = supabase ? await penggunaSaatIni() : null;
  if (!supabase || !user) {
    return NextResponse.json({ ok: true, terhubung: false, terkonfigurasi: false, antrean: [] });
  }

  const terkonfigurasi = konfigurasiThreads() !== null;
  const akun = await statusAkun(user.id);
  const antrean = akun ? await daftarMilik(user.id) : [];

  return NextResponse.json({
    ok: true,
    terkonfigurasi,
    terhubung: akun !== null,
    akun: akun
      ? {
          username: akun.username,
          threadsUserId: akun.threadsUserId,
          tokenKedaluwarsa: akun.tokenKedaluwarsa,
        }
      : null,
    antrean: antrean.map((b) => ({
      id: b.id,
      judul: b.judul,
      teks: b.teks,
      jadwal_pada: b.jadwal_pada,
      status: b.status,
      pesan_galat: b.pesan_galat,
    })),
  });
}
