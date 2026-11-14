/**
 * POST /api/ai/analisa-gaya — Gelombang 4.
 *
 * User menempel 3-5 post publik (bukan fetch otomatis: Threads tidak punya
 * API publik, jadi scraping tetap mati). AI menyusun DESKRIPSI gaya yang
 * bisa dipakai mengisi persona bernama — bukan menyalin kalimat.
 *
 * Sesi wajib: rute ini membakar kredit AI atas nama pemilik akun.
 */
// Fluid compute: Hobby default 300s; nyatakan eksplisit supaya route berat
// (output JSON panjang) tidak diputus Vercel di tengah jalan -> HTTP 504.
export const maxDuration = 180;

import { NextResponse } from "next/server";
import { jalankanAI } from "@/lib/ai/jalankan-ai";
import { analisaGayaRequestSkema, analisaGayaSkema } from "@/lib/ai/schemas";
import { PROMPT_VERSION, buildAnalisaGayaPrompt } from "@/lib/ai/prompts/analisa-gaya.v1";
import { periksaTempelan } from "@/lib/ai/analisa-gaya";
import { siapkanBody } from "@/lib/api/siapkan-body";

export async function POST(req: Request) {
  const hasil = await siapkanBody(req, analisaGayaRequestSkema);
  if (!hasil.ok) return hasil.respons;
  const parsed = hasil;

  const periksa = periksaTempelan(parsed.data.post_mentah);
  if (!periksa.ok) {
    return NextResponse.json({ ok: false, error: periksa.alasan }, { status: 400 });
  }

  const prompt = buildAnalisaGayaPrompt({ postMentah: parsed.data.post_mentah });
  const { result, berhenti } = await jalankanAI<unknown>({
    jenis: "audience",
    promptVersion: PROMPT_VERSION,
    prompt,
    schema: analisaGayaSkema,
    retries: 1,
    temperature: 0.4,
  });

  if (berhenti) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 429 });
  }
  if (!result.ok || !result.data) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Analisa gaya gagal." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, hasil: result.data, sumber: parsed.data.sumber, provider: result.provider });
}
