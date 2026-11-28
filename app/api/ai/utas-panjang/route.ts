/**
 * POST /api/ai/utas-panjang — ide #5 (riset 17 Nov): generator utas panjang
 * untuk LAMPIRAN TEKS Threads (fitur baru Threads, sampai 10.000 karakter).
 * Review produk mendalam tanpa pecah 5 status. Draft-only di Lab; user
 * menempel hasilnya ke lampiran teks Threads secara manual.
 *
 * Sesi wajib: rute ini membakar kredit AI atas nama pemilik akun.
 */
// Output bisa 10.000 karakter — beri waktu longgar.
export const maxDuration = 180;

import { NextResponse } from "next/server";
import { jalankanAI } from "@/lib/ai/jalankan-ai";
import { utasPanjangRequestSkema, utasPanjangSkema } from "@/lib/ai/schemas";
import { PROMPT_VERSION, buildUtasPanjangPrompt } from "@/lib/ai/prompts/utas-panjang.v1";
import { siapkanBody } from "@/lib/api/siapkan-body";

export async function POST(req: Request) {
  const hasil = await siapkanBody(req, utasPanjangRequestSkema);
  if (!hasil.ok) return hasil.respons;

  const prompt = buildUtasPanjangPrompt({
    produkNama: hasil.data.produkNama,
    fakta: hasil.data.fakta,
    panjangTarget: hasil.data.panjangTarget,
    gayaBicara: hasil.data.gayaBicara,
  });
  const { result, berhenti } = await jalankanAI<unknown>({
    jenis: "generate",
    promptVersion: PROMPT_VERSION,
    prompt,
    schema: utasPanjangSkema,
    retries: 1,
    temperature: 0.7,
  });

  if (berhenti) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 429 });
  }
  if (!result.ok || !result.data) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "AI tidak memberi jawaban valid." },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true, data: result.data });
}
