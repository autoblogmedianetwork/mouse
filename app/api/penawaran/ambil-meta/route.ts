import { NextResponse } from "next/server";
import { z } from "zod";
import { ekstrakMetaHTML } from "@/lib/penawaran/ekstrak-meta";

const ambilMetaSkema = z.object({
  url: z.string().trim().refine((val) => /^https?:\/\//i.test(val), {
    message: "URL harus diawali http:// atau https://",
  }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ambilMetaSkema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "URL tidak valid." },
        { status: 400 },
      );
    }

    const { url } = parsed.data;

    // Fetch dengan timeout 8 detik dan User-Agent wajar
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    let html = "";
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (!res.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: `Halaman mengembalikan status HTTP ${res.status}. Silakan isi data penawaran secara manual.`,
          },
          { status: 200 },
        );
      }

      html = await res.text();
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "Gagal menjangkau halaman (timeout atau proteksi akses). Silakan isi data secara manual.",
        },
        { status: 200 },
      );
    } finally {
      clearTimeout(timeoutId);
    }

    const meta = ekstrakMetaHTML(html);

    if (!meta.title && !meta.description) {
      return NextResponse.json(
        {
          ok: false,
          error: "Metadata (title/deskripsi) tidak ditemukan di halaman ini. Silakan isi form manual di bawah.",
        },
        { status: 200 },
      );
    }

    return NextResponse.json({
      ok: true,
      data: meta,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Terjadi kesalahan saat memproses permintaan." },
      { status: 500 },
    );
  }
}
