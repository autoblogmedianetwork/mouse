import { NextResponse } from "next/server";
import { wajibSesi } from "@/lib/supabase/server";
import { dekripsiApiKey, validasiBaseUrl } from "@/lib/ai/provider-store";

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

  // Ambil raw row terenkripsi langsung
  const { klienServer, penggunaSaatIni } = await import("@/lib/supabase/server");
  const supabase = await klienServer();
  const user = supabase ? await penggunaSaatIni() : null;
  if (!supabase || !user) return NextResponse.json({ ok: false, error: "Sesi tidak ditemukan." }, { status: 401 });

  const { data, error } = await supabase
    .from("ai_provider")
    .select("id,base_url,model,api_key_enc")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) return NextResponse.json({ ok: false, error: "Provider tidak ditemukan." }, { status: 404 });

  const baseUrlBersih = validasiBaseUrl(String(data.base_url));
  if (!baseUrlBersih) {
    return NextResponse.json({ ok: false, error: "Base URL provider tidak diizinkan." }, { status: 400 });
  }

  let apiKey: string;
  try {
    apiKey = dekripsiApiKey(data.api_key_enc);
  } catch {
    return NextResponse.json({ ok: false, error: "Gagal dekripsi kunci." }, { status: 500 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${baseUrlBersih}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: data.model,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 8,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      return NextResponse.json({ ok: false, error: body.error?.message ?? `HTTP ${res.status}` }, { status: 200 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    clearTimeout(timer);
    // Pesan generik: detail jaringan internal tidak boleh bocor ke klien.
    return NextResponse.json({ ok: false, error: "Gagal menghubungi provider. Periksa Base URL dan koneksi." }, { status: 200 });
  }
}
