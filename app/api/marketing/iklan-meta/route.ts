/**
 * POST /api/marketing/iklan-meta — Generator iklan Meta Ads (Gelombang 6).
 *
 * Menggunakan prompt `ad-iklan-meta.v1` dan aturan bahasa bersama untuk
 * menghasilkan tiga varian iklan Meta (headline, primary text, CTA) dalam
 * gaya Pak Slem yang santai, memancing, anti-clickbait, dengan kepatuhan
 * kepada syarat Shopee Affiliate (tidak menyebut merek, pakai #publi, dll).
 *
 * Keluaran selalu berstatus draft; pengguna copy-paste manual ke Ads
 * Manager. Heaviliate tidak menautkan atau menerbitkan iklan secara otomatis.
 */
import { NextResponse } from "next/server";
import { jalankanAI } from "@/lib/ai/jalankan-ai";
import { buildAdIklanMetaPrompt, PROMPT_VERSION } from "@/lib/ai/prompts/ad-iklan-meta.v1";
import { siapkanBody } from "@/lib/api/siapkan-body";
import { z } from "zod";

const iklanMetaRequestSkema = z.object({
  produk: z.string().min(3, "Nama produk minimal 3 karakter"),
  harga: z.string().optional(),
  komisiPersen: z.number().min(0.1).max(100).default(5),
});

export async function POST(req: Request) {
  const hasil = await siapkanBody(req, iklanMetaRequestSkema);
  if (!hasil.ok) return hasil.respons;
  const parsed = hasil.data;

  const prompt = buildAdIklanMetaPrompt(parsed);

  const { result, berhenti } = await jalankanAI<{ varian: { judul: string; isi: string; cta: string }[] }>({
    jenis: "generate",
    promptVersion: PROMPT_VERSION,
    prompt,
    schema: z.object({
      varian: z.array(
        z.object({
          judul: z.string(),
          isi: z.string(),
          cta: z.string(),
        }),
      ),
    }),
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
