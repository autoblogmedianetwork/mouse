/**
 * POST /api/ide-masalah — mesin ide dari bank masalah riset (Gelombang 3).
 * Satu masalah masuk, tiga hook keluar. Sesi wajib (kredit AI).
 */
import { NextResponse } from "next/server";
import { jalankanAI } from "@/lib/ai/jalankan-ai";
import { ideMasalahRequestSkema, ideMasalahSkema } from "@/lib/ai/schemas";
import { buildIdeMasalahPrompt, PROMPT_VERSION } from "@/lib/ai/prompts/ide-masalah.v1";
import { siapkanBody } from "@/lib/api/siapkan-body";

export async function POST(req: Request) {
  const hasil = await siapkanBody(req, ideMasalahRequestSkema);
  if (!hasil.ok) return hasil.respons;
  const parsed = hasil;

  const prompt = buildIdeMasalahPrompt(parsed.data);
  const { result, berhenti } = await jalankanAI<unknown>({
    jenis: "ide",
    promptVersion: PROMPT_VERSION,
    prompt,
    schema: ideMasalahSkema,
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
