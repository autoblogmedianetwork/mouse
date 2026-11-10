/**
 * GET/POST/DELETE /api/ai-provider — kelola provider AI per user (Gelombang 3, opsi B).
 * API key terenkripsi di server; tidak pernah dikembalikan terang.
 */
import { NextResponse } from "next/server";
import { wajibSesi } from "@/lib/supabase/server";
import {
  daftarProvider,
  tambahProvider,
  hapusProvider,
} from "@/lib/ai/provider-store";

export async function GET() {
  const sesi = await wajibSesi();
  if ("respons" in sesi) return sesi.respons;
  const list = await daftarProvider();
  return NextResponse.json({ ok: true, providers: list });
}

export async function POST(req: Request) {
  const sesi = await wajibSesi();
  if ("respons" in sesi) return sesi.respons;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body bukan JSON valid." }, { status: 400 });
  }
  const b = body as { nama?: string; baseUrl?: string; model?: string; apiKey?: string };
  if (!b.nama || !b.baseUrl || !b.model || !b.apiKey) {
    return NextResponse.json({ ok: false, error: "nama, baseUrl, model, apiKey wajib diisi." }, { status: 400 });
  }
  const hasil = await tambahProvider({
    nama: b.nama,
    baseUrl: b.baseUrl,
    model: b.model,
    apiKey: b.apiKey,
  });
  return NextResponse.json(hasil, { status: hasil.ok ? 200 : 400 });
}

export async function DELETE(req: Request) {
  const sesi = await wajibSesi();
  if ("respons" in sesi) return sesi.respons;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "id wajib." }, { status: 400 });
  const hasil = await hapusProvider(id);
  return NextResponse.json(hasil, { status: hasil.ok ? 200 : 400 });
}
