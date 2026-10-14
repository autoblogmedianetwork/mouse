/**
 * GET /api/biaya — aggregate AI cost for the cost widget (Fase 5, UI-Spec 3.9).
 *
 * Source of truth: the `generations` table for the signed-in user (RLS scopes
 * every row to its owner). Not signed in / env not configured: empty payload
 * with HTTP 200, not an error — the widget then renders its "belum ada data"
 * state instead of showing invented zeros.
 */
import { NextResponse } from "next/server";
import { klienServer, penggunaSaatIni } from "@/lib/supabase/server";
import {
  agregasiGenerations,
  batasBatasUsd,
  type BarisGenerasi,
  type StatistikBiaya,
} from "@/lib/ai/statistik";

export async function GET() {
  const supabase = await klienServer();
  const user = supabase ? await penggunaSaatIni() : null;
  const batasUsd = batasBatasUsd(process.env.AI_MONTHLY_BUDGET_USD);

  if (!supabase || !user) {
    return NextResponse.json({
      ok: true,
      adaCatatan: false,
      hariIniUsd: null,
      bulanIniUsd: null,
      batasUsd,
      persenBulan: 0,
      perFungsi: {},
      totalTokens: 0,
    });
  }

  // Month-to-date rows only; the aggregator splits today vs month.
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("generations")
    .select("jenis,status,biaya_usd,input_tokens,output_tokens,created_at")
    .gte("created_at", start.toISOString());

  if (error) {
    // Log row: the widget should degrade to the empty state, not crash.
    console.error("/api/biaya:", error.message);
    return NextResponse.json(
      { ok: false, error: "Gagal membaca log biaya." },
      { status: 500 },
    );
  }

  const stat = agregasiGenerations((data ?? []) as BarisGenerasi[], batasUsd);
  return NextResponse.json({ ok: true, ...stat satisfies StatistikBiaya });
}
