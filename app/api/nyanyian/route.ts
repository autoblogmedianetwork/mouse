/**
 * POST /api/nyanyian — mode nyanyian (Gelombang 3).
 */
import { NextResponse } from "next/server";
import { jalankanAI } from "@/lib/ai/jalankan-ai";
import { nyanyianRequestSkema, nyanyianSkema } from "@/lib/ai/schemas";
import { buildNyanyianPrompt, PROMPT_VERSION } from "@/lib/ai/prompts/nyanyian.v1";
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

  const parsed = nyanyianRequestSkema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak valid." },
      { status: 400 },
    );
  }

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
