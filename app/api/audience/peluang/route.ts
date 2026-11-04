/**
 * POST /api/audience/peluang — tahap 2 Content Machine.
 *
 * Membaca satu riset yang sudah tersimpan (bukan dari body), meminta 20
 * kategori produk, lalu menulisnya ke `peluang_produk`. Dipisah dari
 * `/api/audience` supaya tahap 1 tetap tersimpan walau tahap 2 gagal, dan
 * supaya penyusunan peluang bisa diulang tanpa membayar ulang riset.
 *
 * Susun ulang menghapus baris peluang lama untuk riset ini; produk yang
 * sudah dibuat dari baris tersebut tidak ikut terhapus.
 */
import { NextResponse } from "next/server";
import { jalankanAI } from "@/lib/ai/jalankan-ai";
import { peluangProdukSkema, peluangRequestSkema } from "@/lib/ai/schemas";
import {
  buildPeluangProdukPrompt,
  PROMPT_VERSION,
} from "@/lib/ai/prompts/peluang-produk.v1";
import { wajibSesi } from "@/lib/supabase/server";

const PESAN_TABEL_HILANG =
  "Tabel peluang_produk belum ada di database. Jalankan migrasi 0010_riset_audiens.sql di Supabase SQL Editor, lalu coba lagi.";

export async function POST(req: Request) {
  const sesi = await wajibSesi();
  if ("respons" in sesi) return sesi.respons;
  const { user, supabase } = sesi;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body bukan JSON valid." }, { status: 400 });
  }

  const parsed = peluangRequestSkema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak valid." },
      { status: 400 },
    );
  }

  // RLS membatasi baris ke milik user, jadi id asing otomatis tidak ketemu.
  const { data: riset, error: risetError } = await supabase
    .from("audience_riset")
    .select("id, niche, audiens, ringkasan, masalah")
    .eq("id", parsed.data.risetId)
    .maybeSingle();

  if (risetError) {
    const hilang = risetError.code === "42P01";
    return NextResponse.json(
      {
        ok: false,
        error: hilang ? PESAN_TABEL_HILANG : `Riset tidak bisa dibaca: ${risetError.message}`,
      },
      { status: hilang ? 503 : 500 },
    );
  }
  if (!riset) {
    return NextResponse.json(
      { ok: false, error: "Riset tidak ditemukan. Muat ulang halaman lalu pilih riset dari daftar." },
      { status: 404 },
    );
  }

  const daftarMasalah = Array.isArray(riset.masalah)
    ? (riset.masalah as Array<{ masalah?: unknown }>)
        .map((m) => (typeof m?.masalah === "string" ? m.masalah : ""))
        .filter((m) => m.length > 0)
    : [];

  const prompt = buildPeluangProdukPrompt({
    niche: riset.niche,
    audiens: riset.audiens,
    ringkasan: riset.ringkasan,
    masalah: daftarMasalah,
  });

  const { result, berhenti } = await jalankanAI<unknown>({
    jenis: "peluang",
    promptVersion: PROMPT_VERSION,
    prompt,
    schema: peluangProdukSkema,
    retries: 1,
    temperature: 0.8,
  });

  if (berhenti) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 429 });
  }
  if (!result.ok || !result.data) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Penyusunan peluang gagal." },
      { status: 502 },
    );
  }

  const { peluang } = result.data as {
    peluang: Array<{
      kategori: string;
      alasan: string;
      masalah_terkait: string;
      contoh_produk: string[];
      prioritas: string;
      kesulitan_konten: string;
    }>;
  };

  const baris = peluang.map((p, index) => ({
    user_id: user.id,
    riset_id: riset.id,
    urutan: index + 1,
    kategori: p.kategori,
    alasan: p.alasan,
    masalah_terkait: p.masalah_terkait || null,
    contoh_produk: p.contoh_produk,
    prioritas: p.prioritas,
    kesulitan_konten: p.kesulitan_konten,
  }));

  // Susun ulang = daftar baru. Tanda "dipilih" ikut direset; produk yang
  // sudah dibuat tetap ada di tabel products.
  const { error: hapusError } = await supabase
    .from("peluang_produk")
    .delete()
    .eq("riset_id", riset.id);
  if (hapusError) {
    const hilang = hapusError.code === "42P01";
    return NextResponse.json(
      {
        ok: false,
        error: hilang ? PESAN_TABEL_HILANG : `Peluang lama gagal dibersihkan: ${hapusError.message}`,
      },
      { status: hilang ? 503 : 500 },
    );
  }

  const { data, error } = await supabase
    .from("peluang_produk")
    .insert(baris)
    .select(
      "id, riset_id, urutan, kategori, alasan, masalah_terkait, contoh_produk, prioritas, kesulitan_konten, dipilih, produk_id",
    );

  if (error) {
    const hilang = error.code === "42P01";
    return NextResponse.json(
      {
        ok: false,
        error: hilang ? PESAN_TABEL_HILANG : `Peluang tidak tersimpan: ${error.message}`,
      },
      { status: hilang ? 503 : 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    peluang: (data ?? []).sort(
      (a: { urutan: number }, b: { urutan: number }) => a.urutan - b.urutan,
    ),
    prompt_version: PROMPT_VERSION,
  });
}
