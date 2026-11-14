/**
 * POST /api/naskah-video — Prompt 9 (naskah video tiga bagian), server-side only.
 * One request = one content (one selected idea). Retries: 1 (AGENTS rule 9).
 * The Zod schema enforces the three parts, the 500-character limit per part
 * (AGENTS rule 10), and the 30–60 second duration, so a bad answer is retried
 * here and never reaches the UI.
 */
import { NextResponse } from "next/server";
import { jalankanAI } from "@/lib/ai/jalankan-ai";
import { generateRequestSkema, naskahVideoSkema } from "@/lib/ai/schemas";
import { buildNaskahVideoPrompt, PROMPT_VERSION } from "@/lib/ai/prompts/naskah-video.v2";
import { siapkanBody } from "@/lib/api/siapkan-body";

export async function POST(req: Request) {
  // Tanpa sesi, siapa pun yang tahu URL ini bisa membebani biaya AI.
  // Body memakai bentuk yang sama dengan /api/generate supaya alur di UI bisa
  // memakai satu helper; field pengaturan yang relevan dipakai prompt 09.
  const hasil = await siapkanBody(req, generateRequestSkema);
  if (!hasil.ok) return hasil.respons;
  const parsed = hasil;

  const prompt = buildNaskahVideoPrompt(parsed.data);
  const { result, berhenti } = await jalankanAI<unknown>({
    jenis: "naskah_video",
    promptVersion: PROMPT_VERSION,
    prompt,
    schema: naskahVideoSkema,
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
