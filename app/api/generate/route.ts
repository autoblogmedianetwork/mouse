/**
 * POST /api/generate — Prompt 3 (status Threads), server-side only.
 * One request = one content (one selected idea). Retries: 2 (PRD 10.4).
 * The Zod schema enforces the 500-char limit and the requested count,
 * so a bad answer is retried here and never reaches the UI (AGENTS rule 7).
 */
import { NextResponse } from "next/server";
import { jalankanAI } from "@/lib/ai/jalankan-ai";
import { BATAS_JUMLAH, generateRequestSkema, statusesSkema } from "@/lib/ai/schemas";
import { buildGenerateStatusPrompt, PROMPT_VERSION } from "@/lib/ai/prompts/generate-status.v2";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body bukan JSON valid." }, { status: 400 });
  }

  const parsed = generateRequestSkema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak valid." },
      { status: 400 },
    );
  }

  const { pengaturan } = parsed.data;
  const prompt = buildGenerateStatusPrompt(parsed.data);
  const { result, berhenti } = await jalankanAI<unknown>({
    jenis: "generate",
    promptVersion: PROMPT_VERSION,
    prompt,
    schema: statusesSkema(BATAS_JUMLAH[pengaturan.jumlah_status]),
    retries: 2,
  });

  if (berhenti) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 429 });
  }

  return NextResponse.json(
    { ...result, prompt_version: PROMPT_VERSION },
    { status: result.ok ? 200 : 502 },
  );
}
