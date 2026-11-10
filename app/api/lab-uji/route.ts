/**
 * POST /api/lab-uji — lab uji konten / simulator pembeli (Gelombang 3).
 *
 * Menilai konten dari tiga persona pembeli virtual. Sesi wajib karena rute ini
 * membakar kredit AI (AGENTS rule 11). Hasilnya selalu bahan tinjauan, bukan
 * status posting.
 */
import { NextResponse } from "next/server";
import { jalankanAI } from "@/lib/ai/jalankan-ai";
import { labUjiRequestSkema, labUjiSkema } from "@/lib/ai/schemas";
import { buildLabUjiPrompt, PROMPT_VERSION } from "@/lib/ai/prompts/lab-uji.v1";
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

  const parsed = labUjiRequestSkema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak valid." },
      { status: 400 },
    );
  }

  const prompt = buildLabUjiPrompt(parsed.data);
  const { result, berhenti } = await jalankanAI<unknown>({
    jenis: "audience",
    promptVersion: PROMPT_VERSION,
    prompt,
    schema: labUjiSkema,
    retries: 1,
    temperature: 0.7,
  });

  if (berhenti) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 429 });
  }

  return NextResponse.json(
    { ...result, prompt_version: PROMPT_VERSION },
    { status: result.ok ? 200 : 502 },
  );
}
