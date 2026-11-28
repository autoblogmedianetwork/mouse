/**
 * POST /api/ai/varian-balasan — pengembangan Bank Balasan: dari satu template
 * bawaan, AI membuat 2-3 varian dengan suara user (dari Analisa Gaya bila
 * ada). Placeholder kurung siku dipertahankan supaya user mengisi konteks
 * sendiri. Draft-only — tidak ada pengiriman otomatis (Fase 4).
 *
 * Sesi wajib: rute ini membakar kredit AI atas nama pemilik akun.
 */
export const maxDuration = 120;

import { NextResponse } from "next/server";
import { jalankanAI } from "@/lib/ai/jalankan-ai";
import { varianBalasanRequestSkema, varianBalasanSkema } from "@/lib/ai/schemas";
import { PROMPT_VERSION, buildVarianBalasanPrompt } from "@/lib/ai/prompts/varian-balasan.v1";
import { siapkanBody } from "@/lib/api/siapkan-body";

export async function POST(req: Request) {
  const hasil = await siapkanBody(req, varianBalasanRequestSkema);
  if (!hasil.ok) return hasil.respons;

  const prompt = buildVarianBalasanPrompt({
    situasi: hasil.data.situasi,
    templat: hasil.data.templat,
    gayaBicara: hasil.data.gayaBicara,
  });
  const { result, berhenti } = await jalankanAI<unknown>({
    jenis: "generate",
    promptVersion: PROMPT_VERSION,
    prompt,
    schema: varianBalasanSkema,
    retries: 1,
    temperature: 0.8,
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
