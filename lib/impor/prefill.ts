/**
 * Quick Capture (N-8): bookmarklet yang dijalankan user di browsernya sendiri.
 *
 * Hanya membaca judul halaman, harga, dan deskripsi singkat yang terlihat di
 * layar, lalu mengirimkannya ke /posting/baru lewat parameter `prefill`.
 * Tidak ada scraping dari server, tidak ada token/cookie di URL: objek yang
 * diterima bersifat strict (kunci asing ditolak) dan URL sumber dibersihkan
 * dari query beserta hash.
 */
import { z } from "zod";
import type { ProductFormValues } from "@/lib/produk/skema";

/** Batas deskripsi yang dibawa bookmarklet (N-8). */
export const MAKS_DESKRIPSI_PREFILL = 1000;

/** Batas kolom harga di form produk (products.harga). */
export const MAKS_DIGIT_HARGA = 13;

/**
 * Bentuk longgar (maksimum teknis saja). Penyaringan panjang akhir dilakukan
 * `bersihkanPrefill`, supaya kiriman yang sedikit lebih panjang dipangkas,
 * bukan ditolak seluruhnya.
 */
export const prefillSkema = z.strictObject({
  nama: z.string().max(2000).optional(),
  harga: z.string().max(100).optional(),
  varian: z.string().max(500).optional(),
  deskripsi: z.string().max(5000).optional(),
  url: z.string().max(2000).optional(),
  sumber: z.string().max(300).optional(),
});

export type PrefillProduk = z.infer<typeof prefillSkema>;

/** Harga hanya angka; titik, koma, dan "Rp" dibuang. */
export function hanyaAngka(teks: string): string {
  return teks.replace(/[^\d]/g, "").slice(0, MAKS_DIGIT_HARGA);
}

/** URL publik tanpa query dan hash, https saja. Selain itu dikosongkan. */
export function urlTanpaPelacak(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return "";
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return "";
  }
}

/** Rapikan dan potong nilai ke batas yang disepakati. */
export function bersihkanPrefill(data: PrefillProduk): PrefillProduk {
  const nama = data.nama?.trim();
  const varian = data.varian?.trim();
  const deskripsi = data.deskripsi?.replace(/\s+/g, " ").trim();
  const sumber = data.sumber?.trim();

  return {
    nama: nama ? nama.slice(0, 200) : undefined,
    harga: data.harga ? hanyaAngka(data.harga) || undefined : undefined,
    varian: varian ? varian.slice(0, 200) : undefined,
    deskripsi: deskripsi ? deskripsi.slice(0, MAKS_DESKRIPSI_PREFILL) : undefined,
    url: data.url ? urlTanpaPelacak(data.url) || undefined : undefined,
    sumber: sumber ? sumber.slice(0, 120) : undefined,
  };
}

/** Prefill → nilai awal form produk (user tetap harus meninjau sebelum simpan). */
export function nilaiFormDariPrefill(data: PrefillProduk): Partial<ProductFormValues> {
  const nama = data.nama?.trim() ?? "";
  return {
    nama_internal: nama.slice(0, 120),
    nama: nama.slice(0, 300),
    varian: data.varian ?? "",
    harga: data.harga ?? "",
    deskripsi: data.deskripsi ?? "",
    url_referensi: data.url ?? "",
  };
}

function keBase64Url(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let biner = "";
  for (const b of bytes) biner += String.fromCharCode(b);
  return btoa(biner).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Encode prefill ke satu parameter URL: base64url dari JSON yang sudah dibersihkan. */
export function encodePrefill(data: PrefillProduk): string {
  return keBase64Url(JSON.stringify(bersihkanPrefill(data)));
}

/**
 * Decode parameter `prefill`. Menerima base64url maupun base64 biasa (btoa polos
 * dari bookmarklet lama), lalu memvalidasi dengan Zod. Nilai yang tidak dikenal
 * atau rusak menghasilkan null, bukan data setengah jadi.
 */
export function decodePrefill(kode: string | null | undefined): PrefillProduk | null {
  if (!kode) return null;
  const dasar = kode.trim().replace(/-/g, "+").replace(/_/g, "/");
  const pad = dasar.length % 4 === 0 ? dasar : dasar + "=".repeat(4 - (dasar.length % 4));

  try {
    const biner = atob(pad);
    const bytes = Uint8Array.from(biner, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const hasil = prefillSkema.safeParse(JSON.parse(json));
    return hasil.success ? bersihkanPrefill(hasil.data) : null;
  } catch {
    return null;
  }
}

/**
 * Bookmarklet siap tempel. Hanya membaca yang terlihat di layar, membuang query
 * dan hash dari URL halaman (agar parameter pelacak atau token tidak ikut), dan
 * tidak pernah menyentuh cookie, localStorage, atau form login.
 */
export function bookmarkletQuickCapture(origin: string): string {
  const dasar = origin.replace(/\/+$/, "");
  const kode = [
    "javascript:(function(){try{",
    "var t=(document.title||'').slice(0,300);",
    "var m=document.querySelector('meta[name=description]');",
    "var d=(m&&m.content)?m.content:'';",
    "if(!d)d=(document.body.innerText||'').replace(/\\s+/g,' ').trim().slice(0,1000);",
    "var h=(document.body.innerText||'').match(/Rp\\s?[\\d.,]{3,}/);",
    "var u=location.origin+location.pathname;",
    "var p={nama:t,harga:h?h[0]:'',deskripsi:d,url:u,sumber:location.hostname};",
    "var b=btoa(unescape(encodeURIComponent(JSON.stringify(p))));",
    `window.open('${dasar}/posting/baru?prefill='+b.replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,''),'_blank');`,
    "}catch(e){alert('Quick Capture gagal: '+e.message);}})();",
  ].join("");
  return kode;
}
