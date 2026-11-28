/**
 * POST /api/threads/batalkan-semua — KILL SWITCH (ADR 0023): batalkan
 * SEMUA kiriman otomatis yang masih terjadwal milik user. Satu klik,
 * seketika, tidak bisa salah konten.
 */
import { NextResponse } from "next/server";
import { klienServer, penggunaSaatIni } from "@/lib/supabase/server";
import { batalkanSemuaMilik } from "@/lib/threads-api/jadwal";

export async function POST() {
  const supabase = await klienServer();
  const user = supabase ? await penggunaSaatIni() : null;
  if (!supabase || !user) {
    return NextResponse.json({ ok: false, galat: "Login dulu." }, { status: 401 });
  }
  const jumlah = await batalkanSemuaMilik(user.id);
  return NextResponse.json({ ok: true, dibatalkan: jumlah });
}
