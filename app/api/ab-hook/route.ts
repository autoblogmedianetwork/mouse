/**
 * POST /api/ab-hook — A/B otomatis dua hook (Gelombang 3).
 * Sesi wajib (kredit AI); hasilnya draft, bukan posting otomatis.
 */
import { NextResponse } from "next/server";
import { jalankanAI } from "@/lib/ai/jalankan-ai";
import { abHookRequestSkema, abHookSkema } from "@/lib/ai/schemas";
import { buildAbHookPrompt, PROMPT_VERSION } from "@/lib/ai/prompts/ab-hook.v1";
import { siapkanBody } from "@/lib/api/siapkan-body";

export async function POST(req: Request) {
  const hasil = await siapkanBody(req, abHookRequestSkema);
  if (!hasil.ok) return hasil.respons;
  const parsed = hasil;

  const prompt = buildAbHookPrompt(parsed.data);
  const { result, berhenti } = await jalankanAI<unknown>({
    jenis: "generate",
    promptVersion: PROMPT_VERSION,
    prompt,
    schema: abHookSkema,
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
