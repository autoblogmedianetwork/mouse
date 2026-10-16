import { describe, expect, it } from "vitest";
import { ekstrakMetaHTML } from "./ekstrak-meta";

describe("ekstrakMetaHTML", () => {
  it("mengekstrak og:title, og:description, dan og:image jika tersedia", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="og:title" content="Hostinger Web Hosting & Cloud" />
          <meta property="og:description" content="Hosting cepat dengan diskon hingga 75% dan domain gratis." />
          <meta property="og:image" content="https://hostinger.com/og-banner.png" />
        </head>
        <body><h1>Halo</h1></body>
      </html>
    `;
    const hasil = ekstrakMetaHTML(html);
    expect(hasil.title).toBe("Hostinger Web Hosting & Cloud");
    expect(hasil.description).toBe("Hosting cepat dengan diskon hingga 75% dan domain gratis.");
    expect(hasil.image).toBe("https://hostinger.com/og-banner.png");
  });

  it("fallback ke <title> dan meta name='description' jika OG tidak ada", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Kursus Digital Marketing Terbaik</title>
          <meta name="description" content="Pelajari SEO, SEM, dan Affiliate dari nol." />
        </head>
        <body>Konten</body>
      </html>
    `;
    const hasil = ekstrakMetaHTML(html);
    expect(hasil.title).toBe("Kursus Digital Marketing Terbaik");
    expect(hasil.description).toBe("Pelajari SEO, SEM, dan Affiliate dari nol.");
    expect(hasil.image).toBeUndefined();
  });

  it("meng-unescape entitas HTML dasar", () => {
    const html = `
      <html>
        <head>
          <title>Tools &amp; SaaS &quot;Super&quot; 2026</title>
        </head>
      </html>
    `;
    const hasil = ekstrakMetaHTML(html);
    expect(hasil.title).toBe('Tools & SaaS "Super" 2026');
  });

  it("menangani HTML kosong atau rusak dengan aman", () => {
    expect(ekstrakMetaHTML("")).toEqual({ title: "", description: "" });
    expect(ekstrakMetaHTML("<div>tanpa head</div>")).toEqual({ title: "", description: "" });
  });
});
