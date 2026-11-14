/**
 * POST /api/mirror — mirror competitor (manual, tanpa scraping) (Gelombang 3).
 */
import { NextResponse } from "next/server";
import { jalankanAI } from "@/lib/ai/jalankan-ai";
import { mirrorRequestSkema, mirrorSkema } from "@/lib/ai/schemas";
import { buildMirrorPrompt, PROMPT_VERSION } from "@/lib/ai/prompts/mirror.v1";
import { siapkanBody } from "@/lib/api/siapkan-body";

export async function POST(req: Request) {
  const hasil = await siapkanBody(req, mirrorRequestSkema);
  if (!hasil.ok) return hasil.respons;
  const parsed = hasil;

  const prompt = buildMirrorPrompt(parsed.data);
  const { result, berhenti } = await jalankanAI<unknown>({
    jenis: "generate",
    promptVersion: PROMPT_VERSION,
    prompt,
    schema: mirrorSkema,
    retries: 1,
    temperature: 0.85,
  });

  if (berhenti) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 429 });
  }

  return NextResponse.json(
    { ...result, prompt_version: PROMPT_VERSION },
    { status: result.ok ? 200 : 502 },
  );
}
