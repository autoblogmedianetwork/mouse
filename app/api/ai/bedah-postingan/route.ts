/**
 * POST /api/ai/bedah-postingan — ide #4 (riset 17 Nov): bedah anatomi SATU
 * postingan orang lain yang ditempel manual (tanpa scraping). Keluarannya
 * edukasi (jenis hook, CTA, struktur, pelajaran) — bukan naskah siap
 * posting, jadi tetap satu keluarga dengan alat Lab yang draft-only.
 *
 * Sesi wajib: rute ini membakar kredit AI atas nama pemilik akun.
 */
export const maxDuration = 120;

import { NextResponse } from "next/server";
import { jalankanAI } from "@/lib/ai/jalankan-ai";
import { bedahPostinganRequestSkema, bedahPostinganSkema } from "@/lib/ai/schemas";
import { PROMPT_VERSION, buildBedahPostinganPrompt } from "@/lib/ai/prompts/bedah-postingan.v1";
import { siapkanBody } from "@/lib/api/siapkan-body";

export async function POST(req: Request) {
  const hasil = await siapkanBody(req, bedahPostinganRequestSkema);
  if (!hasil.ok) return hasil.respons;

  const prompt = buildBedahPostinganPrompt({ postingan: hasil.data.postingan });
  const { result, berhenti } = await jalankanAI<unknown>({
    jenis: "audience",
    promptVersion: PROMPT_VERSION,
    prompt,
    schema: bedahPostinganSkema,
    retries: 1,
    temperature: 0.3,
  });

  if (berhenti) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 429 });
  }
  if (!result.ok || !result.data) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "AI tidak memberi jawaban valid." },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true, data: result.data });
}
