/**
 * Common pipeline for the three AI routes (analisis, ide, generate):
 *
 *   1. K6 budget check for the logged-in user (return 429 when the
 *      month-to-date spend has reached AI_MONTHLY_BUDGET_USD).
 *   2. generateJSON call (server-only key, AGENTS rule 11).
 *   3. One `generations` row per call — done or failed — with token usage and
 *      the computed USD cost (Fase 5, PRD F10). Best-effort: logging never
 *      alters the AI response.
 *
 * Signed-out requests keep working but are not logged or gated: `generations`
 * rows are owner-scoped by RLS, so there is no owner to attribute them to.
 */
import { klienServer, penggunaSaatIni } from "@/lib/supabase/server";
import { generateJSON, type GenerateJSONOptions, type GenerateJSONResult, type UsageAI } from "./generate-json";
import {
  catatGenerasi,
  hitungBiayaUsd,
  keadaanAnggaran,
  type KeadaanAnggaran,
} from "./catat-generation";

export interface JalankanAIArgs extends GenerateJSONOptions {
  jenis: "analisis" | "ide" | "generate";
  promptVersion: string;
  prompt: string;
  schema: import("zod").ZodTypeAny;
}

export interface JalankanAIResult<T> {
  result: GenerateJSONResult<T>;
  /** True when the monthly budget is exhausted — routes answer 429. */
  berhenti?: { terpakai: number; batas: number };
}

export async function jalankanAI<T>(
  args: JalankanAIArgs,
): Promise<JalankanAIResult<T>> {
  const supabase = await klienServer();
  const user = supabase ? await penggunaSaatIni() : null;

  let anggaran: KeadaanAnggaran | null = null;
  if (supabase && user) {
    anggaran = await keadaanAnggaran(supabase).catch(() => null);
    if (anggaran && !anggaran.boleh && anggaran.statistik !== null) {
      return {
        berhenti: {
          terpakai: anggaran.terpakai ?? 0,
          batas: anggaran.batas,
        },
        result: {
          ok: false,
          error: `Batas biaya bulanan tercapai ($${(anggaran.terpakai ?? 0).toFixed(2)} dari $${anggaran.batas.toFixed(2)}). Panggilan AI berhenti sampai bulan depan; data tetap bisa diedit.`,
          attempts: 0,
        },
      };
    }
  }

  const result = await generateJSON<T>(args.prompt, args.schema, {
    retries: args.retries,
    timeoutMs: args.timeoutMs,
    temperature: args.temperature,
    model: args.model,
  });

  if (supabase && user) {
    const usage: UsageAI | undefined = result.usage;
    const biaya = hitungBiayaUsd(
      usage,
      process.env.AI_PRICE_IN_PER_MTOK,
      process.env.AI_PRICE_OUT_PER_MTOK,
    );
    await catatGenerasi(supabase, user.id, {
      jenis: args.jenis,
      status: result.ok ? "done" : "failed",
      attempts: result.attempts,
      promptVersion: args.promptVersion,
      model: result.model,
      ukurans: usage,
      biayaUsd: biaya,
      error: result.error ?? null,
    });
  }

  return { result };
}
