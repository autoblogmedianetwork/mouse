/**
 * POST /api/riset/review-pasar — Fase 3, task 3-C.
 *
 * User menempel review marketplace (manual, scraping tetap mati). AI
 * mengklasifikasi dan mengekstrak pola. Hasil TIDAK disimpan ke database di
 * task ini — ditampilkan di UI dan tersimpan lokal oleh panel riset; penyimpanan
 * permanen jadi bagian task 3-D (bank masalah).
 *
 * Sesi wajib: rute ini membakar kredit AI atas nama pemilik akun.
 */
// Fluid compute: Hobby default 300s; nyatakan eksplisit supaya route berat
// (output JSON panjang) tidak diputus Vercel di tengah jalan -> HTTP 504.
export const maxDuration = 180;

import { NextResponse } from "next/server";
import { jalankanAI } from "@/lib/ai/jalankan-ai";
import { reviewPasarRequestSkema, reviewPasarSkema } from "@/lib/ai/schemas";
import {
  PROMPT_VERSION,
  buildReviewPasarPrompt,
} from "@/lib/ai/prompts/review-pasar.v1";
import { siapkanBody } from "@/lib/api/siapkan-body";

export async function POST(req: Request) {
  const hasil = await siapkanBody(req, reviewPasarRequestSkema);
  if (!hasil.ok) return hasil.respons;
  const parsed = hasil;

  const { niche, audiens, review_mentah } = parsed.data;
  const prompt = buildReviewPasarPrompt({ niche, audiens, reviewMentah: review_mentah });
  const { result, berhenti } = await jalankanAI<unknown>({
    jenis: "audience",
    promptVersion: PROMPT_VERSION,
    prompt,
    schema: reviewPasarSkema,
    retries: 1,
    temperature: 0.5,
  });

  if (berhenti) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 429 });
  }
  if (!result.ok || !result.data) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Analisis review gagal." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, hasil: result.data, provider: result.provider });
}
