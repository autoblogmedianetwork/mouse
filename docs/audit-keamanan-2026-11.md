# Audit Keamanan Heaviliate — November 2026

**Metode:** tinjauan statis kode dan skema (bukan penetration test), ditambah
`npm audit --omit=dev`. Tidak ada uji serangan ke production dan tidak ada
panggilan AI berbayar.

**Cakupan:** route handler `app/api/**`, `lib/supabase/server.ts`, `proxy.ts`,
`lib/ai/**`, `lib/posting/**`, `lib/penawaran/url-aman.ts`, migrasi
`supabase/migrations/**`, `next.config.ts`, dan pengelolaan rahasia.

## Ringkasan

| Tingkat | Jumlah |
|---|---|
| Tinggi | 1 |
| Sedang | 4 |
| Rendah | 4 |

Tidak ditemukan: SQL injection (query builder Supabase + parameter), XSS
`dangerouslySetInnerHTML` (tidak dipakai), service role key di kode aplikasi,
atau file `.env` yang terlacak Git. `npm audit` production: **0 kerentanan**.

## Temuan

### K-01 — Tinggi: token akses Threads disimpan tanpa enkripsi

**Bukti:** `app/api/akun/route.ts` menulis `token_terenkripsi: input.access_token`
apa adanya ke `threads_accounts`. Nama kolom menyiratkan enkripsi, tetapi tidak
ada `enkripsiApiKey()`/dekripsi di jalur ini, dan nilainya berasal dari body
klien.

**Dampak:** siapa pun yang bisa membaca tabel (backup bocor, SQL injection di
tempat lain, akses dashboard Supabase) langsung memegang token posting atas nama
akun Threads pemilik. Token long-lived Meta berlaku hingga 60 hari.

**Rekomendasi:** enkripsi dengan AES-256-GCM yang sudah ada di
`lib/ai/provider-store.ts` (kunci master terpisah, mis. `THREADS_TOKEN_SECRET`),
atau gunakan Supabase Vault. Migrasikan baris lama, lalu ubah nama kolom menjadi
`token_enc` agar tidak menyesatkan.

### K-02 — Sedang/Tinggi: SSRF lewat Base URL provider AI

**Bukti:** `app/api/ai-provider/route.ts` hanya memvalidasi
`z.string().url()`. URL itu lalu dipakai server untuk `fetch` di
`lib/ai/generate-json.ts`, `/api/ai-provider/test`, dan `lib/ai/kesehatan.ts`.
Skema mengizinkan `http://`, port bebas, `localhost`, dan IP privat; `fetch`
mengikuti redirect secara default.

**Dampak:** sesi yang sah (atau sesi yang dicuri) dapat menyuruh server membuka
`http://169.254.169.254/`, layanan internal, atau host lokal, lalu membaca
petunjuk dari pesan error/latensi. Kunci API provider ikut dikirim ke host yang
dituju.

**Rekomendasi:** pakai ulang `lib/penawaran/url-aman.ts` (`urlAmanTanpaDns` +
resolve DNS + redirect manual) sebelum menyimpan provider dan sebelum setiap
fetch; wajibkan `https://` (kecuali mode pengembangan lokal yang eksplisit).

### K-03 — Sedang: rate limit AI tidak terdistribusi

**Bukti:** `lib/rate-limit.ts` menyimpan hitungan di memori proses dan dipakai
`lib/ai/jalankan-ai.ts` (30 permintaan/menit per user/anonymous).

**Dampak:** di Vercel setiap instance punya hitungan sendiri, jadi batas efektif
bisa berkali-kali lipat. Batas biaya bulanan tetap dijaga di database, sehingga
risiko finansial tidak sebesar risiko penyalahgunaan kuota/antrean.

**Rekomendasi:** pindahkan hitungan ke Postgres (tabel + `upsert` atomik) atau
Redis/Upstash. Pertahankan rate limit lokal sebagai lapisan pertama.

### K-04 — Sedang: header keamanan HTTP belum diatur

**Bukti:** `next.config.ts` tidak memakai `headers()`.

**Dampak:** tidak ada CSP, HSTS, `X-Frame-Options`/`frame-ancestors`,
`Referrer-Policy`, atau `Permissions-Policy`. Klikjacking dan sebagian serangan
XSS berbasis injeksi tidak punya lapisan pertahanan kedua.

**Rekomendasi:** tambahkan header untuk semua route: `Content-Security-Policy`
(mulai dari `default-src 'self'`, sesuaikan Supabase dan font),
`Strict-Transport-Security`, `X-Frame-Options: DENY`,
`Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy: camera=(), microphone=(), geolocation=()`.

### K-05 — Sedang: pesan error upstream diteruskan ke klien

**Bukti:** `/api/ai-provider/test` mengembalikan `body.error?.message` atau
`err.message`; `periksaKesehatanAI` mengembalikan pesan provider; route AI
mengembalikan `result.error` apa adanya.

**Dampak:** bisa membocorkan hostname internal, kuota, nama model, atau detail
kontrak provider. Tidak membocorkan nilai kunci, tetapi membantu pemetaan.

**Rekomendasi:** petakan error ke kategori (`timeout`, `auth`, `rate_limit`,
`upstream`) dan simpan detail mentah hanya di log server.

### K-06 — Rendah/Sedang: tidak ada pemeriksaan Origin pada mutasi

**Bukti:** POST/DELETE (`/api/ai-provider`, `/api/akun`, `/api/konten`,
`/api/posting/kirim`) tidak memeriksa `Origin`/`Sec-Fetch-Site`.

**Dampak:** cookie Supabase SSR umumnya `SameSite=Lax`, sehingga POST lintas
situs tidak membawa sesi. Risiko nyata rendah, tetapi pemeriksaan Origin adalah
pertahanan berlapis yang murah.

**Rekomendasi:** helper `isSameOrigin(req)` untuk semua mutasi dan jawab 403
bila Origin ada dan tidak cocok.

### K-07 — Rendah: `/api/akun` tidak mewajibkan sesi

**Bukti:** GET/POST/DELETE memakai `klienServer()` + `penggunaSaatIni()` dan
tetap menjawab `ok: true` dengan id `local-...` saat belum masuk.

**Dampak:** tidak ada penulisan database tanpa sesi, tetapi UI bisa
menampilkan "akun terhubung" padahal hanya lokal, dan token yang ditempel
diterima tanpa validasi pemilik.

**Rekomendasi:** wajibkan sesi untuk POST/DELETE (GET boleh tetap ramah untuk
onboarding), dan tandai jelas mode lokal di UI.

### K-08 — Rendah: pesan error database dikirim ke klien

**Bukti:** `/api/konten` dan `/api/akun` mengembalikan `error.message` Supabase.

**Dampak:** bisa mengungkap nama kolom/constraint. Tidak kritis untuk aplikasi
satu pengguna, tetapi tidak perlu.

**Rekomendasi:** pesan generik + kode korelasi; detail di log server.

### K-09 — Rendah: rotasi kunci master provider AI

**Bukti:** `AI_PROVIDER_SECRET` dipakai langsung untuk dekripsi; tidak ada jalur
re-enkripsi.

**Dampak:** mengganti kunci membuat semua provider tersimpan gagal didekripsi
dan dilewati, lalu panggilan jatuh ke env (perilaku fallback yang baru). Tidak
ada kehilangan data, tetapi operasi rotasi harus manual.

**Rekomendasi:** dokumentasikan prosedur rotasi (dekripsi dengan kunci lama,
enkripsi ulang dengan kunci baru) dan sediakan skrip CLI server-only.

## Yang sudah baik

- **RLS aktif di semua tabel** (`0001_init.sql`, `0014_ai_provider.sql`) dengan
  policy `auth.uid() = user_id`; bucket `product-media` privat, dibatasi 5 MB,
  MIME gambar, dan folder per user.
- **Service role tidak dipakai kode aplikasi**; hanya skrip lokal `scripts/` dan
  tes RLS. `lib/supabase/server.ts` memakai anon key + cookie sesi.
- **Kunci provider AI terenkripsi** AES-256-GCM dengan IV acak 12 byte; nilai
  tidak pernah dikembalikan ke klien (hanya status ada/tidak).
- **Route berbiaya wajib sesi**: semua route AI, posting, dan ambil-meta memakai
  `wajibSesi()`; budget AI dijaga di database.
- **SSRF di `/api/penawaran/ambil-meta` sudah ditutup** dengan validasi protokol,
  port, DNS, IP privat, redirect manual, batas ukuran, dan timeout.
- **Tidak ada `dangerouslySetInnerHTML`**; React meng-escape seluruh teks konten.
- **Prompt output divalidasi Zod** dan semua hasil AI berstatus draft.
- **`.env*` di-.gitignore** dan tidak ada file env/rahasia yang terlacak.

## Prioritas perbaikan

1. Enkripsi token Threads (K-01) — sebelum memakai auto-posting nyata.
2. Validasi Base URL provider dengan pengaman SSRF (K-02).
3. Header keamanan di `next.config.ts` (K-04).
4. Sanitasi pesan error (K-05, K-08).
5. Rate limit terdistribusi (K-03).
6. Pemeriksaan Origin pada mutasi (K-06).

## Batasan audit

- Tidak ada uji penetrasi, fuzzing, atau pengujian beban.
- Tidak memeriksa konfigurasi Supabase/Vercel di luar repositori (kebijakan
  password, MFA, akses dashboard, log retensi).
- Tidak memeriksa keamanan rantai pasok selain `npm audit` production.
