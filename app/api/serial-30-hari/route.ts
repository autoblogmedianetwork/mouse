/**
 * POST /api/serial-30-hari — serial konten 30 hari untuk satu produk
 * (Gelombang 3). Sesi wajib (kredit AI); hasilnya draft, bukan jadwal otomatis.
 */
import { NextResponse } from "next/server";
import { jalankanAI } from "@/lib/ai/jalankan-ai";
import { serial30RequestSkema, serial30Skema } from "@/lib/ai/schemas";
import { buildSerial30Prompt, PROMPT_VERSION } from "@/lib/ai/prompts/serial-30-hari.v1";
import { siapkanBody } from "@/lib/api/siapkan-body";

export async function POST(req: Request) {
  const hasil = await siapkanBody(req, serial30RequestSkema);
  if (!hasil.ok) return hasil.respons;
  const parsed = hasil;

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
