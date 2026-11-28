"use client";

/**
 * Pendaftar service worker (pengembangan PWA). Hanya di production —
 * di development cache SW bisa menyembunyikan perubahan kode dan bikin
 * debugging tersesat. Pendaftaran gagal = aplikasi tetap jalan normal.
 */
import { useEffect } from "react";

export function PendaftarServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const daftar = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Diam: tanpa SW aplikasi tetap berfungsi penuh via jaringan.
      });
    };
    if (document.readyState === "complete") {
      daftar();
      return;
    }
    window.addEventListener("load", daftar, { once: true });
    return () => window.removeEventListener("load", daftar);
  }, []);
  return null;
}
