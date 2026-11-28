/**
 * POST /api/marketing/landing-page — Wizard Landing Page (Gelombang 6).
 *
 * Membuat satu halaman landing statis dari data yang diisi pengguna. Halaman
 * dituliskan sebagai file HTML ke folder `public/landing` sehingga bisa dihosting
 * bersamaan dengan Next.js (next-static atau Vercel). Metadata disimpan di
 * tabel `landing_pages` untuk referensi internal.
 *
 * Keluaran: slug URL dan status berhasil/gagal. Pengguna salin link secara manual
 * ke Meta Ads Manager atau tool lain. Heaviliate tidak otomatis menerbitkan iklan.
 */
import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { klienServer } from "@/lib/supabase/server";
import { siapkanBody } from "@/lib/api/siapkan-body";
import { z } from "zod";

const landingRequestSkema = z.object({
  slug: z.string().min(2).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: "Slug hanya huruf kecil, angka, dan tanda hubung.",
  }),
  hero: z.string().url().optional().or(z.literal("")),
  judul: z.string().min(1),
  subjudul: z.string(),
  cta: z.string(),
  deskripsi: z.string(),
  tautan: z.string().url().optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const hasil = await siapkanBody(req, landingRequestSkema);
  if (!hasil.ok) return hasil.respons;
  const parsed = hasil.data;

  // --- Tulis file statis ---------------------------
  const html = buatkanLandingHTML(parsed);
  const dir = path.join(process.cwd(), "public", "landing");
  const target = path.join(dir, `${parsed.slug}.html`);
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(target, html, "utf-8");
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: `Gagal menulis file: ${String(err)}` },
      { status: 500 },
    );
  }

  // --- Simpan metadata ke Supabase ------------------
  const supabase = await klienServer();
  if (supabase) {
    try {
      await supabase.from("landing_pages").insert({
        slug: parsed.slug,
        judul: parsed.judul,
        subjudul: parsed.subjudul,
        cta: parsed.cta,
        deskripsi: parsed.deskripsi,
        hero_url: parsed.hero || null,
      });
    } catch {
      /* non-fatal: file sudah ditulis, metadata bisa diisi ulang */
    }
  }

  return NextResponse.json({
    ok: true,
    data: { success: true, url: `/landing/${parsed.slug}` },
  });
}

/* ------------------------------------------------------------------- */

function buatkanLandingHTML(d: z.infer<typeof landingRequestSkema>): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(d.judul)}</title>
  <meta name="description" content="${esc(d.subjudul)}" />
  <style>
    :root { --bg: #fafafa; --fg: #1e1e1e; --accent: #e11d48; }
    body { font-family: system-ui, sans-serif; margin: 0; background: var(--bg); color: var(--fg); }
    .container { max-width: 720px; margin: 0 auto; padding: 2rem 1rem; }
    .hero { aspect-ratio: 16/9; background: #ddd; border-radius: 12px; margin-bottom: 1.5rem; object-fit: cover; width: 100%; }
    h1 { font-size: 1.75rem; margin: 0 0 0.5rem; }
    .sub { color: #555; margin-bottom: 1rem; }
    p.desc { line-height: 1.7; white-space: pre-wrap; }
    .cta-btn { display: inline-block; background: var(--accent); color: #fff; padding: 0.85rem 1.75rem; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 1rem; }
    .cta-btn:hover { filter: brightness(1.1); }
    .disc { font-size: 0.75rem; color: #888; margin-top: 1.5rem; }
  </style>
</head>
<body>
  <div class="container">
    ${d.hero ? `<img class="hero" src="${esc(d.hero)}" alt="${esc(d.judul)}" />` : '<div class="hero" style="background:#eee;display:flex;align-items:center;justify-content:center;">Gambar produk</div>'}
    <h1>${esc(d.judul)}</h1>
    <p class="sub">${esc(d.subjudul)}</p>
    <p class="desc">${esc(d.deskripsi)}</p>
    <a class="cta-btn" href="${esc(d.tautan || "#")}" target="_blank" rel="noopener noreferrer">${esc(d.cta)}</a>
    <p class="disc">#publi — konten ini adalah materi promosi berbayar.</p>
  </div>
</body>
</html>`;
}
