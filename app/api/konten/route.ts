/**
 * GET/POST /api/konten — riwayat hasil terakhir dari tabel `contents` (N-5).
 *
 * Sumber resmi riwayat adalah Supabase, bukan localStorage. GET mengembalikan
 * 15 konten terakhir milik user beserta statusnya; POST mengirim konten lokal
 * (migrasi sekali jalan) dengan upsert id yang sama sehingga aman diulang.
 *
 * RLS membatasi setiap baris ke pemiliknya, dan `user_id` selalu diambil dari
 * sesi — bukan dari body — supaya klien tidak bisa menulis atas nama user lain
 * (AGENTS rule 11). Lingkungan belum dikonfigurasi atau belum masuk bukan error
 * fatal: route menjawab `tersedia: false` supaya UI menampilkan keterangan.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { klienServer, penggunaSaatIni } from "@/lib/supabase/server";
import {
  RIWAYAT_LIMIT,
  barisKeKonten,
  barisKontenSkema,
  barisStatusSkema,
  kontenKeBaris,
  kontenLayakKirim,
  statusKontenKeBaris,
  urutkanRiwayat,
} from "@/lib/konten/supabase-konten";

const KOLOM =
  "id, judul_internal, status, letak_link, link_produk, gaya_hook, is_arsip, arsip_at, klik_manual, komisi_manual, pengaturan, created_at, updated_at";

export async function GET() {
  const supabase = await klienServer();
  const user = supabase ? await penggunaSaatIni() : null;

  if (!supabase) {
    // Lingkungan belum diisi; UI menampilkan pesan konfigurasi.
    return NextResponse.json({ ok: true, tersedia: false, alasan: "env", baris: [] });
  }
  if (!user) {
    // Belum masuk: bukan masalah konfigurasi, jadi UI meminta user masuk dulu.
    return NextResponse.json({ ok: true, tersedia: false, alasan: "sesi", baris: [] });
  }

  const { data: kontenData, error } = await supabase
    .from("contents")
    .select(KOLOM)
    .order("updated_at", { ascending: false })
    .limit(RIWAYAT_LIMIT);

  if (error) {
    return NextResponse.json(
      { ok: false, tersedia: true, error: error.message, baris: [] },
      { status: 502 },
    );
  }

  const barisKonten = kontenData ?? [];
  const ids = barisKonten.map((b) => String(b.id));

  const teksPerKonten = new Map<string, string[]>();
  if (ids.length > 0) {
    const { data: statusData, error: statusError } = await supabase
      .from("threads_statuses")
      .select("content_id, urutan, teks")
      .in("content_id", ids)
      .order("urutan", { ascending: true });

    if (statusError) {
      return NextResponse.json(
        { ok: false, tersedia: true, error: statusError.message, baris: [] },
        { status: 502 },
      );
    }

    for (const baris of statusData ?? []) {
      const parsed = barisStatusSkema.safeParse(baris);
      if (!parsed.success) continue;
      const daftar = teksPerKonten.get(parsed.data.content_id) ?? [];
      daftar.push(parsed.data.teks);
      teksPerKonten.set(parsed.data.content_id, daftar);
    }
  }

  const baris = barisKonten.flatMap((b) => {
    const parsed = barisKontenSkema.safeParse(b);
    if (!parsed.success) return [];
    return [barisKeKonten(parsed.data, teksPerKonten.get(parsed.data.id) ?? [])];
  });

  return NextResponse.json({ ok: true, tersedia: true, baris: urutkanRiwayat(baris) });
}

const bodySkema = z.object({ konten: z.array(z.unknown()) });

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body bukan JSON valid." }, { status: 400 });
  }

  const parsed = bodySkema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Body harus { konten: [] }." }, { status: 400 });
  }

  const supabase = await klienServer();
  const user = supabase ? await penggunaSaatIni() : null;
  if (!supabase || !user) {
    return NextResponse.json({
      ok: true,
      tersedia: false,
      alasan: supabase ? "sesi" : "env",
      dikirim: 0,
      dilewati: parsed.data.konten.length,
    });
  }

  const layak = kontenLayakKirim(parsed.data.konten);
  if (layak.length === 0) {
    return NextResponse.json({
      ok: true,
      tersedia: true,
      dikirim: 0,
      dilewati: parsed.data.konten.length,
    });
  }

  // user_id dari sesi, bukan dari klien.
  const { error } = await supabase
    .from("contents")
    .upsert(
      layak.map((k) => kontenKeBaris(k, user.id)),
      { onConflict: "id" },
    );

  if (error) {
    return NextResponse.json({ ok: false, tersedia: true, error: error.message }, { status: 502 });
  }

  // Status ditulis ulang penuh supaya urutan tidak tercampur saat konten dikirim lagi.
  const ids = layak.map((k) => k.id);
  const { error: hapusError } = await supabase.from("threads_statuses").delete().in("content_id", ids);
  if (hapusError) {
    return NextResponse.json(
      { ok: false, tersedia: true, error: hapusError.message, dikirim: layak.length },
      { status: 502 },
    );
  }

  const barisStatus = layak.flatMap((k) => statusKontenKeBaris(k, user.id));
  if (barisStatus.length > 0) {
    const { error: statusError } = await supabase.from("threads_statuses").insert(barisStatus);
    if (statusError) {
      return NextResponse.json(
        { ok: false, tersedia: true, error: statusError.message, dikirim: layak.length },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    tersedia: true,
    dikirim: layak.length,
    dilewati: parsed.data.konten.length - layak.length,
  });
}
