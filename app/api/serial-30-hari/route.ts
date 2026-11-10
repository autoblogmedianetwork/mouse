/**
 * POST /api/serial-30-hari — serial konten 30 hari untuk satu produk
 * (Gelombang 3). Sesi wajib (kredit AI); hasilnya draft, bukan jadwal otomatis.
 */
import { NextResponse } from "next/server";
import { jalankanAI } from "@/lib/ai/jalankan-ai";
import { serial30RequestSkema, serial30Skema } from "@/lib/ai/schemas";
import { buildSerial30Prompt, PROMPT_VERSION } from "@/lib/ai/prompts/serial-30-hari.v1";
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

  const parsed = serial30RequestSkema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak valid." },
      { status: 400 },
    );
  }

  const prompt = buildSerial30Prompt(parsed.data);
  const { result, berhenti } = await jalankanAI<unknown>({
    jenis: "generate",
    promptVersion: PROMPT_VERSION,
    prompt,
    schema: serial30Skema,
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
