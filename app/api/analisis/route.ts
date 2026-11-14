/**
 * POST /api/analisis — Prompt 1 (analisis produk), server-side only.
 * The AI API key never leaves the server (AGENTS rule 11).
 */
import { NextResponse } from "next/server";
import { jalankanAI } from "@/lib/ai/jalankan-ai";
import { analisisRequestSkema, analisisSkema } from "@/lib/ai/schemas";
import { buildAnalisisPenawaranPrompt, PROMPT_VERSION } from "@/lib/ai/prompts/analisis-penawaran.v3";
import { cleanDescription } from "@/lib/produk/bersihkan-deskripsi";
import { siapkanBody } from "@/lib/api/siapkan-body";

export async function POST(req: Request) {
  // Tanpa sesi, siapa pun yang tahu URL ini bisa membebani biaya AI.
  const hasil = await siapkanBody(req, analisisRequestSkema);
  if (!hasil.ok) return hasil.respons;
  const parsed = hasil;

  // Defense in depth: clean the description server-side too (PRD 10.1).
  const deskripsi = cleanDescription(parsed.data.deskripsi);
  if (deskripsi.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Deskripsi kosong setelah pembersihan." },
      { status: 400 },
    );
  }

  const prompt = buildAnalisisPenawaranPrompt({ ...parsed.data, deskripsi });
  const { result, berhenti } = await jalankanAI<unknown>({
    jenis: "analisis",
    promptVersion: PROMPT_VERSION,
    prompt,
    schema: analisisSkema,
    retries: 1,
    timeoutMs: 120_000,
  });

  // K6: month-to-date budget reached — refuse further AI spend.
  if (berhenti) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 429 },
    );
  }

  return NextResponse.json(
    { ...result, prompt_version: PROMPT_VERSION },
    { status: result.ok ? 200 : 502 },
  );
}
