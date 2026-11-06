# Audit Teknis Heaviliate — FASE 1 (Read-Only)

**Tanggal audit:** 31 Oktober 2026
**Repository:** `https://github.com/autoblogmedianetwork/mouse` (remote `origin`, branch `main`)
**Commit yang diaudit:** `1e76674` — `feat(carousel): preset Gaya Slide per akun`
**Deployment yang diperiksa:** `https://mouse-vert.vercel.app`
**Sifat pekerjaan:** read-only. Tidak ada perubahan kode, SQL, konfigurasi Supabase, atau Vercel.
**File yang dibuat:** `docs/AUDIT-REPORT.md` (laporan ini).

> Konvensi laporan: **[TERVERIFIKASI]** = dibuktikan langsung dari file, perintah, atau respons HTTP.
> **[DUGAAN]** = kesimpulan wajar yang belum bisa dibuktikan karena akses terbatas.
> **[BELUM DIPERIKSA]** = butuh akses yang tidak tersedia pada sesi ini.

---

## 1. Executive Summary

1. **Repository sehat secara build.** Typecheck, ESLint, 495 unit test, dan `next build` semuanya lulus (exit 0). Tidak ada perubahan tracked di working tree; hanya ada tiga file untracked lama (`-w`, `.vscode/launch.json`, `.vscode/tasks.json`) yang bukan berasal dari audit ini.
2. **Produksi hidup, tetapi database-nya tidak dapat dijangkau.** Host Supabase yang di-inline ke bundle produksi mengembalikan **NXDOMAIN** dari Google DNS dan Cloudflare DNS. Artinya project Supabase yang dipakai deployment saat ini sudah tidak ada di DNS — paling mungkin dihapus, atau di-pause dengan DNS dicabut. Login magic link dan seluruh fitur berbasis database tidak mungkin bekerja sampai project itu dipulihkan/diganti dan environment Vercel diperbarui.
3. **Aplikasi saat ini berjalan sebagai aplikasi localStorage.** Hanya **6 tabel** yang benar-benar disentuh kode (`contents`, `threads_statuses`, `generations`, `threads_accounts`, `posts`, `carousel_gaya_preset`). Tabel `products`, `product_media`, `affiliate_links`, `templates`, `settings`, `offers`, `performa_*`, `carousel_slides`, `content_variants`, dan tabel ide **belum punya jalur baca/tulis di aplikasi**. Ini konsisten dengan laporan bahwa database "kosong dari data produk dan konten".
4. **Ada dua temuan keamanan tingkat Critical/High yang tidak berkaitan dengan Supabase:**
   - `next@16.4.0` masuk rentang advisory **critical** (RCE tanpa autentikasi pada Image Optimization API); perbaikan tersedia di `16.4.3`.
   - Route AI (`/api/analisis`, `/api/ide`, `/api/generate`, `/api/carousel`, `/api/naskah-video`) **tidak memeriksa sesi** dan budget AI hanya berlaku untuk user yang login. Siapa pun yang tahu URL dapat membelanjakan kredit API pemilik.
5. **Integrasi Shopee Affiliate Content Machine belum boleh dimulai sebagai perubahan kode.** Fondasi skema sudah ada (produk, konten, kalender, performa, publikasi), tetapi sumber kebenaran data masih browser. FASE 1 berhenti di sini dan menunggu keputusan pemilik proyek.

**Kesimpulan status FASE 1:** **Completed** untuk audit repository/kode, **Blocked** untuk audit database live (host tidak resolve). Tidak ada tindakan destruktif yang diambil.

---

## 2. Arsitektur Repository

### 2.1 Stack [TERVERIFIKASI]

| Komponen | Versi / fakta | Bukti |
|---|---|---|
| Framework | Next.js `16.4.0` (App Router, Turbopack) | `package.json` |
| React | `19.3.0` | `package.json` |
| Bahasa | TypeScript `^5` | `package.json`, `tsconfig.json` |
| Styling | Tailwind CSS `^4` via `@tailwindcss/turbopack` | `next.config.ts`, `app/globals.css` |
| Database/Auth | Supabase (`@supabase/ssr` `^0.12.7`, `@supabase/supabase-js` `^2.117.3`) | `package.json`, `lib/supabase/*` |
| Validasi | Zod `^4.6.5` | `package.json`, `lib/ai/schemas.ts` |
| Form | React Hook Form `^7.89.0` | `package.json` |
| Test | Vitest `^1.6.1` | `package.json`, 53 file test |
| Node lokal | `v24.14.0` | `node -v` |
| Runtime Vercel | Tidak dipatok (`engines` tidak ada) | `package.json` — **[BELUM DIPERIKSA]** di dashboard |

### 2.2 Peta folder [TERVERIFIKASI]

```
app/
  (dashboard)/        halaman: dashboard, posting/baru, antrian, kalender, konten (redirect),
                      link, template, riwayat, impor, analitik, akun, pengaturan
  api/                akun, analisis, biaya, carousel, generate, ide, konten,
                      naskah-video, penawaran/ambil-meta, posting/{ketersediaan,kirim}
  auth/callback/      exchange code magic link
  masuk/              form login magic link
components/           AppShell, PageHeader, StatCard, StatusBadge, ReviewTabs, dll.
features/             komponen per domain (posting, konten, impor, performa, akun, pengingat)
lib/
  ai/                 jalankan-ai, generate-json, catat-generation, prompt berversi, persona
  konten/             skema, store localStorage, supabase-konten, kalender, checklist, gaya-preset
  posting/            provider, threads, threads-oauth, antrian, catat-post, skema
  produk/             skema produk, pembersih deskripsi, status posting, panduan foto
  impor/              parser CSV/XLSX, normalisasi, performa, prefill
  performa/           atribusi klik/komisi
  supabase/           klien peramban + server (cookie-bound)
supabase/migrations/  0001–0009 (aditif)
docs/                 PRD, UI-Spec, Workflow, Rencana, skema, ADR, test log
prompts/              salinan prompt Markdown bernomor versi
golden/               10 produk uji + rubrik
tests/                fixture + skrip RLS dua akun
proxy.ts              refresh sesi Supabase (bukan otorisasi)
```

### 2.3 Alur data aktual [TERVERIFIKASI]

- **Sumber utama UI saat ini: `localStorage`.** Kunci yang ditemukan:
  `autothreads`, `autothreads-products`, `autothreads-konten`, `autothreads-riwayat`,
  `autothreads-riwayat-kirim`, `autothreads-pengaturan`, `autothreads-pengaturan-posting`,
  `autothreads-template`, `autothreads-link-catatan`, `autothreads-link-programs`,
  `autothreads-performa`, `autothreads-atribusi`, `autothreads-biaya`,
  `autothreads-draft-posting`, `autothreads-akun-sosial`, `autothreads-pengingat-ditutup`.
- **Supabase hanya dipakai untuk sebagian kecil fitur:** sinkron pustaka konten (`/api/konten`),
  log generasi AI (`generations`), log kirim (`posts`), akun Threads (`threads_accounts`),
  preset gaya carousel (`carousel_gaya_preset`), dan biaya (`generations`).
- **Klien Supabase:** peramban memakai anon key (`lib/supabase/klien.ts`); server memakai cookie
  pengguna (`lib/supabase/server.ts`). `SUPABASE_SERVICE_ROLE_KEY` **tidak dibaca kode aplikasi**
  (hanya disebut di komentar). Tidak ada pemakaian service role untuk operasi aplikasi.
- **Otorisasi halaman:** tidak ada. `app/(dashboard)/layout.tsx` hanya membungkus `AppShell`.
  `proxy.ts` secara eksplisit menyebut dirinya bukan lapisan otorisasi.

### 2.4 Alur AI dan posting [TERVERIFIKASI]

```
UI (features/posting)
  -> POST /api/analisis | /api/ide | /api/generate | /api/carousel | /api/naskah-video
     -> Zod validasi input
     -> jalankanAI()
        -> cek budget K6 HANYA jika ada sesi Supabase
        -> generateJSON() {AI_BASE_URL}/chat/completions (server-only key), retry 1–2
        -> catat ke `generations` (best-effort)
     -> Zod validasi output, 1 retry, lalu 502/429
  -> UI menampilkan draft (tidak ada `siap_posting` otomatis)

POST /api/posting/kirim
  -> Zod validasi
  -> gerbang antrian (status disetujui, jadwal, jeda, batas harian)
  -> provider manual (selalu ada) atau threads_api (env THREADS_USER_ID/ACCESS_TOKEN)
  -> catat ke `posts` (best-effort)
```

---

## 3. Inventaris Fitur Lama

Diverifikasi dengan membaca kode dan route, **bukan** dengan menjalankan UI.

| # | Fitur yang diminta dipertahankan | Status | Bukti / catatan |
|---|---|---|---|
| 1 | Dashboard | **Berfungsi (lokal)** | `app/(dashboard)/page.tsx`, `ringkasan-dashboard.tsx`; ringkasan dari localStorage |
| 2 | Input & database produk | **Sebagian** | `form-produk-manual.tsx`, `autothreads-products`; tabel `products` tidak dipakai |
| 3 | Upload media produk | **Tidak ada** | Tidak ditemukan `.storage`/`upload()` di `app/lib/features`; hanya field URL gambar; bucket `product-media` dan tabel `product_media` menganggur |
| 4 | Analisis produk AI | **Berfungsi** | `/api/analisis`, prompt `analisis-penawaran.v3` |
| 5 | Generasi ide konten | **Berfungsi** | `/api/ide`, prompt `ide-konten.v2` |
| 6 | Pemilihan ide | **Berfungsi** | state `dipilih` di `alur-buat-posting.tsx` |
| 7 | Generator Threads | **Berfungsi** | `/api/generate`, prompt `generate-status.v5`, validator 500 karakter |
| 8 | Preview & editor konten | **Berfungsi** | `threads-preview.tsx`, `status-editor.tsx`, `carousel-slide-editor.tsx` |
| 9 | Checklist persetujuan | **Berfungsi** | `lib/konten/checklist.ts`, `checklist-gate.tsx` |
| 10 | Draft & approval | **Berfungsi (lokal + sebagian DB)** | status `draft/siap_posting/terjadwal/terkirim/gagal/ditolak`; sinkron ke `contents` lewat `/api/konten` |
| 11 | Affiliate link management | **Sebagian** | `tabel-link.tsx` + localStorage; tabel `affiliate_links` (termasuk `sub_id`) tidak dipakai |
| 12 | Template konten | **Sebagian** | `editor-template.tsx` + localStorage; tabel `templates` tidak dipakai |
| 13 | Riwayat generasi AI | **Sebagian** | Widget biaya membaca `generations`; log `carousel` gagal constraint (lihat §4.4) |
| 14 | Pengaturan pengguna | **Sebagian** | `form-pengaturan.tsx` + localStorage; tabel `settings` tidak dipakai |
| 15 | Autentikasi | **Rusak di produksi** | Magic link Supabase; host project NXDOMAIN (§7.2) |
| 16 | RLS | **Terdefinisi, belum terverifikasi live** | 20 tabel punya `alter table ... enable row level security` + policy owner; tidak bisa diperiksa di DB |
| 17 | Integrasi posting | **Berfungsi (manual) / siap (API)** | `lib/posting/provider.ts`; produksi melaporkan `threads_api.tersedia=false` |
| 18 | Tracking klik & komisi manual | **Berfungsi (lokal)** | `klik_manual`, `komisi_manual` di skema konten; impor performa di `/impor`; tabel `performa_*` belum dipakai |

**Fitur yang hanya placeholder/skema:** upload media, pustaka produk lintas perangkat, link/template/pengaturan lintas perangkat, kalender di database, publikasi otomatis, analitik engagement (views/likes/comments/shares).

---

## 4. Audit Database

### 4.1 Status akses [TERVERIFIKASI]

Percobaan introspeksi read-only ke PostgREST dengan service role yang ada di `.env.local`:

```
curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" -H "apikey: <service-role>"
-> curl: (6) Could not resolve host: cjyx…uvyz.supabase.co
```

Konfirmasi DNS independen (bukan cache/DNS lokal):

| Resolver | Hasil |
|---|---|
| Google DoH (`dns.google`) | `Status: 3` (NXDOMAIN) untuk `cjyx…uvyz.supabase.co` |
| Cloudflare DoH | `Status: 3` (NXDOMAIN) |
| `nslookup` lokal | `Non-existent domain` |
| `supabase.co` (kontrol) | Resolve normal |

Bundle produksi `mouse-vert.vercel.app` juga meng-inline host yang sama (ditemukan di chunk JS
`24ms5kxfp7gkw.js`), jadi ini bukan sekadar `.env.local` yang basi: **deployment produksi memakai
project Supabase yang sudah tidak ada di DNS.**

Konsekuensi yang teramati di produksi:

```
GET /api/konten            -> 200 {"ok":true,"tersedia":false,"alasan":"sesi","baris":[]}
GET /api/biaya             -> 200 {...,"bulanIniUsd":null,...}
GET /api/akun              -> 200 {"tersedia":true,"butuhSesi":true,"akun":[]}
GET /api/posting/ketersediaan -> 200 {...,"threads_api":{"tersedia":false,...}}
```

`alasan:"sesi"` menyesatkan: server tidak bisa membedakan "belum login" dari "database tidak
terjangkau" karena `penggunaSaatIni()` menelan error jaringan dan mengembalikan `null`.
Akibatnya user akan diminta login, padahal login itself tidak bisa karena host auth mati.

### 4.2 Tabel yang diharapkan dari migrasi [TERVERIFIKASI dari file]

| Migrasi | Tabel |
|---|---|
| 0001 | `products`, `product_media`, `analysis_cache`, `idea_batches`, `ideas`, `contents`, `threads_statuses`, `generations`, `affiliate_links`, `templates`, `settings` (11) |
| 0002 | `platforms`, `content_variants`, `carousel_slides`, `threads_accounts` (4) |
| 0003 | `performa_imports`, `performa_rows` (2) |
| 0006 | `posts` (1) |
| 0008 | `offers` (1) |
| 0009 | `carousel_gaya_preset` (1) |

**Total: 20 tabel.** `docs/test-log.md` mencatat probe 19 tabel pada 21 Oktober 2026 (sebelum
0009), konsisten dengan jumlah ini.

### 4.3 Tabel yang benar-benar dipakai kode [TERVERIFIKASI]

| Tabel | Dipakai di | Operasi |
|---|---|---|
| `contents` | `app/api/konten/route.ts`, `lib/konten/supabase-konten.ts` | select/upsert |
| `threads_statuses` | `app/api/konten/route.ts` | select/delete/insert |
| `generations` | `lib/ai/catat-generation.ts`, `/api/biaya` | insert/select |
| `threads_accounts` | `app/api/akun/route.ts` | select/upsert/delete |
| `posts` | `lib/posting/catat-post.ts`, `/api/posting/kirim` | insert/select |
| `carousel_gaya_preset` | `lib/konten/gaya-preset.ts` | select/insert/delete |

Sisanya (14 tabel) belum punya pembaca/penulis di aplikasi. Ini bukan kerusakan, tetapi penting
untuk rencana integrasi: **jangan membuat tabel duplikat** untuk produk, link, template, settings,
atau kalender — tempatnya sudah ada, tinggal dihubungkan.

### 4.4 Temuan skema [TERVERIFIKASI]

| # | Temuan | Bukti | Dampak |
|---|---|---|---|
| D1 | Constraint `generations_jenis_check` **tidak memuat `carousel`** | `0001` baris 148; `0007` baris 12–13 hanya menambah `naskah_video`; `/api/carousel` mengirim `jenis: "carousel"` | Setiap log generasi carousel gagal (ditelan `catatGenerasi`); biaya carousel tidak tercatat dan **tidak dihitung oleh budget K6** |
| D2 | `offers.updated_at` tidak punya trigger | `0008` membuat kolom, tidak membuat trigger `set_updated_at` | Nilai tidak pernah berubah saat update |
| D3 | `content_variants.platform` FK ke `platforms(kode)`, tetapi `platforms` tidak pernah diisi | `0002` komentar "barisnya sengaja tidak diisi" | Insert varian apa pun gagal sampai platform di-seed |
| D4 | `posts` tidak punya kolom URL publikasi | `0006` | Publication History belum bisa menyimpan URL posting |
| D5 | `performa_*` tidak punya metrik engagement (views/likes/comments/shares) | `0003` | Affiliate Analytics belum bisa menghitung CTR/engagement penuh |
| D6 | Index FK/RLS belum lengkap | `products` tanpa index `user_id`; `ideas` tanpa index `batch_id`/`user_id`; `idea_batches` tanpa index `product_id`; `contents` tanpa index `idea_id`/`product_id`; `affiliate_links` tanpa index `product_id` | Query/RLS berpotensi seq scan saat data tumbuh |
| D7 | Policy 0001 memakai `auth.uid()` langsung, migrasi lain memakai `(select auth.uid())` | `0001` vs `0002/0003/0006/0008/0009` | Konsistensi performa RLS |
| D8 | Tidak ada tabel riset audiens | Tidak ada di 0001–0009 | Modul Audience Intelligence butuh tabel baru (aditif) |
| D9 | `contents.jadwal_at` + `contents_user_jadwal_idx` sudah ada | `0004` | Kalender bisa memakai `contents`, tidak perlu tabel kalender terpisah |
| D10 | Tidak ada constraint DB untuk 500 karakter pada `contents` | `0001` hanya membatasi `threads_statuses.teks` 1–500 | Aturan 500 karakter dijaga kode + tabel status, bukan di `contents` |

### 4.5 Checklist Supabase yang harus dijalankan pengguna [BELUM DIPERIKSA]

Jalankan di **Supabase → SQL Editor** (semua read-only) pada project yang benar:

```sql
-- 1) Tabel + status RLS
select n.nspname as schema, c.relname as tabel, c.relrowsecurity as rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relname;

-- 2) Policy RLS
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 3) Kolom dan tipe
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;

-- 4) Constraint (PK/FK/unique/check)
select conrelid::regclass as tabel, conname, contype,
       pg_get_constraintdef(oid) as definisi
from pg_constraint
where connamespace = 'public'::regnamespace
order by 1, 2;

-- 5) Index
select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
order by 1, 2;

-- 6) Trigger
select event_object_table as tabel, trigger_name,
       action_timing, event_manipulation
from information_schema.triggers
where trigger_schema = 'public'
order by 1, 2;

-- 7) Riwayat migrasi
select version, name, inserted_at
from supabase_migrations.schema_migrations
order by version;

-- 8) Storage bucket
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets;

-- 9) Bukti constraint generations (harus memuat 'carousel' setelah diperbaiki)
select pg_get_constraintdef(oid)
from pg_constraint
where conname = 'generations_jenis_check';

-- 10) Jumlah baris per tabel (opsional)
select 'products' as tabel, count(*) from products
union all select 'contents', count(*) from contents
union all select 'generations', count(*) from generations
union all select 'posts', count(*) from posts
union all select 'carousel_gaya_preset', count(*) from carousel_gaya_preset;
```

Jika memakai CLI: `npx supabase link --project-ref <ref>` lalu `npx supabase migration list`
(read-only; butuh login). **Jangan** jalankan `db push` sebelum backup/approval.

---

## 5. Riwayat Migrasi

| File | Isi | Sifat | Catatan |
|---|---|---|---|
| `0001_init.sql` | 11 tabel, enum, trigger `updated_at`, RLS, bucket `product-media` | Aditif, satu transaksi | Aman |
| `0002_posting_carousel_threads.sql` | `posting_provider`, `platforms`, `content_variants`, enum `ditolak`, `carousel_slides`, `threads_accounts` | Aditif | Menambah enum di dalam transaksi (valid PG12+, tidak boleh dipakai di transaksi yang sama); `platforms` tidak di-seed |
| `0003_performa_affiliate.sql` | `performa_imports`, `performa_rows`, `affiliate_links.sub_id` | Aditif | Enum marketplace/status |
| `0004_jadwal_konten.sql` | `contents.jadwal_at` + index | Aditif, idempoten | — |
| `0005_gaya_hook_konten.sql` | `contents.gaya_hook` + index | Aditif, idempoten | — |
| `0006_posts.sql` | `posts` + RLS | Aditif | `content_id` sengaja text tanpa FK |
| `0007_jenis_naskah_video.sql` | Drop + add constraint `generations_jenis_check` | Aditif secara data, **tidak dalam transaksi** | Jika gagal di tengah, constraint bisa hilang; tidak memuat `carousel` |
| `0008_offers.sql` | `offers` + RLS | Aditif | Tanpa trigger `updated_at` |
| `0009_gaya_preset.sql` | `carousel_gaya_preset` + RLS + trigger + index | Aditif | **Tidak dibungkus `begin/commit`**; memakai `create or replace trigger` (butuh PG14+, Supabase OK) |

**Pemeriksaan destruktif [TERVERIFIKASI]:** tidak ada `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`,
`DELETE FROM`, atau `ALTER COLUMN` di seluruh migrasi. Satu-satunya `DROP` adalah policy
(`if exists`) dan constraint `generations_jenis_check` yang langsung dibuat ulang.

**Ketidaksesuaian dokumentasi:**
- `docs/skema-database.md` §8, §9, §11 masih menulis migrasi 0002/0003/0006 "belum dijalankan",
  sedangkan `docs/test-log.md` (21 Okt 2026) mencatat probe 19 tabel berhasil.
- Belum ada bagian khusus migrasi **0009**; tabelnya sudah didokumentasikan di §4.
- `docs/Rencana-Pengembangan-Heaviliate.md` masih berstatus "rencana, belum mulai coding".
- `README.md` menyebut `npm run test:golden` (tidak ada di `package.json`) dan env `AI_*_PROVIDER`
  (kode hanya membaca `AI_BASE_URL`/`AI_MODEL`/`AI_API_KEY`).

---

## 6. Audit RLS dan Keamanan

### 6.1 RLS [TERVERIFIKASI dari migrasi; TIDAK terverifikasi live]

- **Semua 20 tabel** mengaktifkan RLS.
- Tabel milik user memakai `owner_all` (`for all to authenticated`) dengan
  `auth.uid() = user_id` (0001) atau `(select auth.uid()) = user_id` (migrasi berikutnya).
- `platforms` hanya punya policy `select` untuk `authenticated`; tidak ada insert/update/delete
  dari klien.
- Tidak ada policy untuk `anon` pada tabel data.
- Storage `product-media`: privat; policy select/insert/update/delete memeriksa folder pertama
  = `auth.uid()`.
- **Tidak dapat diuji** dengan `node tests/rls-dua-akun.mjs` karena host DB mati. Skrip itu
  membuat dua user sementara, menanam baris, menguji isolasi, lalu menghapusnya.

### 6.2 Temuan keamanan aplikasi [TERVERIFIKASI]

| # | Temuan | Bukti | Severity |
|---|---|---|---|
| S1 | Route AI tanpa autentikasi dan tanpa rate limit | `app/api/{analisis,ide,generate,carousel,naskah-video}/route.ts` tidak memanggil `penggunaSaatIni`; `lib/ai/jalankan-ai.ts` komentar: "Signed-out requests keep working but are not logged or gated" | **High** (biaya API bisa dikuras siapa pun) |
| S2 | Route kirim tanpa autentikasi | `app/api/posting/kirim/route.ts` memakai sesi hanya untuk riwayat/kuota dan log — tidak menolak permintaan tanpa sesi; provider membaca token server | **High** (latent; produksi saat ini `threads_api=false`) |
| S3 | SSRF + respons tanpa batas | `app/api/penawaran/ambil-meta/route.ts` fetch URL arbitrer, tanpa allowlist/block IP privat, `res.text()` tanpa limit, tanpa auth | **High** |
| S4 | Token Threads disimpan plaintext | `app/api/akun/route.ts`: `token_terenkripsi: input.access_token || "manual-mode-token"`; kolom bernama "terenkripsi" tetapi tidak dienkripsi | **High** saat token asli dipakai |
| S5 | localStorage global, tidak per akun | Semua kunci `autothreads-*` tanpa `user_id` | **Medium** (kebocoran antar akun di perangkat bersama; tidak lintas perangkat) |
| S6 | `DELETE` lalu `INSERT` status tanpa transaksi | `app/api/konten/route.ts` | **Medium** (status bisa hilang jika insert gagal) |
| S7 | Tidak ada header keamanan | `next.config.ts` tanpa CSP/X-Frame-Options/Referrer-Policy | **Low** |
| S8 | Halaman dashboard tanpa guard | `app/(dashboard)/layout.tsx`; `proxy.ts` bukan authz | **Low sekarang**, **High** setelah data pindah ke DB |
| S9 | `SUPABASE_SERVICE_ROLE_KEY` tidak dipakai kode | grep hanya menemukan komentar di `lib/supabase/server.ts` | **Low** (kunci kuat menganggur; hapus dari Vercel jika tidak perlu) |

### 6.3 Dependency [TERVERIFIKASI]

`npm audit --omit=dev`:

```
next 16.0.0 - 16.4.0  Severity: critical
  - Unauthenticated RCE in Image Optimization API when SVG files are used (GHSA-2464-fhr4-w9xw)
  - DoS in App Router using Server Actions (GHSA-p3m5-59mp-jv5r)
  - Unauthenticated RCE in `use cache` functions returning typed arrays (GHSA-673q-mjm6-r5xr)
  fix: next@16.4.3

zod <4.6.6  Severity: high
  - memory exhaustion validating oversized constrained collections (GHSA-mrhx-c7xc-m3w5)
  fix: zod@4.6.6
```

Aplikasi tidak memakai `next/image`, tetapi endpoint `/_next/image` tetap ada secara default.
Perbaikan wajib dijadwalkan sebelum integrasi fitur baru.

---

## 7. Audit Vercel

### 7.1 Fakta yang terverifikasi

| Item | Nilai | Bukti |
|---|---|---|
| Domain produksi | `https://mouse-vert.vercel.app` | HTTP 200 |
| Halaman login | `<title>Masuk · Heaviliate</title>` | curl `/masuk` |
| Region edge | `sin1` | header `x-vercel-id` |
| Cache | `HIT` pada `/masuk` | header `x-vercel-cache` |
| Project Vercel tertaut | `projectName: "autothreads"` | `.vercel/project.json` |
| Deploy memuat fitur preset gaya | chunk `/posting/baru` memuat `carousel_gaya_preset` (minimal commit `1e76674`) | grep bundle produksi |
| `vercel.json` | Tidak ada | repo |
| Build command | default Next (`next build`) | tidak ada override |
| Node runtime | Tidak dipatok | `package.json` tanpa `engines` |

### 7.2 Environment [SEBAGIAN]

Nama variabel di `.env.local` (nilai **tidak** dibaca/ditampilkan):

```
AI_API_KEY, AI_BASE_URL, AI_MODEL, AI_MONTHLY_BUDGET_USD, APP_URL,
DEEPSEEK_API_KEY, MIMO_API_KEY, MIMO_BASE_URL,
NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL,
SCRAPING_ENABLED, SUPABASE_SERVICE_ROLE_KEY,
THREADS_APP_ID, THREADS_APP_SECRET
```

Inferensi dari respons produksi:

- `POSTING_PROVIDER` tidak diset ke `threads_api` (respons `diminta:"manual"`).
- `THREADS_USER_ID` / `THREADS_ACCESS_TOKEN` tidak ada di produksi
  (`threads_api.tersedia=false`).
- `AI_MONTHLY_BUDGET_USD` tidak diset (respons `batasUsd:5` = default).
- `NEXT_PUBLIC_SUPABASE_URL` dan `ANON_KEY` ada (bundle memuat host + JWT), tetapi host mati.
- Nama env produksi, build log, dan status build **tidak dapat diperiksa**: `vercel whoami`
  tidak selesai dalam 60 detik (kemungkinan menunggu login interaktif). **Jangan** menganggap daftar
  env lokal sama dengan env Vercel.

### 7.3 Yang harus dicek pengguna di dashboard Vercel

1. **Settings → Environment Variables**: pastikan `NEXT_PUBLIC_SUPABASE_URL` dan
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` menunjuk project Supabase yang **aktif**; perbarui untuk
   Production + Preview.
2. Hapus `SUPABASE_SERVICE_ROLE_KEY` dari Vercel jika tidak dipakai server (kode tidak membacanya).
3. Pastikan `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` ada; `AI_MONTHLY_BUDGET_USD` diset eksplisit.
4. **Deployments**: catat commit dan waktu deploy terakhir; bandingkan dengan `main` (`1e76674`).
5. **Settings → General**: cek Node.js Version (Next 16 butuh Node 20.9+; gunakan 22 LTS).
6. Setelah env Supabase diperbarui, **redeploy** — variabel `NEXT_PUBLIC_*` di-inline saat build,
   jadi mengubah env saja tidak cukup.

---

## 8. Kualitas Kode dan Hasil Test

Semua perintah dijalankan dari `heaviliate/` pada commit `1e76674`.

| Pemeriksaan | Perintah | Hasil aktual | Exit |
|---|---|---|---|
| Typecheck | `./node_modules/.bin/tsc --noEmit` | Tidak ada error | **0** |
| Lint | `./node_modules/.bin/eslint .` | Tidak ada error (89 detik; run awal lebih lambat) | **0** |
| Unit test | `./node_modules/.bin/vitest run` | **495 test lulus, 53 file**, 187 detik | **0** |
| Build | `./node_modules/.bin/next build` | Sukses, 28 static page digenerate, 26 route terdaftar, 252 detik | **0** |
| Audit dependency | `npm audit --omit=dev` | 2 kerentanan (1 critical, 1 high). Exit code tidak dipakai sebagai gate; nilai exit tidak dicatat pada run ini | n/a |
| Git | `git status -sb` | Tidak ada perubahan tracked; 3 untracked lama | — |

**Tidak dijalankan / tidak dapat dijalankan:**

| Pemeriksaan | Alasan |
|---|---|
| `node tests/rls-dua-akun.mjs` | Host Supabase NXDOMAIN; skrip butuh project hidup |
| Uji login magic link end-to-end | Sama; Supabase Auth tidak terjangkau |
| Uji generate AI nyata | Akan membelanjakan kredit; bukan audit read-only |
| Uji kirim Threads nyata | Tidak ada kredensial; produksi melaporkan provider tidak siap |
| Uji UI di peramban (klik alur) | Tidak diminta; audit ini berbasis kode + HTTP |
| Audit env/build Vercel | CLI tidak terautentikasi |

**Catatan kejujuran:** lulusnya typecheck/lint/test/build membuktikan repo konsisten secara
kompilasi dan unit, **bukan** membuktikan fitur berjalan end-to-end, RLS aktif di database, atau
integrasi Supabase berfungsi. Itu sebabnya status database ditulis Blocked.

---

## 9. Risiko

| Severity | Risiko | Dampak | Mitigasi |
|---|---|---|---|
| **Critical** | Project Supabase produksi tidak ada di DNS | Login & semua fitur DB mati; data tidak bisa dibaca/ditulis | Pulihkan project atau buat project baru, update env, migrasi, redeploy |
| **Critical** | `next@16.4.0` advisory RCE | Eksekusi kode tanpa autentikasi (permukaan Image Optimization) | Upgrade `next@16.4.3+`, regression test, redeploy |
| **High** | Route AI terbuka tanpa sesi/rate limit | Kredit AI pemilik bisa dihabiskan bot | Wajibkan sesi + rate limit per IP/user; budget untuk semua panggilan |
| **High** | Route posting terbuka | Jika token Threads diaktifkan, orang lain bisa posting atas nama pemilik | Wajibkan sesi + kepemilikan konten; audit log |
| **High** | SSRF di `ambil-meta` | Akses jaringan internal, konsumsi memori | Allowlist domain marketplace, blok IP privat, batas ukuran, auth |
| **High** | Biaya carousel tidak tercatat | Budget K6 tidak menghentikan pengeluaran carousel | Migrasi aditif menambah `carousel` ke constraint |
| **High** | Token Threads plaintext | Token bocor jika DB/backup terekspos | Enkripsi server-side atau jangan simpan token lewat route itu |
| **Medium** | localStorage global | Data antar akun tercampur di satu perangkat; tidak sinkron | Migrasi data ke tabel ber-`user_id`, kunci per akun |
| **Medium** | Upload media belum ada | Fitur "upload media produk" tidak terpenuhi | Implementasi Storage upload + `product_media` (fase terpisah) |
| **Medium** | Status konten delete-then-insert | Kehilangan status saat insert gagal | RPC transaksional atau upsert + rekonsiliasi |
| **Medium** | Dokumentasi skema/fase basi | Salah ambil keputusan saat integrasi | Perbarui `skema-database.md`, `Rencana`, `README` |
| **Low** | Index FK/RLS kurang | Query melambat saat data besar | Migrasi index aditif |
| **Low** | `offers.updated_at` tanpa trigger | Nilai tidak akurat | Trigger `set_updated_at` |
| **Low** | `platforms` kosong | Varian platform gagal insert | Seed baris `threads`, `tiktok` |
| **Low** | Tanpa header keamanan / `engines` | Hardening & reproducibility | CSP/frame-options; `engines.node` |

---

## 10. Rekomendasi

### P0 — Sebelum menyentuh fitur baru

1. **Selesaikan status Supabase.** Pemilik harus membuka dashboard Supabase dan memastikan apakah
   project `cjyx…uvyz` dihapus, di-pause, atau diganti. Jika dihapus: buat project baru, lalu
   jalankan 0001–0009 berurutan **setelah backup/approval**. Jika di-pause: restore.
2. **Perbarui env Vercel** (`NEXT_PUBLIC_SUPABASE_URL`, `ANON_KEY`) untuk Production + Preview,
   lalu redeploy. `NEXT_PUBLIC_*` di-inline saat build.
3. **Verifikasi login** magic link di produksi setelah env benar (kirim tautan, callback, sesi,
   logout).
4. **Upgrade dependency keamanan**: `next@16.4.3+` dan `zod@4.6.6+` (butuh persetujuan; di luar
   scope read-only).
5. **Tambal constraint `generations`** dengan migrasi baru `0010` (aditif):
   tambahkan `'carousel'` ke `generations_jenis_check`, trigger `offers.updated_at`, dan index
   yang hilang. Jangan mengubah 0007.

### P1 — Hardening sebelum modul baru

6. Wajibkan sesi pada semua route AI dan posting; tambahkan rate limit per user/IP; pastikan
   budget K6 berlaku juga untuk permintaan tanpa sesi (tolak, bukan lewat).
7. Amankan `ambil-meta`: allowlist host marketplace, blok IP privat/link-local, batas ukuran
   respons, dan wajib sesi.
8. Enkripsi token Threads di server (atau hapus penyimpanan token lewat route akun) dan jangan
   pernah mengirim token ke klien.
9. Tambahkan guard sesi pada layout dashboard **sebelum** data pindah dari localStorage ke DB.

### P2 — Integrasi Shopee (setelah persetujuan FASE 2)

10. Tetapkan `contents`/`products` sebagai sumber kebenaran; migrasikan data localStorage ke tabel
    dengan `user_id` (bukan sekadar menyalin tanpa pemilik).
11. Gunakan tabel yang sudah ada: `products` untuk Product Opportunity, `contents.jadwal_at` untuk
    kalender, `posts` untuk Publication History (tambah kolom URL), `performa_*` untuk Analytics
    (tambah metrik engagement).
12. Tambah `audience_research` hanya jika benar-benar belum ada padanan.
13. Buat adapter platform (Threads/TikTok) di `lib/platforms/` + prompt berversi; jangan
    menduplikasi `lib/ai/`.
14. Google Sheets: mulai dari ekspor/impor CSV dengan validasi Zod per baris, ID unik, laporan
    error per baris, tanpa two-way sync dan tanpa API key di spreadsheet.

### P3 — Operasional

15. Tambah CI (lint, typecheck, test, build) dan jalankan `tests/rls-dua-akun.mjs` terhadap project
    staging, bukan produksi.
16. Sinkronkan dokumentasi: status migrasi, `README`, `Rencana`, dan tambahkan §14 untuk 0009.

---

## 11. Item yang Memerlukan Persetujuan Pengguna

| # | Keputusan | Mengapa butuh persetujuan |
|---|---|---|
| A1 | Restore atau buat project Supabase baru | Hanya pemilik yang punya akses dashboard; menentukan apakah data lama masih ada |
| A2 | Menjalankan migrasi 0001–0009 (atau 0010) di project | Instruksi eksplisit: tidak ada migrasi produksi tanpa persetujuan |
| A3 | Upgrade `next` dan `zod` | Perubahan dependency di luar scope read-only |
| A4 | Menutup route AI/posting dengan sesi | Mengubah perilaku (saat ini signed-out diizinkan) |
| A5 | Membuat branch `feature/shopee-affiliate-integration` | FASE 4; belum boleh dimulai |
| A6 | Menghapus `SUPABASE_SERVICE_ROLE_KEY` dari Vercel | Perubahan konfigurasi produksi |
| A7 | Migrasi data localStorage → Supabase | Butuh desain kepemilikan data dan rollback |

**Tidak ada perubahan database, kode, deployment, atau konfigurasi yang dilakukan pada FASE 1.**

---

## 12. Format Status Fase

### STATUS FASE
**Completed** untuk audit repository, kode, build, dan deployment publik.
**Blocked** untuk audit database live, RLS aktual, dan login end-to-end (host Supabase NXDOMAIN).

### YANG DIPERIKSA
- Git: branch `main`, commit `1e76674`, remote `origin`, `git status`.
- Dokumen: `AGENTS.md`, `README.md`, `docs/README.md`, `docs/skema-database.md`,
  `docs/Rencana-Pengembangan-Heaviliate.md`, `docs/provider-posting.md`,
  `docs/test-log.md`, `env.example`.
- Seluruh migrasi `0001`–`0009`.
- Kode: `app/api/*`, `app/(dashboard)/*`, `lib/ai/*`, `lib/konten/*`, `lib/posting/*`,
  `lib/supabase/*`, `proxy.ts`, `app/auth/callback`, `app/masuk`.
- Konfigurasi: `package.json`, `next.config.ts`, `eslint.config.mjs`, `.vercel/project.json`.
- Deployment: `https://mouse-vert.vercel.app` (HTML, chunk JS, header, 4 endpoint GET).
- DNS: Google DoH, Cloudflare DoH, `nslookup` lokal.
- Dependency: `npm audit --omit=dev`.

### TEMUAN
Lihat §1, §4.4, §6.2, §7.2, dan §9. Temuan paling menentukan:
1. Host Supabase produksi NXDOMAIN → login & DB mati.
2. `next@16.4.0` critical advisory; `zod` high.
3. Route AI/posting/`ambil-meta` tanpa autentikasi.
4. `generations` tidak menerima `carousel` → biaya tidak tercatat.
5. Aplikasi masih localStorage-first; 14 dari 20 tabel belum dipakai.

### RISIKO
**Critical** (Supabase mati, RCE Next), **High** (biaya AI, posting, SSRF, token, budget
carousel), **Medium** (localStorage, upload media, transaksi status, dokumentasi), **Low**
(index, trigger offers, seed platforms, header, engines).

### PERUBAHAN
**Tidak ada perubahan kode, SQL, database, deployment, atau konfigurasi Vercel.**
Satu file baru: `docs/AUDIT-REPORT.md`.

### HASIL TEST
```
tsc --noEmit                  exit 0
eslint .                      exit 0 (89s)
vitest run                    exit 0 — 495 test / 53 file
next build                    exit 0 — 28 static page, 26 route
npm audit --omit=dev          2 vulnerabilities (next critical, zod high)
tests/rls-dua-akun.mjs        NOT RUN — Supabase host NXDOMAIN
```

### LANGKAH SELANJUTNYA
1. Pengguna memverifikasi status project Supabase dan mengisi checklist §4.5.
2. Pengguna memutuskan A1–A2 (restore/buat project, izin migrasi).
3. Setelah database hidup dan login terverifikasi, lanjut **FASE 2: Architecture Proposal**
   (pemetaan Google Sheets → Heaviliate dan desain modul baru), tanpa menulis kode dulu.

### PERSETUJUAN
**Ya.** FASE 2 tidak dimulai sebelum pengguna menyetujui hasil audit ini dan memutuskan status
project Supabase. Tidak ada migrasi yang dijalankan pada sesi ini.
