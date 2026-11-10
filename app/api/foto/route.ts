/**
 * POST /api/foto — konten dari foto (Gelombang 3). Butuh model yang mendukung visi.
 */
import { NextResponse } from "next/server";
import { jalankanAI } from "@/lib/ai/jalankan-ai";
import { fotoRequestSkema, fotoSkema } from "@/lib/ai/schemas";
import { buildFotoPrompt, PROMPT_VERSION } from "@/lib/ai/prompts/foto.v1";
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

  const parsed = fotoRequestSkema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak valid." },
      { status: 400 },
    );
  }

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
