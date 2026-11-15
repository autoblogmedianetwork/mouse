/**
 * POST /api/ghostwriter — ubah transkrip menjadi status Threads (Gelombang 3).
 *
 * Draf saja TULISAN UNTUK ORANG LAIN: hasil wajib ditinjau user sebelum dipakai.
 * Tidak pernah dikirim ke akun mana pun oleh aplikasi ini.
 */
import { NextResponse } from "next/server";
import { jalankanAI } from "@/lib/ai/jalankan-ai";
import { ghostwriterRequestSkema, ghostwriterSkema } from "@/lib/ai/schemas";
import { buildGhostwriterPrompt, PROMPT_VERSION } from "@/lib/ai/prompts/ghostwriter.v1";
import { siapkanBody } from "@/lib/api/siapkan-body";

export async function POST(req: Request) {
  const hasil = await siapkanBody(req, ghostwriterRequestSkema);
  if (!hasil.ok) return hasil.respons;
  const parsed = hasil;

  const prompt = buildGhostwriterPrompt(parsed.data);
  const { result, berhenti } = await jalankanAI<unknown>({
    jenis: "generate",
    promptVersion: PROMPT_VERSION,
    prompt,
    schema: ghostwriterSkema,
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
