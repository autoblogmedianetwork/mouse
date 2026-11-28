import { describe, expect, it } from "vitest";

/* ---------------------------------------------------------------------- */
/* Helper fungsi yang digunakan oleh route /api/marketing/landing-page  */
/* Dipisah supaya bisa diuji tanpa memuat Next.js atau filesystem.       */
/* ---------------------------------------------------------------------- */

/**
 * Buatkan HTML statis dari data landing page — duplikat logika dari route
 * agar bisa diuji dengan vitest (tanpa dependency tambahan).
 */
function buatkanLandingHTML(d: {
  slug: string;
  judul: string;
  subjudul: string;
  cta: string;
  deskripsi: string;
  hero?: string;
}): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const heroTag = d.hero
    ? `<img class="hero" src="${esc(d.hero)}" alt="${esc(d.judul)}" />`
    : "<!-- no hero -->";

  return `<!DOCTYPE html>
<html lang="id">
<head><title>${esc(d.judul)}</title></head>
<body>
  <div class="container">
    ${heroTag}
    <h1>${esc(d.judul)}</h1>
    <p class="sub">${esc(d.subjudul)}</p>
    <p>${esc(d.deskripsi)}</p>
    <a href="#" id="affiliate-link">${esc(d.cta)}</a>
    <p class="disc">#publi</p>
  </div>
</body>
</html>`;
}

describe("buatkanLandingHTML", () => {
  it("menyamak-kan karakter HTML berbahaya", () => {
    const html = buatkanLandingHTML({
      slug: "tumbler-abc",
      judul: "<script>alert('xss')</script>",
      subjudul: "",
      cta: "Beli Sekarang",
      deskripsi: "",
    });
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("menghasilkan struktur dasar halaman landing", () => {
    const html = buatkanLandingHTML({
      slug: "test",
      judul: "Produk Bagus",
      subjudul: "Deskripsi singkat",
      cta: "Cek Produknya",
      deskripsi: "Ceritanya panjang.",
    });
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>Produk Bagus</title>");
    expect(html).toContain("<h1>Produk Bagus</h1>");
    expect(html).toContain("#publi");
  });

  it("tidak mengesampingkan link affiliate saat hero ada", () => {
    const html = buatkanLandingHTML({
      slug: "produk-x",
      judul: "Test",
      subjudul: "",
      cta: "Klik Disini",
      deskripsi: "",
      hero: "https://contoh.com/foto.jpg",
    });
    expect(html).toContain("foto.jpg");
    expect(html).toContain("id=\"affiliate-link\"");
  });
});
