# Keputusan Proyek: AutoThreads

Status: usulan default dari rencana. Kolom "Konfirmasi" diisi setelah kamu menyetujui.

## K1–K7 (dari Rencana bagian 4)

| No | Pertanyaan | Usulan | Konfirmasi |
|---|---|---|---|
| K1 | Preview memakai rasio asli Threads? | Ya, 4:5 untuk foto | [ ] |
| K2 | Ada tombol "Simpan sebagai template"? | Ya, menu sekunder di bilah aksi | [ ] |
| K3 | Lama arsip sebelum dihapus? | 90 hari sejak arsip_at | [ ] |
| K4 | Metode login? | Magic link email | [ ] |
| K5 | Scraping mati di MVP? | Ya, default mati | [ ] |
| K6 | Batas biaya API per bulan? | Batas keras yang bisa diubah di Pengaturan, angka awal ditentukan setelah P8 | [ ] |
| K7 | Foto produk dianalisis AI? | Ya, jika P7 lolos | [ ] |

## Prasyarat P1–P9

| No | Prasyarat | Status |
|---|---|---|
| P1 | Endpoint, format request, dan harga Gemini dicatat dari dokumentasi resmi | selesai 9 Okt 2026 (endpoint; harga masih dari aggregator) |
| P2 | Satu panggilan teks menghasilkan JSON valid | belum |
| P3 | Akun Supabase dan Vercel dibuat | belum |
| P4 | Repo Git dibuat dan terhubung ke Vercel | belum |
| P5 | Golden set 10 produk ditulis manual | belum |
| P6 | K1–K7 dijawab (dokumen ini) | belum |
| P7 | Foto produk berhasil dikirim ke Gemini dan JSON valid | belum |
| P8 | Harga dan kuota gratis Gemini (termasuk TTS) dicek | belum |
| P9 | Cadangan (MiMo atau DeepSeek) diuji dengan golden set | belum |

## Tooling

| Area | Pilihan | Alasan |
|---|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind, shadcn/ui | Sesuai rencana, cocok untuk pemula |
| Form dan validasi | React Hook Form, Zod | Skema yang sama dipakai klien dan server |
| Database, auth, storage | Supabase | RLS, storage privat, free tier |
| AI utama | Google Gemini API, gemini-2.5-flash-lite | Termurah yang menerima gambar, satu provider |
| AI cadangan | MiMo atau DeepSeek | Diuji di P9 |
| Hosting | Vercel | Gratis untuk pemakaian pribadi |
| Video | Google Flow (manual), prompt dari aplikasi | Tidak ada generate video di aplikasi |
| Test | Vitest, Playwright (E2E nanti) | Ringan dan umum dipakai |

## Keputusan terbuka tambahan

| No | Pertanyaan | Status |
|---|---|---|
| T1 | Apakah Google Flow memakai akun berbayar? | belum dijawab |
| T2 | Siapa yang menjawab K1–K7: Slamet sendiri | diasumsikan ya |
