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
import { NextResponse } from "next/server";
import { jalankanAI } from "@/lib/ai/jalankan-ai";
import { reviewPasarRequestSkema, reviewPasarSkema } from "@/lib/ai/schemas";
import {
  PROMPT_VERSION,
  buildReviewPasarPrompt,
} from "@/lib/ai/prompts/review-pasar.v1";
import { wajibSesi } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const sesi = await wajibSesi();
  if ("respons" in sesi) return sesi.respons;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body bukan JSON valid." }, { status: 400 });
  }

  const parsed = reviewPasarRequestSkema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak valid." },
      { status: 400 },
    );
  }

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

  return NextResponse.json({ ok: true, hasil: result.data });
}
