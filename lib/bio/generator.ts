/**
 * Generator halaman bio-link (riset 17 Nov, referensi opentree/opentwig).
 *
 * Bio Threads hanya muat satu link — halaman ini memuat semuanya: daftar
 * produk dari Katalog dengan link dan harga. Satu berkas HTML mandiri
 * (CSS inline, tanpa JS, tanpa font eksternal) yang bisa diunggah ke
 * hosting statis mana pun atau dibagikan langsung.
 *
 * Aplikasi hanya mengekspor berkas; meng-hosting adalah tindakan user
 * (selaras Fase 4 — tidak ada yang dikirim otomatis).
 */

export const MAKS_LINK_BIO = 20;

export type ProdukBio = {
  nama: string;
  harga?: string;
  url?: string;
};

export type MasukanBio = {
  nama: string;
  tagline?: string;
  produk: ProdukBio[];
};

export type HasilBio = { ok: true; html: string; jumlahLink: number } | { ok: false; galat: string };

/** Escape HTML — semua teks user harus lolos sini sebelum masuk templat. */
export function escapeHtml(teks: string): string {
  return teks
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function urlAman(url: string): string | null {
  const bersih = url.trim();
  return /^https?:\/\/\S+$/.test(bersih) ? bersih : null;
}

/**
 * Susun halaman bio mandiri. Produk tanpa URL valid dilewati (bio tanpa
 * tautan tidak berguna); nama wajib; maksimal 20 link agar halaman tetap
 * sekali gulung di HP.
 */
export function susunHalamanBio(masukan: MasukanBio): HasilBio {
  const nama = masukan.nama.trim();
  if (!nama) return { ok: false, galat: "Isi nama dulu (nama persona atau nama akun)." };

  const link = masukan.produk
    .map((p) => ({ ...p, url: p.url ? urlAman(p.url) : null }))
    .filter((p): p is ProdukBio & { url: string } => Boolean(p.url) && p.nama.trim().length > 0)
    .slice(0, MAKS_LINK_BIO);

  if (link.length === 0) {
    return {
      ok: false,
      galat: "Tidak ada produk dengan URL valid. Isi link produk di Katalog dulu.",
    };
  }

  const tagline = masukan.tagline?.trim() ?? "";
  const itemHtml = link
    .map((p) => {
      const harga = p.harga?.trim()
        ? `<span class="harga">${escapeHtml(p.harga.trim())}</span>`
        : "";
      return `    <a class="kartu" href="${escapeHtml(p.url)}" rel="nofollow sponsored" target="_blank">
      <span class="nama">${escapeHtml(p.nama.trim())}</span>
      ${harga}
    </a>`;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(nama)} — Link</title>
<meta name="description" content="${escapeHtml(tagline || `Link produk rekomendasi dari ${nama}`)}">
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; margin: 0; }
  body {
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    background: #fafaf9; color: #1c1917;
    max-width: 34rem; margin: 0 auto; padding: 2.5rem 1.25rem 4rem;
  }
  h1 { font-size: 1.6rem; letter-spacing: -0.02em; }
  .tagline { margin-top: .4rem; color: #57534e; font-size: .95rem; }
  .kartu {
    display: flex; justify-content: space-between; align-items: baseline; gap: .75rem;
    border: 2px solid #1c1917; background: #fff; margin-top: .75rem;
    padding: .9rem 1rem; text-decoration: none; color: inherit; font-weight: 600;
  }
  .kartu:hover { background: #f5f5f4; }
  .harga { font-variant-numeric: tabular-nums; color: #c2410c; font-size: .9rem; white-space: nowrap; }
  .kaki { margin-top: 2rem; font-size: .8rem; color: #78716c; }
  @media (prefers-color-scheme: dark) {
    body { background: #1c1917; color: #fafaf9; }
    .kartu { background: #292524; border-color: #fafaf9; }
    .kartu:hover { background: #44403c; }
    .tagline, .kaki { color: #a8a29e; }
  }
</style>
</head>
<body>
  <h1>${escapeHtml(nama)}</h1>
  ${tagline ? `<p class="tagline">${escapeHtml(tagline)}</p>` : ""}
  <nav aria-label="Daftar produk">
${itemHtml}
  </nav>
  <p class="kaki">Beberapa tautan adalah tautan affiliate — komisi bisa saya terima tanpa menambah harga untuk kamu.</p>
</body>
</html>
`;

  return { ok: true, html, jumlahLink: link.length };
}
