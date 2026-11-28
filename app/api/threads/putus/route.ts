/**
 * POST /api/threads/putus — putuskan koneksi Threads (hapus baris akun;
 * token terenkripsi ikut hilang). Antrean titip kirim tidak dihapus otomatis
 * — user diminta memakai kill switch bila ingin membatalkan semuanya.
 */
import { NextResponse } from "next/server";
import { klienServer, penggunaSaatIni } from "@/lib/supabase/server";
import { hapusAkun } from "@/lib/threads-api/akun";

export async function POST() {
  const supabase = await klienServer();
  const user = supabase ? await penggunaSaatIni() : null;
  if (!supabase || !user) {
    return NextResponse.json({ ok: false, galat: "Login dulu." }, { status: 401 });
  }
  await hapusAkun(user.id);
  return NextResponse.json({ ok: true });
}
