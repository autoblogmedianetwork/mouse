import { NextResponse } from "next/server";
import { wajibSesi } from "@/lib/supabase/server";
import { aktifkanProvider } from "@/lib/ai/provider-store";

export async function POST(req: Request) {
  const sesi = await wajibSesi();
  if ("respons" in sesi) return sesi.respons;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body bukan JSON valid." }, { status: 400 });
  }
  const id = (body as { id?: string }).id;
  if (!id) return NextResponse.json({ ok: false, error: "id wajib." }, { status: 400 });
  const hasil = await aktifkanProvider(id);
  return NextResponse.json(hasil, { status: hasil.ok ? 200 : 400 });
}
