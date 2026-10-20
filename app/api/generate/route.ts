/**
 * POST /api/generate — Prompt 3 (status Threads/X), server-side only.
 * One request = one content (one selected idea). Retries: 2 (PRD 10.4).
 * The Zod schema enforces the platform character limit (500 Threads, 280 X —
 * fitur 9, prompt v3) and the requested count, so a bad answer is retried here
 * and never reaches the UI (AGENTS rule 7). Mode naskah video memakai rute
 * sendiri: /api/naskah-video.
 */
import { NextResponse } from "next/server";
import { jalankanAI } from "@/lib/ai/jalankan-ai";
import { BATAS_JUMLAH, generateRequestSkema, statusesSkema } from "@/lib/ai/schemas";
import { batasPlatform, type PlatformId } from "@/lib/platforms/batas";
import { buildGenerateStatusPrompt, PROMPT_VERSION } from "@/lib/ai/prompts/generate-status.v4";

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
  if (pengaturan.mode_output === "naskah_video") {
    return NextResponse.json(
      { ok: false, error: "Mode naskah video diproses di /api/naskah-video, bukan di sini." },
      { status: 400 },
    );
  }
  if (pengaturan.mode_output === "carousel") {
    return NextResponse.json(
      { ok: false, error: "Mode carousel diproses di /api/carousel, bukan di sini." },
      { status: 400 },
    );
  }
  const platform: PlatformId = pengaturan.mode_output;
  const batas = batasPlatform(platform);
  const prompt = buildGenerateStatusPrompt({ ...parsed.data, platform });
  const { result, berhenti } = await jalankanAI<unknown>({
    jenis: "generate",
    promptVersion: PROMPT_VERSION,
    prompt,
    schema: statusesSkema(BATAS_JUMLAH[pengaturan.jumlah_status], batas),
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
