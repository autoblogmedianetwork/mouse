/**
 * POST /api/analisis — Prompt 1 (analisis produk), server-side only.
 * The AI API key never leaves the server (AGENTS rule 11).
 */
import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai/generate-json";
import { analisisRequestSkema, analisisSkema } from "@/lib/ai/schemas";
import { buildAnalisisProdukPrompt, PROMPT_VERSION } from "@/lib/ai/prompts/analisis-produk.v1";
import { cleanDescription } from "@/lib/produk/bersihkan-deskripsi";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body bukan JSON valid." }, { status: 400 });
  }

  const parsed = analisisRequestSkema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak valid." },
      { status: 400 },
    );
  }

  // Defense in depth: clean the description server-side too (PRD 10.1).
  const deskripsi = cleanDescription(parsed.data.deskripsi);
  if (deskripsi.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Deskripsi kosong setelah pembersihan." },
      { status: 400 },
    );
  }

  const prompt = buildAnalisisProdukPrompt({ ...parsed.data, deskripsi });
  const result = await generateJSON(prompt, analisisSkema, {
    retries: 1,
    timeoutMs: 120_000,
  });

  return NextResponse.json(
    { ...result, prompt_version: PROMPT_VERSION },
    { status: result.ok ? 200 : 502 },
  );
}
