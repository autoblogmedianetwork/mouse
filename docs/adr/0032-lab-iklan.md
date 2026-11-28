# ADR 0032 — Lab Iklan (iklan berbayar Meta untuk afiliasi)

- **Status:** Diterima
- **Tanggal:** 2026-11-28
- **Konteks:** Ide "meta ads + Shopee Affiliate" untuk mencari traffic non-organik.

## Pertanyaan pertama: legal atau tidak?

Dibaca langsung dari Syarat dan Ketentuan Program Afiliasi Shopee untuk Individu
(help.shopee.co.id, artikel 71217) pada 28 Nov 2026:

| Pasal | Bunyi pokok | Arti |
|---|---|---|
| 6.3(n) | Dilarang memakai iklan berbayar untuk Tautan Partisipan **yang bersifat clickbait** | Iklan berbayar tidak dilarang mutlak; yang dilarang versi clickbait |
| 6.3(h) | Dilarang memakai kata kunci merek "Shopee" di search ads | Google/Bing Ads tetap terlarang; kata "Shopee" wajib jadi negative keyword |
| 6.3(q) | Dilarang iklan yang meniru identitas Shopee | Jangan pakai logo/warna/merek di kreatif |
| 2.7 | Media promosi harus terdaftar dan disetujui Shopee | Akun IG/FB yang diiklankan harus akun yang terdaftar di program |
| 3.4 | Komisi hangus untuk pesanan dari "Sumber Yang Tidak Terlacak", termasuk situs periklanan | Tracking harus bersih; risiko nyata kalau sumber pesanan tidak terbaca |
| 6.4 | Masking, pop-up, auto-redirect dilarang keras | Bio-link kita aman: tautan terlihat dan diklik sukarela |

Kesimpulan: **hijau muda — boleh, dengan pagar ketat.** Sumber sekunder Indonesia
(novamedialab) menyimpulkan "iklan berbayar = pelanggaran"; itu membaca pasal 6.3(n)
terlalu luas. Sumber Brasil atas program yang sama membaca pasal 2.3(b) sebagai
"paid social diizinkan dari akun terdaftar, search ads dilarang" — konsisten dengan
pembacaan kita.

## Keputusan

Membangun **Lab Iklan** dengan tiga alat yang semuanya berhenti di draft:

1. **Kalkulator break-even** (`lib/advertising/iklan-calculator.ts`) — komisi %, CPC,
   budget harian → penjualan dibutuhkan, klik dibutuhkan, biaya per penjualan.
2. **Generator iklan Meta** (`lib/ai/prompts/ad-iklan-meta.v1.ts` +
   `/api/marketing/iklan-meta`) — 3 varian (headline, primary text, CTA) dalam suara
   Pak Slem, memakai `ATURAN_BAHASA`, dengan pagar: tanpa nama marketplace, tanpa
   clickbait, wajib `#publi`, tanpa klaim yang tidak ada di deskripsi produk.
3. **Wizard landing page** (`/api/marketing/landing-page`) — menulis satu file HTML
   statis di `public/landing/<slug>.html` berisi judul, subjudul, deskripsi, CTA,
   tautan afiliasi, dan tanda `#publi`.

## Yang sengaja TIDAK dibuat

- **Tidak ada Meta Marketing API.** Tidak ada token iklan, tidak ada pembuatan campaign,
  tidak ada pengeluaran otomatis. Peluncuran iklan tetap manual di Ads Manager — sama
  dengan filosofi Fase 4 (posting manual).
- **Tidak ada auto-optimasi budget.** Tidak ada loop yang mematikan/menaikkan iklan.
- **Tidak ada data pembeli.** Tidak ada scraping, tidak ada pixel milik kita.

## Konsekuensi

- Semua keluaran Lab Iklan berstatus draft; pengguna menyalin manual.
- Biaya AI mengikuti pagar yang sudah ada (`jalankanAI` → batas biaya bulanan + rate limit).
- Landing page ditulis ke filesystem. Di hosting read-only (mis. Vercel) penulisan gagal
  dan UI memberi tahu pengguna untuk menyalin HTML-nya; ini batasan yang diterima.
- Kalau nanti mau otomatis, ADR baru wajib dibuat lebih dulu, karena itu menyentuh
  uang pengguna dan aturan platform.
