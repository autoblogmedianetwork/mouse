/**
 * POST /api/foto — konten dari foto (Gelombang 3). Butuh model yang mendukung visi.
 */
import { NextResponse } from "next/server";
import { jalankanAI } from "@/lib/ai/jalankan-ai";
import { fotoRequestSkema, fotoSkema } from "@/lib/ai/schemas";
import { buildFotoPrompt, PROMPT_VERSION } from "@/lib/ai/prompts/foto.v1";
import { siapkanBody } from "@/lib/api/siapkan-body";

export async function POST(req: Request) {
  const hasil = await siapkanBody(req, fotoRequestSkema);
  if (!hasil.ok) return hasil.respons;
  const parsed = hasil;

  const prompt = buildFotoPrompt({ konteks: parsed.data.konteks });
  const { result, berhenti } = await jalankanAI<unknown>({
    jenis: "generate",
    promptVersion: PROMPT_VERSION,
    prompt,
    schema: fotoSkema,
    retries: 1,
    temperature: 0.85,
    imageUrl: parsed.data.imageUrl,
  });

  if (berhenti) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 429 });
  }

  return NextResponse.json(
    { ...result, prompt_version: PROMPT_VERSION },
    { status: result.ok ? 200 : 502 },
  );
}
