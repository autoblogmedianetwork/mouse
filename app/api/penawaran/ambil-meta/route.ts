/**
 * POST /api/penawaran/ambil-meta — isi form penawaran dari link produk.
 *
 * Rute ini mem-fetch URL yang dikirim klien, jadi dua pengaman wajib ada:
 *   1. Sesi. Sebelumnya rute ini terbuka, sehingga siapa pun bisa memakai
 *      server sebagai proxy untuk menjangkau jaringan internal.
 *   2. Validasi URL + redirect + batas ukuran di lib/penawaran/url-aman.ts
 *      (blokir IP privat, metadata cloud, port aneh, dan halaman raksasa).
 *
 * Kegagalan yang wajar (halaman menolak, metadata kosong) tetap dijawab
 * HTTP 200 dengan `ok: false` supaya UI menampilkan saran "isi manual",
 * bukan error jaringan.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { ekstrakMetaHTML } from "@/lib/penawaran/ekstrak-meta";
import { ambilHtmlAman } from "@/lib/penawaran/url-aman";
import { wajibSesi } from "@/lib/supabase/server";

const ambilMetaSkema = z.object({
  url: z.string().trim().refine((val) => /^https?:\/\//i.test(val), {
    message: "URL harus diawali http:// atau https://",
  }),
});

export async function POST(req: Request) {
  const sesi = await wajibSesi();
  if ("respons" in sesi) return sesi.respons;

  try {
    const body = await req.json();
    const parsed = ambilMetaSkema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "URL tidak valid." },
        { status: 400 },
      );
    }

    const hasil = await ambilHtmlAman(parsed.data.url);
    if (!hasil.ok) {
      return NextResponse.json({ ok: false, error: hasil.alasan }, { status: 200 });
    }

    const meta = ekstrakMetaHTML(hasil.html);

    if (!meta.title && !meta.description) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Metadata (title/deskripsi) tidak ditemukan di halaman ini. Silakan isi form manual di bawah.",
        },
        { status: 200 },
      );
    }

    return NextResponse.json({
      ok: true,
      data: meta,
      url_final: hasil.urlFinal,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Terjadi kesalahan saat memproses permintaan." },
      { status: 500 },
    );
  }
}
