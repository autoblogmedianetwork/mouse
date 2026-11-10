/**
 * POST /api/ide-masalah — mesin ide dari bank masalah riset (Gelombang 3).
 * Satu masalah masuk, tiga hook keluar. Sesi wajib (kredit AI).
 */
import { NextResponse } from "next/server";
import { jalankanAI } from "@/lib/ai/jalankan-ai";
import { ideMasalahRequestSkema, ideMasalahSkema } from "@/lib/ai/schemas";
import { buildIdeMasalahPrompt, PROMPT_VERSION } from "@/lib/ai/prompts/ide-masalah.v1";
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

  const parsed = ideMasalahRequestSkema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak valid." },
      { status: 400 },
    );
  }

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
