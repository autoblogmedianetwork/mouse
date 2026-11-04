/**
 * POST /api/ide — Prompt 2 (10 ide konten), server-side only.
 */
import { NextResponse } from "next/server";
import { jalankanAI } from "@/lib/ai/jalankan-ai";
import { ideRequestSkema, ideSkema } from "@/lib/ai/schemas";
import { buildIdeKontenPrompt, PROMPT_VERSION } from "@/lib/ai/prompts/ide-konten.v2";
import { wajibSesi } from "@/lib/supabase/server";

export async function POST(req: Request) {
  // Tanpa sesi, siapa pun yang tahu URL ini bisa membebani biaya AI.
  const sesi = await wajibSesi();
  if ("respons" in sesi) return sesi.respons;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body bukan JSON valid." }, { status: 400 });
  }

  const parsed = ideRequestSkema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak valid." },
      { status: 400 },
    );
  }

  const prompt = buildIdeKontenPrompt(parsed.data);
  const { result, berhenti } = await jalankanAI<unknown>({
    jenis: "ide",
    promptVersion: PROMPT_VERSION,
    prompt,
    schema: ideSkema,
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
