/**
 * GET /api/ai/kesehatan — apakah provider AI di server benar-benar bisa dipakai.
 *
 * Sesi wajib karena pemeriksaan ini memanggil provider dan membakar sedikit
 * kredit. Hasilnya hanya status (base URL, model, latensi, pesan galat); nilai
 * API key tidak pernah ikut dikirim (AGENTS aturan 11).
 */
import { NextResponse } from "next/server";
import { periksaKesehatanAI } from "@/lib/ai/kesehatan";
import { wajibSesi } from "@/lib/supabase/server";

export async function GET() {
  const sesi = await wajibSesi();
  if ("respons" in sesi) return sesi.respons;

  const hasil = await periksaKesehatanAI();

  return NextResponse.json(hasil, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
