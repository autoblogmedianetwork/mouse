/**
 * POST /api/threads/jadwalkan — titipkan satu kiriman otomatis
 * (persetujuan ganda, ADR 0023): hanya diterima bila akun Threads sudah
 * terhubung dan token masih hidup. Server tidak pernah membaca konten
 * localStorage — yang disimpan hanya teks yang dikirim user secara
 * eksplisit dari klien yang sudah memvalidasi checklist.
 */
import { NextResponse } from "next/server";
import { klienServer, penggunaSaatIni } from "@/lib/supabase/server";
import { statusAkun } from "@/lib/threads-api/akun";
import { titipkan, validasiTitipan } from "@/lib/threads-api/jadwal";
import { BATAS_PLATFORM } from "@/lib/platforms/batas";

export async function POST(req: Request) {
  const supabase = await klienServer();
  const user = supabase ? await penggunaSaatIni() : null;
  if (!supabase || !user) {
    return NextResponse.json({ ok: false, galat: "Login dulu." }, { status: 401 });
  }

  const akun = await statusAkun(user.id);
  if (!akun) {
    return NextResponse.json(
      { ok: false, galat: "Akun Threads belum terhubung. Sambungkan dulu di Pengaturan." },
      { status: 400 },
    );
  }

  const body = (await req.json().catch(() => null)) as
    | { judul?: string; teks?: string; jadwal_pada?: string }
    | null;
  const teks = body?.teks?.trim() ?? "";
  const jadwal = body?.jadwal_pada ? new Date(body.jadwal_pada) : null;
  if (!teks || !jadwal || Number.isNaN(jadwal.getTime())) {
    return NextResponse.json({ ok: false, galat: "Teks dan jadwal wajib diisi." }, { status: 400 });
  }

  const valid = validasiTitipan(
    { judul: body?.judul?.slice(0, 200) ?? "", teks, jadwalPada: jadwal },
    BATAS_PLATFORM.threads,
  );
  if (!valid.ok) {
    return NextResponse.json({ ok: false, galat: valid.galat }, { status: 400 });
  }

  const hasil = await titipkan(user.id, { judul: body?.judul ?? "", teks, jadwalPada: jadwal });
  if (!hasil.ok) {
    return NextResponse.json({ ok: false, galat: hasil.galat }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: hasil.id });
}
