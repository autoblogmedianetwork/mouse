/**
 * Server-side glue for the cost dashboard (Fase 5): pricing, logging into the
 * `generations` table, and the K6 monthly-budget stop.
 *
 * Server-only: this module reads env prices and talks to Supabase with the
 * user's own cookie-bound client, so RLS scopes every insert to its owner
 * (AGENTS rules 8 and 11). Never import from client components.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { UsageAI } from "./generate-json";
import {
  agregasiGenerations,
  batasBatasUsd,
  type BarisGenerasi,
  type StatistikBiaya,
} from "./statistik";

/* --------------------------------- pricing -------------------------------- */

/** USD per 1 million tokens. Unset env means free (current model) -> $0. */
export function parseTarifPerMtok(raw?: string): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Cost in USD from token usage. Returns null when neither tariff is set, so
 * callers can record `biaya_usd = null` instead of inventing a fake $0.00.
 * Partial tariffs still compute (missing side counts as 0).
 */
export function hitungBiayaUsd(
  usage: UsageAI | undefined,
  tarifIn?: string,
  tarifOut?: string,
): number | null {
  if (!usage) return null;
  const inRate = parseTarifPerMtok(tarifIn);
  const outRate = parseTarifPerMtok(tarifOut);
  if (inRate === 0 && outRate === 0) return null;
  const usd =
    ((usage.promptTokens ?? 0) * inRate) / 1_000_000 +
    ((usage.completionTokens ?? 0) * outRate) / 1_000_000;
  return usd;
}

/* -------------------------------- logging --------------------------------- */

export interface CatatanGenerasi {
  jenis: "analisis" | "ide" | "generate" | "storyboard" | "foto_ke_video" | "naskah_video";
  status: "done" | "failed" | "pending";
  attempts: number;
  promptVersion: string;
  /** Model self-reported by the caller (result.model) beats the env fallback. */
  model?: string;
  ukurans?: UsageAI;
  biayaUsd?: number | null;
  error?: string | null;
}

/**
 * Best-effort one-row log per AI call. Never throws: a broken log must not
 * kill the user's actual AI result, but the failure is surfaced to the
 * terminal/process logs so it is not silently swallowed.
 */
export async function catatGenerasi(
  supabase: SupabaseClient,
  userId: string,
  { jenis, status, attempts, promptVersion, model, ukurans, biayaUsd, error }: CatatanGenerasi,
): Promise<boolean> {
  const modelJalan = model?.trim() || process.env.AI_MODEL?.trim() || undefined;
  try {
    const { error: dbError } = await supabase.from("generations").insert({
      user_id: userId,
      ...(modelJalan ? { model: modelJalan } : {}),
      jenis,
      status,
      attempts,
      prompt_version: promptVersion,
      input_tokens: ukurans?.promptTokens ?? null,
      output_tokens: ukurans?.completionTokens ?? null,
      biaya_usd: biayaUsd === undefined ? null : biayaUsd,
      error: error ? error.slice(0, 500) : null,
    });
    if (dbError) throw dbError;
    return true;
  } catch (e) {
    console.error("catatGenerasi gagal:", e instanceof Error ? e.message : String(e));
    return false;
  }
}

/* ------------------------------- budget check ------------------------------ */

export interface KeadaanAnggaran {
  terpakai: number | null;
  batas: number;
  boleh: boolean;
  statistik: StatistikBiaya | null;
}

/** Month-built generation rows for the current user (RLS does the scoping). */
async function barisBulanIni(supabase: SupabaseClient): Promise<BarisGenerasi[]> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from("generations")
    .select("jenis,status,biaya_usd,input_tokens,output_tokens,created_at")
    .gte("created_at", start.toISOString());
  if (error) return [];
  return (data ?? []) as BarisGenerasi[];
}

/**
 * K6 enforcement: true while this month's spend is below the budget.
 * `AI_MONTHLY_BUDGET_USD` holds the limit (K6, default from BATAS_BIAYA_USD_BAWAAN).
 */
export async function keadaanAnggaran(supabase: SupabaseClient): Promise<KeadaanAnggaran> {
  const batas = batasBatasUsd(process.env.AI_MONTHLY_BUDGET_USD);
  const rows = await barisBulanIni(supabase);
  if (rows.length === 0) return { terpakai: null, batas, boleh: true, statistik: null };
  const stat = agregasiGenerations(rows, batas);
  const terpakai = stat.bulanIniUsd ?? 0;
  return { terpakai, batas, boleh: terpakai < batas, statistik: stat };
}
