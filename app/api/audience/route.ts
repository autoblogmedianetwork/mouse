/**
 * POST /api/audience — tahap 1 Content Machine (docs/content-machine.md).
 *
 * Satu permintaan = satu riset: niche + target audiens masuk, 10 masalah
 * audiens keluar dan **disimpan** ke `audience_riset`. Tahap 2
 * (`/api/audience/peluang`) membaca baris ini lewat id-nya, bukan dari teks
 * yang ditempel ulang user.
 *
 * Sesi wajib: rute ini membakar kredit AI atas nama pemilik akun.
 */
// Fluid compute: Hobby default 300s; nyatakan eksplisit supaya route berat
// (output JSON panjang) tidak diputus Vercel di tengah jalan -> HTTP 504.
export const maxDuration = 300;

import { NextResponse } from "next/server";
import { jalankanAI } from "@/lib/ai/jalankan-ai";
import { risetAudiensSkema, risetRequestSkema } from "@/lib/ai/schemas";
import {
  buildRisetAudiensPrompt,
  PROMPT_VERSION,
} from "@/lib/ai/prompts/riset-audience.v1";
import { siapkanBody } from "@/lib/api/siapkan-body";

/** Pesan jelas kalau migrasi 0010 belum dijalankan di database. */
const PESAN_TABEL_HILANG =
  "Tabel audience_riset belum ada di database. Jalankan migrasi 0010_riset_audiens.sql di Supabase SQL Editor, lalu coba lagi.";

export async function POST(req: Request) {
  const hasil = await siapkanBody(req, risetRequestSkema);
  if (!hasil.ok) return hasil.respons;
  const parsed = hasil;
  const { user, supabase } = hasil.sesi;

  const { niche, audiens } = parsed.data;
  const prompt = buildRisetAudiensPrompt({ niche, audiens });
  const { result, berhenti } = await jalankanAI<unknown>({
    jenis: "audience",
    promptVersion: PROMPT_VERSION,
    prompt,
    schema: risetAudiensSkema,
    retries: 1,
    timeoutMs: 90_000,
    temperature: 0.8,
  });

  if (berhenti) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 429 });
  }
  if (!result.ok || !result.data) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Riset audiens gagal." },
      { status: 502 },
    );
  }

  const riset = result.data as {
    ringkasan: string;
    masalah: unknown[];
  };

  const { data, error } = await supabase
    .from("audience_riset")
    .insert({
      user_id: user.id,
      niche,
      audiens,
      ringkasan: riset.ringkasan,
      masalah: riset.masalah,
      prompt_version: PROMPT_VERSION,
      model: result.model ?? null,
    })
    .select("id, niche, audiens, ringkasan, masalah, prompt_version, model, created_at")
    .single();

  if (error) {
    const hilang = error.code === "42P01";
    return NextResponse.json(
      { ok: false, error: hilang ? PESAN_TABEL_HILANG : `Riset tidak tersimpan: ${error.message}` },
      { status: hilang ? 503 : 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    riset: data,
    provider: result.provider,
    prompt_version: PROMPT_VERSION,
  });
}
