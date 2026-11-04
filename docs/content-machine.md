# Content Machine Shopee Affiliate — Rencana FASE 2

Status: **Tahap A sudah dikodekan (5 November 2026)**; Tahap B–D masih rencana.
Keputusan tahap 1-2 tercatat di ADR 0011.

Tujuan: mengubah tujuh prompt ChatGPT yang selama ini dijalankan terpisah menjadi
satu pipeline di dalam Heaviliate, sehingga hasil tahap 1 menjadi bahan tahap 2,
bukan disalin manual antar percakapan.

## 1. Keputusan yang sudah tetap

| Hal | Nilai |
|---|---|
| Niche awal | Rumah tangga & perlengkapan dapur |
| Platform | Threads (aktif), TikTok (fase lanjut), Shopee (tujuan klik) |
| Otomatisasi | Semi-otomatis; Google Sheets untuk ekspor/impor |
| n8n | Ditunda sampai volume konten menuntut dan skema stabil |

## 2. Prinsip pipeline

1. **Satu artefak per tahap, tersimpan.** Tahap berikutnya membaca artefak tahap
   sebelumnya dari database, bukan dari teks yang ditempel ulang.
2. **Prompt berversi** (`*.v1.ts`), output divalidasi Zod, satu retry.
3. **Semua hasil draft.** Tidak ada `siap_posting` tanpa aksi user.
4. **Input manual selalu tersedia**; setiap tahap bisa dilewati.
5. **Google Sheets adalah jalur tukar data**, bukan sumber kebenaran.

## 3. Pemetaan tujuh tahap

| # | Tahap | Artefak | Yang sudah ada | Yang belum ada |
|---|---|---|---|---|
| 1 | Audience problem | `audience_riset`: 10 masalah + produk contoh | — | tabel, prompt, route, halaman |
| 2 | Peluang produk | `peluang_produk`: kategori + alasan + prioritas | `products`, `offers` (hanya setelah produk dipilih) | prompt, tabel, alur pilih→produk |
| 3 | Angle konten | `ideas` + `kategori_angle` | `ide-konten.v2`, `/api/ide` | pengelompokan angle, ide tanpa produk |
| 4 | Hook | `hooks`: pustaka hook per produk/angle | `generate-status.v6` (gaya hook + kerangka penulisan per konten, ADR 0012) | pustaka hook, prompt 10 hook |
| 5 | Soft selling | `contents` draft (hook, masalah, insight, solusi, CTA) | `generate-status.v6` (kerangka MSSPC mendekati alur ini), `carousel-slides.v2` | konsep 5 blok terstruktur |
| 6 | Optimizer | `content_reviews`: skor + temuan + versi perbaikan | checklist manual (`lib/konten/checklist.ts`) | prompt skor/rewrite, tabel |
| 7 | Roadmap 30 hari | `contents.jadwal_at` + `tujuan` | `jadwal_at` (0004), halaman kalender | prompt 30 hari, penulis jadwal |

Bacaan: **tiga tahap sudah punya mesin** (3, 5, dan sebagian 4). Yang benar-benar
baru adalah tahap 1, 2, 6, dan 7.

## 4. Temuan yang menentukan urutan

`idea_batches.product_id` di migrasi 0001 bersifat `not null`. Artinya setiap ide
wajib menempel pada produk yang sudah dibuat. Padahal alur yang Anda tulis bergerak
dari audiens → peluang produk → **baru** memilih produk. Selama kolom itu tetap
`not null`, tahap 3 tidak bisa dijalankan sebelum tahap 1 dan 2 selesai.

Jadi pekerjaan pertama bukan membuat halaman baru, melainkan **melonggarkan
batasan itu** agar ide bisa lahir dari riset audiens, bukan hanya dari produk.

## 5. Migrasi 0010 (dibuat 5 November 2026)

Aditif, tidak mengubah data lama:

- `audience_riset` — `user_id`, `niche`, `audiens`, `ringkasan`, `masalah jsonb`,
  `prompt_version`, `created_at`; RLS `(select auth.uid()) = user_id`.
- `peluang_produk` — `riset_id` (FK), `kategori`, `alasan`, `prioritas`.
- `alter idea_batches alter column product_id drop not null` + kolom `riset_id`.
- `ideas` — kolom `kategori_angle` (text, bukan enum: daftar angle masih berkembang).
- `hooks` — `produk_id`, `ideas_id`, `teks`, `gaya`, `dipakai`.
- `content_reviews` — `content_id`, `skor jsonb`, `temuan jsonb`, `versi_perbaikan`.
- `contents` — kolom `tujuan` (awareness/problem/education/trust/discovery/soft_selling/conversion).
- `generations.jenis` — tambah `carousel`, `audience`, `peluang`, `optimizer`, `roadmap`.
- Trigger `offers.updated_at` dan index foreign key yang belum ada.

Isi 0010 yang benar-benar dibuat lebih sempit dari usulan di atas: hanya
`audience_riset`, `peluang_produk`, dan constraint `generations.jenis`. Sisanya
(`hooks`, `content_reviews`, `ideas.kategori_angle`, pelonggaran `product_id`) menunggu
Tahap B/C supaya tidak ada tabel yang menganggur.

Catatan: **0009 dan 0010 sama-sama belum dijalankan** di database produksi. Keduanya
tetap ditempel lewat SQL Editor karena tidak ada kredensial DDL di mesin ini.

## 6. Urutan pembangunan

### Tahap A — Hulu (tahap 1 & 2)

Irisan vertikal pertama, satu alur utuh:

1. Prompt `riset-audience.v1` → 10 masalah, tiap masalah dengan produk contoh + alasan.
2. `POST /api/audience` menyimpan ke `audience_riset`, lalu memanggil
   `peluang-produk.v1` dan menyimpan hasilnya ke `peluang_produk`.
3. Halaman `/riset`: form niche + audiens, daftar hasil, tombol "jadikan produk"
   yang mengisi `products` + `offers` (input manual tetap bisa).
4. Ekspor CSV dua tabel untuk dipakai di Google Sheets.

Selesai bila: satu niche + audiens menghasilkan 10 masalah dan 20 kategori yang
tersimpan, bisa dibuka lagi setelah refresh, dan CSV-nya bisa dibuka di Sheets.

### Tahap B — Tengah (tahap 3 & 4)

`ide-konten.v3` menambahkan `kategori_angle` dan menerima `riset_id` (tanpa produk).
Pustaka `hooks` menyimpan 10 hook per produk dengan penanda mana yang sudah dipakai.

### Tahap C — Hilir (tahap 5–7)

`soft-selling.v1` menghasilkan 5 konsep berstruktur, `optimizer.v1` memberi skor +
versi perbaikan, `roadmap.v1` mengisi 30 baris `contents` dengan `jadwal_at` dan
`tujuan` yang bisa digeser di kalender.

### Tahap D — TikTok

Butuh pipeline sendiri (storyboard → VO → komposisi). Prompt-nya belum ada di repo
ini; jangan dicampur ke format Threads.

## 7. Google Sheets

Ekspor: satu CSV per tahap dengan kolom tetap (`riset.csv`, `peluang.csv`,
`konten.csv`, `jadwal.csv`). Impor hanya untuk jadwal (`id` + `jadwal_at` + `tujuan`),
supaya Sheets tidak menjadi sumber kebenaran kedua yang bisa berbeda dari database.

## 8. Yang sengaja belum dikerjakan

n8n, scraping Shopee, auto-post TikTok, dan pembuatan multi-niche. Semuanya menambah
permukaan yang harus diuji sebelum 30 konten pertama terbukti jalan.

## 9. Berkas yang akan tersentuh (indikatif)

Tahap A: `supabase/migrations/0010_*.sql`, `lib/ai/prompts/riset-audience.v1.ts`,
`lib/ai/prompts/peluang-produk.v1.ts`, `lib/ai/schemas.ts`,
`app/api/audience/route.ts`, `app/(dashboard)/riset/page.tsx`,
`features/riset/*`, `components/nav-config.ts`, `docs/skema-database.md`,
satu ADR baru (nomor berikutnya: 0011, karena 0007 dan 0010 sudah terpakai ganda).
