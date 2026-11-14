/**
 * POST /api/carousel — Prompt 8 (carousel slides), server-side only (AGENTS rule 11).
 *
 * Menerima ide produk, ringkasan, dan preferensi slide. Menghasilkan susunan slide
 * terstruktur (cover, isi, cta) dan caption yang divalidasi dengan Zod schema.
 * Retries: 1 (AGENTS rule 9).
 */
import { NextResponse } from "next/server";
import { jalankanAI } from "@/lib/ai/jalankan-ai";
import { carouselRequestSkema, carouselResponseSkema } from "@/lib/ai/schemas";
import { buildCarouselPrompt, PROMPT_VERSION } from "@/lib/ai/prompts/carousel-slides.v2";
import { siapkanBody } from "@/lib/api/siapkan-body";

export async function POST(req: Request) {
  // Tanpa sesi, siapa pun yang tahu URL ini bisa membebani biaya AI.
  const hasil = await siapkanBody(req, carouselRequestSkema);
  if (!hasil.ok) return hasil.respons;
  const parsed = hasil;

  const prompt = buildCarouselPrompt(parsed.data);
  const { result, berhenti } = await jalankanAI<unknown>({
    jenis: "carousel",
    promptVersion: PROMPT_VERSION,
    prompt,
    schema: carouselResponseSkema,
    retries: 1,
  });

  if (berhenti) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 429 });
  }

  return NextResponse.json(
    { ...result, prompt_version: PROMPT_VERSION },
    { status: result.ok ? 200 : 502 },
  );
}
