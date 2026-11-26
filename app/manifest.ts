import type { MetadataRoute } from "next";

/**
 * Manifest PWA (riset 17 Nov, bank ide) — Heaviliate bisa di-install ke
 * layar utama HP: fullscreen tanpa address bar, terasa seperti aplikasi.
 * Ikon digambar programatik dengan gaya logo "H" oranye aplikasi.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Heaviliate — Dashboard Konten Affiliate",
    short_name: "Heaviliate",
    description:
      "Dashboard pribadi untuk membuat konten Threads dari produk affiliate Shopee.",
    start_url: "/",
    display: "standalone",
    background_color: "#1c1917",
    theme_color: "#1c1917",
    lang: "id",
    icons: [
      { src: "/ikon/pwa-192.png", sizes: "192x192", type: "image/png" },
      { src: "/ikon/pwa-512.png", sizes: "512x512", type: "image/png" },
      { src: "/ikon/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
