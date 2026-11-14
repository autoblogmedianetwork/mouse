/**
 * POST /api/generate — Prompt 3 (status Threads/X), server-side only.
 * One request = one content (one selected idea). Retries: 2 (PRD 10.4).
 * The Zod schema enforces the platform character limit (500 Threads, 280 X,
 * 700 WhatsApp Status, 2200 Caption TikTok — ADR 0020)
 * fitur 9, prompt v3) and the requested count, so a bad answer is retried here
 * and never reaches the UI (AGENTS rule 7). Mode naskah video memakai rute
 * sendiri: /api/naskah-video.
 */
// Fluid compute: Hobby default 300s; nyatakan eksplisit supaya route berat
// (output JSON panjang) tidak diputus Vercel di tengah jalan -> HTTP 504.
export const maxDuration = 300;

import { NextResponse } from "next/server";
import { jalankanAI } from "@/lib/ai/jalankan-ai";
import { BATAS_JUMLAH, generateRequestSkema, statusesSkema } from "@/lib/ai/schemas";
import { batasPlatform, type PlatformId } from "@/lib/platforms/batas";
import { buildGenerateStatusPrompt, PROMPT_VERSION } from "@/lib/ai/prompts/generate-status.v7";
import { ATURAN_MARKETPLACE, deteksiMarketplaceLink } from "@/lib/affiliate/rules";
import { siapkanBody } from "@/lib/api/siapkan-body";

export async function POST(req: Request) {
  // Tanpa sesi, siapa pun yang tahu URL ini bisa membebani biaya AI.
  const hasil = await siapkanBody(req, generateRequestSkema);
  if (!hasil.ok) return hasil.respons;
  const parsed = hasil;

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
  // Fase 4-A: aturan marketplace masuk lewat komposisi di route — file prompt
  // tidak disentuh sama sekali (aturan 13 aman).
  const marketplace = deteksiMarketplaceLink(parsed.data.link);
  const prompt =
    marketplace && marketplace !== "lainnya"
      ? `${buildGenerateStatusPrompt({ ...parsed.data, platform })}

KONTEKS MARKETPLACE: ${ATURAN_MARKETPLACE[marketplace].instruksi}`
      : buildGenerateStatusPrompt({ ...parsed.data, platform });
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
