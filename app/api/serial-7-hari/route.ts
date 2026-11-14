/**
 * POST /api/serial-7-hari — serial konten 7 hari untuk satu produk
 * (Gelombang 3). Sesi wajib (kredit AI); hasilnya draft, bukan jadwal otomatis.
 */
import { NextResponse } from "next/server";
import { jalankanAI } from "@/lib/ai/jalankan-ai";
import { serial7RequestSkema, serial7Skema } from "@/lib/ai/schemas";
import { buildSerial7Prompt, PROMPT_VERSION } from "@/lib/ai/prompts/serial-7-hari.v1";
import { siapkanBody } from "@/lib/api/siapkan-body";

export async function POST(req: Request) {
  const hasil = await siapkanBody(req, serial7RequestSkema);
  if (!hasil.ok) return hasil.respons;
  const parsed = hasil;

  const prompt = buildSerial7Prompt(parsed.data);
  const { result, berhenti } = await jalankanAI<unknown>({
    jenis: "generate",
    promptVersion: PROMPT_VERSION,
    prompt,
    schema: serial7Skema,
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
