/**
 * GET /api/threads/proses-jadwal — PENGIRIM OTOMATIS (Fase 7, ADR 0023).
 *
 * Dipanggil dua cara:
 *   1. Vercel Cron (setiap 15 menit) dengan header
 *      `Authorization: Bearer <CRON_SECRET>` — diproses dengan klien
 *      service-role, lintas user.
 *   2. Manual dari UI ("Proses sekarang") dengan sesi user — hanya
 *      memproses miliknya sendiri.
 *
 * Aturan fail-closed: tanpa CRON_SECRET maupun sesi, tanpa env Threads,
 * atau tanpa token — tidak ada yang dikirim. Item gagal ditandai "gagal"
 * dengan pesan Indonesia; TIDAK diulang otomatis (anti dobel kirim).
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { klienServer, penggunaSaatIni } from "@/lib/supabase/server";
import { konfigurasiThreads, terjemahkanGalatThreads } from "@/lib/threads-api/config";
import { kirimTeks } from "@/lib/threads-api/kirim";
import { pilihDue, tandaiHasil, type BarisJadwal } from "@/lib/threads-api/jadwal";
import { dekripsiApiKey } from "@/lib/ai/provider-store";

interface BarisDenganToken extends BarisJadwal {
  token: string;
  threads_user_id: string;
}

async function ambilDueLintasUser(): Promise<BarisDenganToken[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "",
    { auth: { persistSession: false } },
  );
  const { data } = await supabase
    .from("jadwal_kirim")
    .select("id, user_id, judul, teks, jadwal_pada, status, threads_post_id, pesan_galat, terkirim_pada, dibuat_pada")
    .eq("status", "terjadwal")
    .lte("jadwal_pada", new Date().toISOString())
    .order("jadwal_pada", { ascending: true })
    .limit(10);

  const baris = (data ?? []) as BarisJadwal[];
  const hasil: BarisDenganToken[] = [];
  for (const b of baris) {
    const { data: akun } = await supabase
      .from("threads_akun")
      .select("threads_user_id, token_terenkripsi")
      .eq("user_id", b.user_id)
      .maybeSingle();
    if (!akun) continue;
    try {
      hasil.push({ ...b, token: dekripsiApiKey(akun.token_terenkripsi as string), threads_user_id: akun.threads_user_id as string });
    } catch {
      await tandaiHasil(b.id, { ok: false, galat: "Token tidak bisa dibuka — sambungkan ulang akun Threads." });
    }
  }
  return hasil;
}

export async function GET(req: Request) {
  const cronRahasia = process.env.CRON_SECRET?.trim();
  const bearer = req.headers.get("authorization")?.replace("Bearer ", "");
  const dariCron = Boolean(cronRahasia) && bearer === cronRahasia;

  let due: BarisDenganToken[] = [];

  if (dariCron) {
    const konfig = konfigurasiThreads();
    if (!konfig) return NextResponse.json({ ok: true, diproses: 0, alasan: "env Threads belum diisi" });
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
      return NextResponse.json({ ok: true, diproses: 0, alasan: "SUPABASE_SERVICE_ROLE_KEY belum diisi" });
    }
    due = await ambilDueLintasUser();
  } else {
    // Mode manual: sesi user, hanya miliknya.
    const supabase = await klienServer();
    const user = supabase ? await penggunaSaatIni() : null;
    if (!supabase || !user) {
      return NextResponse.json({ ok: false, galat: "Butuh sesi login atau CRON_SECRET." }, { status: 401 });
    }
    const akun = await import("@/lib/threads-api/akun").then((m) => m.ambilAkunRahasia(user.id));
    if (!akun) {
      return NextResponse.json({ ok: true, diproses: 0, alasan: "Akun Threads belum terhubung." });
    }
    const { daftarMilik, pilihDue: pilih } = await import("@/lib/threads-api/jadwal");
    const milik = await daftarMilik(user.id);
    due = pilih(milik).map((b) => ({
      ...b,
      token: akun.accessToken,
      threads_user_id: akun.threadsUserId,
    }));
  }

  let sukses = 0;
  let gagal = 0;
  for (const b of due) {
    const hasil = await kirimTeks({
      accessToken: b.token,
      threadsUserId: b.threads_user_id,
      teks: b.teks,
      terjemahkanGalat: terjemahkanGalatThreads,
    });
    await tandaiHasil(b.id, hasil);
    if (hasil.ok) sukses += 1;
    else gagal += 1;
  }

  return NextResponse.json({ ok: true, diproses: due.length, sukses, gagal });
}
