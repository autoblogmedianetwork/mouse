/**
 * POST /api/nyanyian — mode nyanyian (Gelombang 3).
 */
import { NextResponse } from "next/server";
import { jalankanAI } from "@/lib/ai/jalankan-ai";
import { nyanyianRequestSkema, nyanyianSkema } from "@/lib/ai/schemas";
import { buildNyanyianPrompt, PROMPT_VERSION } from "@/lib/ai/prompts/nyanyian.v1";
import { siapkanBody } from "@/lib/api/siapkan-body";

export async function POST(req: Request) {
  const hasil = await siapkanBody(req, nyanyianRequestSkema);
  if (!hasil.ok) return hasil.respons;
  const parsed = hasil;

  const prompt = buildNyanyianPrompt(parsed.data);
  const { result, berhenti } = await jalankanAI<unknown>({
    jenis: "generate",
    promptVersion: PROMPT_VERSION,
    prompt,
    schema: nyanyianSkema,
    retries: 1,
    temperature: 0.9,
  });

  if (berhenti) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 429 });
  }

  return NextResponse.json(
    { ...result, prompt_version: PROMPT_VERSION },
    { status: result.ok ? 200 : 502 },
  );
}
