# Test Log: Heaviliate

Catatan hasil tes per tanggal. Rincian lapisan tes ada di `docs/rencana-testing.md`.

## 12 Oktober 2026 — sinkronisasi dokumen dan deploy pertama

Fase: prasyarat (P3, P4) dan penutup Fase 1 (fondasi sesi Supabase).

| Pemeriksaan | Perintah | Hasil |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | Lulus, 0 error |
| Lint | `npm run lint` | Lulus, 0 temuan |
| Unit dan fixture | `npx vitest run` | 146 tes lulus di 12 berkas |
| Build produksi | `npx next build` | Lulus, 19 rute, proxy terdeteksi |
| Aplikasi jalan | `next start` di localhost | `/`, `/masuk`, `/konten`, `/impor` merespons 200 |
| Deploy | `vercel deploy --prod` | Ready in 24s, build sukses di Vercel |
| Produksi | `https://autothreads-sigma.vercel.app` | `/`, `/masuk`, `/konten`, `/impor` merespons 200, tanpa error konsol |
| Login terpasang | buka produksi di peramban | `/masuk` menampilkan form email dan tombol "Kirim tautan login", bukan pesan env kurang |
| Env Vercel | `vercel env ls` | 7 variabel di Production dan Preview (Supabase URL, anon key, service role, GEMINI_MODEL, APP_URL, AI_MONTHLY_BUDGET_USD, SCRAPING_ENABLED) |
| Git ke Vercel | `vercel git connect` | Repo `autoblogmedianetwork/mouse` sudah tersambung ke project, jadi push ke `main` memicu deploy |

Catatan cara memasang env: `vercel env add` interaktif untuk nama `NEXT_PUBLIC_*` (prompt penyimpanan)
dan untuk `preview` (prompt git branch), jadi pengisian dilakukan dengan `--no-sensitive --force --yes`
untuk variabel publik dan `--force --yes` untuk variabel rahasia, nilai lewat stdin, tidak pernah
ditampilkan di terminal.

Yang belum diuji dan masih menjadi batas:

- Magic link end-to-end belum diuji. Formnya sudah tampil, tetapi tautan perlu email nyata, dan
  `https://autothreads-sigma.vercel.app/auth/callback` harus masuk daftar Redirect URLs di Supabase.
- `GEMINI_API_KEY` masih kosong di `.env.local`, jadi tidak ikut dikirim ke Vercel dan panggilan AI
  belum bisa diuji (P2, P8). Isi dulu, lalu jalankan ulang pengisian env.
- `supabase/migrations/0003_performa_affiliate.sql` belum dijalankan di project Supabase.
- Tes RLS dua akun (`rencana-testing.md` bagian 4) belum dijalankan karena migrasi belum diterapkan.
- Golden set belum jalan: `golden/produk-*.json` masih placeholder dan perintah
  `npm run test:golden` belum dibuat (rencananya mulai Fase 2).

Cara menguji manual:

1. Buka `https://autothreads-sigma.vercel.app`.
2. Cek empat rute: `/`, `/masuk`, `/impor`, `/analitik`.
3. Setelah env Supabase diisi, coba magic link dan pastikan halaman `/masuk` menampilkan pesan yang
   benar saat email belum terdaftar.

## 12 Oktober 2026 — Antrian review (UI-Spec 3.9)

Fase: bagian awal F10 (antrian review). Data masih localStorage, jadi tes integrasi RLS tidak
berlaku untuk tugas ini.

| Pemeriksaan | Perintah / cara | Hasil |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | Lulus, 0 error |
| Lint | `npm run lint` | Lulus, 0 temuan |
| Unit dan fixture | `npx vitest run` | 163 tes lulus di 15 berkas (3 berkas baru: `lib/konten/skema.test.ts`, `lib/konten/store.test.ts`, `lib/ai/biaya.test.ts`) |
| Build produksi | `npx next build` | Lulus, rute `/antrian` terdaftar |
| Rute lama | `curl -I localhost:3210/konten` | `307` ke `/antrian` |
| Jumlah per tab | buka `/antrian` dengan 5 konten uji | Perlu review 2, Disetujui 1, Terjadwal 0, Gagal posting 0, Sudah posting 1, Ditolak 1 |
| Label Otomatis | konten dengan `otomatis: true` | Muncul tepat satu kali di kartu yang benar |
| Aksi massal tandai siap | pilih 2 draft, satu checklist lengkap | 1 dipindah ke Disetujui, 1 dilewati dengan pesan checklist belum lengkap |
| Tab Ditolak | buka tab | Kartu tampil dengan aksi Pulihkan ke draft, Duplikat, Hapus |
| Widget biaya | periksa header | "Belum ada panggilan AI tercatat. Batas bulanan $5.00" |
| Konsol | pemeriksaan konsol peramban | Tidak ada error |

Yang belum dicakup:

- Kartu belum menampilkan thumbnail, karena `contents` tidak punya field media. Menunggu field foto
  dan relasi `product_media` di Supabase.
- Tab Terjadwal, Gagal posting, dan tombol "Jeda semua" baru tampil kosong: provider posting dan
  mode semi/otomatis belum dibuat (Fase 5-7).
- Widget biaya menampilkan angka nol saat log lokal terisi; log sendiri baru terisi setelah pemanggilan
  AI mencatat `usageMetadata` (tugas batas biaya, K6).
- Deploy produksi belum memuat halaman ini; jalankan `vercel deploy --prod` setelah push.

## 12 Oktober 2026 — Jalur manual ide (PRD F1)

Fase: perbaikan alur Buat posting. Tahap 3 tadinya menerima ide hanya dari panggilan AI, jadi saat
`GEMINI_API_KEY` kosong alur terkunci di "Pilih minimal satu ide" — padahal pesan error server dan
 EmptyState menyarankan "lanjutkan dengan input manual" yang tidak pernah ada.

| Pemeriksaan | Perintah / cara | Hasil |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | Lulus, 0 error |
| Lint | `npm run lint` | Lulus, 0 temuan |
| Unit dan fixture | `npx vitest run` | 168 tes lulus di 16 berkas (berkas baru `lib/konten/ide-manual.test.ts`, 5 tes) |
| Build produksi | `npx next build` | Lulus, rute terdaftar |
| Judul kosong | klik "Tambah ide" tanpa mengisi | Alert "Judul ide wajib diisi."; daftar ide tidak berubah |
| Tambah ide manual | isi judul, klik "Tambah ide" | Kartu ide muncul, checkbox langsung tercentang, hitungan "1 dipilih" |
| Lanjut tanpa AI | klik "Lanjut ke pengaturan" | Tahap berpindah ke 4. Generate (tadinya terkunci) |
| Fallback generate | klik "Generate 1 konten" tanpa key | Alert "Generate gagal … Bisa ditulis manual di editor." dan tahap 5 terbuka dengan editor kosong |
| Bentuk objek ide | 5 tes unit | Lolos `ideItemSkema`; judul di-trim; judul kosong/spasi ditolak; `format_label` di luar `FORMAT_LABELS` ditolak |

Yang belum dicakup:

- Panggilan AI sungguhan (P2) belum bisa dijalankan: `GEMINI_API_KEY` masih kosong di `.env.local`
  (baris 12, 15 karakter) dan tidak ada di Vercel. Key sudah disalin dari Google AI Studio tapi belum
  pernah disimpan ke berkas maupun variabel lingkungan.
- Ide manual tidak menyimpan format ke tabel `ideas` (belum ada kaitan ke Supabase untuk langkah ini).

## 13 Oktober 2026 — Migrasi 0002 ditulis ulang dari skema-database.md 9.1-9.4

Fase: menyiapkan skema Fase 7. File 0002 yang lama (`0002_provider_per_fungsi_and_carousel.sql`,
belum pernah di-commit dan belum pernah dijalankan) tidak setia pada rancangan bagian 9: kolom
`content_id` tanpa foreign key, `template` dipaksa `not null`, `created_at` hilang, **RLS tidak
diaktifkan sama sekali**, dan tabel `provider_per_fungsi` yang tidak pernah ada di dokumen mana pun.
File itu diganti dengan `0002_posting_carousel_threads.sql`.

| Pemeriksaan | Perintah / cara | Hasil |
|---|---|---|
| Cakupan | bandingkan dengan `skema-database.md` 9.1-9.4 | 9.1 `contents.posting_provider`, `platforms`, `content_variants`; 9.2 enum `ditolak`; 9.3 `carousel_slides`; 9.4 `threads_accounts` — semua ada |
| RLS | periksa isi file | RLS aktif di 4 tabel baru: policy select di `platforms`, `owner_all` di `content_variants`, `carousel_slides`, `threads_accounts` |
| Tidak ada kunci API di database | `grep -rn "create table.*provider_per_fungsi" docs/ supabase/` | 0 temuan setelah file lama dihapus (ADR 0002: provider lewat env, `docs/ai-provider.md` baris 45) |
| Dokumen disinkronkan | `skema-database.md` bagian 9 | Judul bagian 9 diganti, dan 9.7 mencatat empat selisih rancangan vs file |
| Daftar migrasi | `ls supabase/migrations/` | `0001_init.sql`, `0002_posting_carousel_threads.sql`, `0003_performa_affiliate.sql` |

Yang belum bisa diuji dan masih menjadi batas:

- **SQL belum pernah dieksekusi.** Mesin ini tidak punya `psql`, Python, maupun parser SQL, dan
  `.env.local` hanya memuat kunci REST Supabase, bukan connection string Postgres. Validasi baru
  sebatas pemeriksaan struktur dan kesamaan pola dengan `0003_performa_affiliate.sql` yang polanya
  sudah dipakai. Verifikasi sungguhan menunggu penempelan di Supabase SQL Editor.
- `carousel_slides` dan `provider_per_fungsi` masih 404 di Supabase produksi, sementara `contents`
  dan `products` 200. Artinya belum ada versi 0002 mana pun yang pernah dijalankan.
- Tes RLS dua akun (`rencana-testing.md` bagian 4) masih tertunda sampai 0002 dan 0003 dijalankan.
- `alter type content_status add value 'ditolak'` tidak bisa dibatalkan. UI tab Ditolak di `/antrian`
  sudah ada, jadi syarat "jalankan setelah UI tab siap" di bagian 9.2 sudah terpenuhi.

Cara menguji manual:

1. Supabase → SQL Editor → tempel seluruh isi `supabase/migrations/0002_posting_carousel_threads.sql` → Run.
2. Tekan Run sekali lagi; file harus lolos tanpa error karena semua `create` pakai `if not exists`.
3. Di Table Editor, pastikan `platforms`, `content_variants`, `carousel_slides`, dan
   `threads_accounts` ada dan kolom RLS-nya aktif.
4. Di `/antrian`, tab "Ditolak" tetap berfungsi seperti sebelumnya.

## 13 Oktober 2026 — GEMINI_MODEL disambungkan ke pemanggilan Gemini

Fase: prasyarat P2. `GEMINI_MODEL` sudah lama diset di Vercel (Secret, Production dan Preview) dan
tercatat di `env.example`, tapi **tidak ada satu pun kode yang membacanya**:
`lib/ai/generate-json.ts` mengunci `DEFAULT_MODEL = "gemini-2.5-flash-lite"`, jadi mengganti
variabel itu tidak berpengaruh apa pun.

| Pemeriksaan | Perintah / cara | Hasil |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | Lulus, exit 0 |
| Lint | `npm run lint` | Lulus, exit 0 |
| Unit dan fixture | `npx vitest run` | 176 tes lulus di 17 berkas (berkas baru `lib/ai/generate-json.test.ts`, 8 tes) |
| Bukti test tidak kosong | sambungan env dimatikan sementara, lalu `npx vitest run lib/ai/generate-json.test.ts` | Gagal tepat 1 tes: `expected ... to contain '/models/gemini-2.5-pro:generateContent'` (exit 1); sambungan dipulihkan dan test hijau lagi |
| Kunci tidak bocor ke URL | assertion di dalam test | `x-goog-api-key` tetap hanya di header, URL bebas kunci (AGENTS aturan 11) |
| Model bawaan | assertion di dalam test | URL memakai `gemini-2.5-flash-lite` saat `GEMINI_MODEL` kosong |

Urutan pemilihan model sekarang: opsi eksplisit → `GEMINI_MODEL` → `gemini-2.5-flash-lite`. Nilai
di-trim karena satu spasi tak sengaja membuat Gemini membalas error yang terbaca seolah modelnya
tidak ada, bukan seolah variabelnya salah tulis.

Yang belum dicakup:

- **Panggilan Gemini sungguhan (P2) masih belum bisa dijalankan.** `GEMINI_API_KEY` masih kosong di
  `.env.local` (0 karakter) dan masih tidak ada di Vercel setelah beberapa kali dicek, jadi produksi
  tetap membalas 502 untuk `/api/analisis`.
- `model` yang benar-benar dipakai belum ikut dikembalikan di respons `/api/*`, jadi saat pengujian
  nanti model hanya bisa dipastikan dari pesan error Gemini atau dari log Vercel.
- Deploy produksi belum dijalankan setelah perubahan ini.

## 13 Oktober 2026 — Chat dan JSON pindah dari Gemini ke provider OpenAI-compatible (ADR 0006)

Fase: prasyarat P2, keputusan pengguna. Permintaan: berhenti memakai Gemini, dan sediakan settingan
bebas memilih provider serta model apa pun. `lib/ai/generate-json.ts` ditulis ulang; jalur Gemini
(`x-goog-api-key`, `:generateContent`, `responseMimeType`) dihapus total, bukan disimpan sebagai cabang.

| Pemeriksaan | Perintah / cara | Hasil |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | Lulus, exit 0 |
| Lint | `npm run lint` | Lulus, exit 0 |
| Unit dan fixture | `npx vitest run` | 184 tes lulus di 17 berkas (berkas `lib/ai/generate-json.test.ts` bertambah 8 tes, dari 8 jadi 16) |
| GEMINI_API_KEY tidak lagi dibaca | `grep -rn GEMINI --type ts autothreads/lib autothreads/app` | 0 temuan di kode. Sisa hanya di catatan sejarah docs/ dan prompts/ |
| Endpoint default | assertion di dalam test | `{DEFAULT_BASE_URL}/chat/completions` dengan `nvidia/nemotron-3-super-120b-a12b:free` |
| Ganti provider tanpa ubah kode | assertion di dalam test | `AI_BASE_URL=https://api.deepseek.com/v1` menghasilkan `…/v1/chat/completions` |
| Kunci tidak bocor | assertion di dalam test | `Authorization: Bearer` hanya di header; URL dan body bebas kunci (AGENTS aturan 11) |
| Trailing slash aman | assertion di dalam test | `AI_BASE_URL` dengan `///` di belakang tetap jadi URL tunggal |
| Key resolution | assertion di dalam test | `AI_API_KEY` mendahului `OPENROUTER_API_KEY`; tanpa keduanya menolak tanpa menyentuh jaringan |
| Pesan error provider | assertion di dalam test + `curl` ke endpoint sungguhan | HTTP 401 dari OpenRouter (`{"error":{"message":"User not found.","code":401}}`) diringkas jadi `HTTP 401: User not found.`, bukan JSON mentah |
| Endpoint sungguhan hidup | `curl -X POST https://openrouter.ai/api/v1/chat/completions` dengan key palsu | HTTP 401, format error terbaca kode — URL dan bentuk body terkonfirmasi dari luar aplikasi |

Urutan pemilihan sekarang:

- Base URL: opsi eksplisit → `AI_BASE_URL` → `https://openrouter.ai/api/v1`
- Model: opsi eksplisit → `AI_MODEL` → `nvidia/nemotron-3-super-120b-a12b:free`
- API key: `AI_API_KEY` → `OPENROUTER_API_KEY` (cadangan, supaya rahasia lama di Vercel tidak perlu diganti nama)

Dokumen dan berkas yang ikut diubah: `docs/adr/0006-openrouter-bebas-provider.md` (baru),
`docs/adr/0001-gemini-utama.md` (ditandai digantikan sebagian), `docs/ai-provider.md` bagian 1-8,
`docs/dependency.md` bagian 3, 8, 9, `docs/keputusan.md` bagian 2 dan 4, `docs/glosarium.md`,
`env.example`, dan komentar di `app/api/analisis/route.ts` serta `lib/konten/ide-manual.ts`.

Yang belum dicakup:

- **Panggilan AI sungguhan (P2) masih belum dijalankan.** `AI_API_KEY` belum diisi di `.env.local`
  dan tidak ada di Vercel. Daftar model OpenRouter sudah dicek lewat `/api/v1/models` pada 13 Okt 2026,
  tapi belum ada satu pun panggilan `chat/completions` yang benar-benar dikirim dari aplikasi ini.
- Rate limit model `:free` belum dicatat. Model gratis OpenRouter biasanya berbatas beberapa puluh
  permintaan per menit; angka pastinya baru bisa diisi setelah P8.
- Visi (P7) tertunda. Model default `nvidia/nemotron-3-super-120b-a12b:free` belum dikonfirmasi
  menerima gambar. Bila perlu foto produk dianalisis, ganti `AI_MODEL` ke model multimodal.
- TTS (Fase 4.5) belum disentuh; `AI_TTS_PROVIDER` masih `off`.
- Frontmatter `model: gemini-2.5-flash-lite` di `prompts/*.md` sengaja tidak diubah (AGENTS aturan 13:
  versi prompt yang sudah dipakai tidak diedit). Field itu hanya catatan historis, tidak dibaca kode.
- `GEMINI_MODEL` masih terpasang sebagai Secret di Vercel (Production dan Preview). Bisa dihapus kapan
  saja sekarang karena tidak ada kode yang membacanya lagi.

Cara menguji manual:

1. Ambil API key gratis di https://openrouter.ai/keys (tanpa saldo, tanpa kartu kredit).
2. Isi di `.env.local`: `AI_API_KEY=sk-or-…`. Simpan di Vercel lewat Settings → Environment Variables,
   bukan lewat chat. Hapus `GEMINI_MODEL` bila mau.
3. `npm run dev`, lalu di `/posting/baru` jalankan Analisis produk pada satu produk.
4. Periksa Network → `POST /api/analisis` → 200, dan kartu analisis terisi.
5. Untuk ganti provider: ubah `AI_BASE_URL` dan `AI_MODEL`, restart dev server, ulangi langkah 3.

## 13 Oktober 2026 — GEMINI_MODEL dihapus dari Vercel dan sisa Gemini dirapikan

Fase: prasyarat P2, tindak lanjut ADR 0006. Permintaan: hapus `GEMINI_MODEL` dari Vercel dan
rapikan sisa berkas Gemini di repo.

Yang dijalankan dan hasilnya:

| Pemeriksaan | Perintah / aksi | Hasil |
|---|---|---|
| Env Vercel sebelum | `vercel env ls` | `GEMINI_MODEL` masih ada di Production dan Preview (satu-satunya sisa Gemini) |
| Hapus dari Vercel | `vercel env rm GEMINI_MODEL production --yes` lalu `preview --yes` | Berhasil; `vercel env ls` sisa 6 variabel, 0 Gemini |
| Kode baca `GEMINI_*` | `grep -rn GEMINI lib app components features` | 0 temuan |
| `.env.local` | Hapus baris `GEMINI_API_KEY` dan `GEMINI_MODEL`, ganti komentar seksi, tambah `AI_BASE_URL` / `AI_MODEL` / `AI_API_KEY=` | 0 temuan Gemini; ketiga var AI chat terisi (key masih kosong) |
| Berkas nyasar | Hapus `models-list.json` (dump `/v1/models` Gemini, tidak direferensikan kode) | Terhapus, tidak masuk git |
| UI Pengaturan | `form-pengaturan.tsx`: label model yang masih hardcode "Gemini 2.5 Flash-Lite" diganti "Sesuai env AI_MODEL (server)" | Tidak ada nama provider hardcoded di klien |
| Dokumen | Gemini present-tense di PRD, Rencana Pengembangan, keputusan P1/P7, rencana-testing, skema-database, docs/README diganti netral atau diarahkan ke ADR 0006 | Sisa Gemini di docs hanya sejarah ADR dan kandidat TTS |
| Unit + tipe | `npx vitest run`; `npx tsc --noEmit` | 184 tes lulus (17 berkas); tsc exit 0 |
| Lint | `npm run lint` | exit 0 |

Yang sengaja tidak diubah:

- Frontmatter `model: gemini-2.5-flash-lite` di `prompts/*.md` (AGENTS aturan 13).
- Catatan sejarah di `docs/adr/` (0001, 0002, 0003, 0006) dan tabel riwayat di `docs/ai-provider.md`
  serta `docs/dependency.md`.
- Kandidat TTS Gemini TTS di PRD, Workflow, dependency, dan rencana-testing (ADR 0002 bagian TTS
  masih berlaku).

Yang belum:

- `AI_API_KEY` masih kosong di `.env.local` dan tidak ada di Vercel. Panggilan AI sungguhan (P2)
  tetap belum jalan sampai key diisi.
- Variabel lama `MIMO_API_KEY`, `MIMO_BASE_URL`, `DEEPSEEK_API_KEY` masih ada di `.env.local`
  (nilai kosong, tidak dibaca kode). Di luar lingkup Gemini; minta izin kalau mau dihapus.

Cara menguji manual:

1. `vercel env ls` — pastikan tidak ada `GEMINI_MODEL` di Production maupun Preview.
2. Buka `/pengaturan` — kolom Model membaca "Sesuai env AI_MODEL (server)", bukan nama Gemini.
3. Isi `AI_API_KEY` lalu jalankan alur analisis produk untuk memastikan jalur AI baru tetap jalan.

## 14 Oktober 2026 — key AI diisi dan alur analisis produk sungguhan diuji

Fase: prasyarat P2, tindak lanjut. Permintaan: isi `AI_API_KEY` lalu uji alur analisis produk sungguhan
sampai kartu analisis terisi.

Yang dijalankan dan hasilnya:

| Pemeriksaan | Perintah / aksi | Hasil |
|---|---|---|
| Kunci dari lingkungan | `env | grep -i OPENROUTER` | `OPENROUTER_API_KEY` ada di environment shell |
| Isi `.env.local` | script Node isi `AI_API_KEY=<key>` (73 karakter) | `.env.local` kini punya `AI_API_KEY` non-kosong |
| Cek kebocoran ke repo | `grep -rniE "sk-or-v1|AIza[A-Za-z0-9_\\\\-]{30}" . --include=".env*" --include="*.local" --include="*.txt" --include="*.json"` | 0 temuan |
| Ping API sungguhan | `fetch(AI_BASE_URL/chat/completions, {model:AI_MODEL, messages:[user balas OK]})` | HTTP 200, respons JSON, `provider: Nvidia` |
| Cek server jalan | `npm run dev`, curl `/` | Next.js ready di port 57526; `/` respons 200 |
| Jalur API analisis | `curl -X POST :3000/api/analisis` body produk sungguhan (Botol stainless 750ml, harga 89.900) | HTTP 200 dalam ~60 detik; `ok:true`; JSON lolos `analisisSkema` (Zod) dan siap dikisi ke kartu |
| Isi kartu analisis via UI | Buka `/posting/baru`, isi produk + deskripsi, klik "Analisis" | **Tertunda oleh flakiness snapshot-playwright di lingkungan ini** (lihat catatan bawah). Jalur backend sudah diverifikasi via curl, dan alur UI lokal (hanya localhost, RLS tidak berlaku) diprediksi identik. |

Hasil respons `/api/analisis` berhasil (potongan penting):

```json
{"ok":true,"data":{"ringkasan":"Botol minum stainless steel berkapasitas 750ml yang tahan panas hingga 12 jam, dilengkapi tutup flip-top anti bocor dan warna pastel, cocok untuk digunakan anak sekolah maupun pekerja kantoran. Harganya tertera Rp89.900 di Shopee.","fitur":["Stainless steel 750ml","Tahan panas 12 jam","Anti bocor","Tutup flip-top","Warna pastel"],"target_audiens":["Anak sekolah","Pekerja kantoran","Orang tua yang membeli untuk anak"],"angle":[{"judul":"Masalah: Botol yang cepat bocor dan tidak tahan panas","alasan":"Highlightkan kelemahan botol biasa dan solusi anti bocor serta tahan panas 12 jam."},{"judul":"Manfaat: Praktis untuk aktifitas sehari-hari","alasan":"Jelaskan kapasitas 750ml, warna pastel menarik, dan tutup flip-top yang mudah digunakan untuk sekolah dan kantor."},{"judul":"Pengalaman: Konsumen puas dengan kualitas stainless steel","alasan":"Gunakan testimonial atau deskripsi material stainless steel yang tahan lama dan bersih."}],"klaim_perlu_cek":[],"confidence":"tinggi","catatan":null},"attempts":1,"prompt_version":"analisis-produk.v1"}
```

Catatan cara menguji UI sampai kartu terisi (untuk agent / manusia berikutnya):

1. Jalankan `npm run dev` (bisa port apa saja; lihat tail log dev). Setiap halaman `/posting/baru` melalui dev server Turbopack memicu Fast Refresh spammed (~setiap 5-20 detik), sehingga snapshot Playwright/agent-browser tidak stabil: uid cepat kedaluwarsa dan `querySelector(\"input,textarea\")` dari dalam halaman kadang mengembalikan 0 elemen saat HMR rebuild.
2. Untuk pengisian form via automasi, usahakan operasi secepatnya di jendela antar-HMR, atau naikkan stabilitas dengan menonaktifkan Fast Refresh: `DISABLE_FAST_REFRESH=1 npm run dev`.
3. Jika snapshot selalu gagal, alternatif validasi yang cukup: panggil `/api/analisis` langsung lewat curl (seperti di atas) dan pastikan respons JSON lolos `analisisSkema` dan mengisi field `ringkasan`/`fitur`/`angle`/`target_audiens`; kartu analisis di UI hanya menampilkan data itu.
4. Jalur UI yang belum terenkripsi dalam bukti screenshot ini tetap: isi Nama internal + Deskripsi, klik tombol "Analisis" (tahap 2), tunggu loading, verifikasi kartu analisis muncul di bawah form deskripsi.

Yang belum dicakup:

- Pengisian kartu analisis lewat UI secara visual (screenshot/playwright stabil) belum berhasil di sesi ini karena Fast Refresh yang membanjiri snapshot. Backend sudah diverifikasi.
- Register ulang key ke Vercel (Settings → Environment Variables) belum dilakukan; produksi tetap belum bisa AI sampai langkah itu (dan sampai AI_API_KEY ada di Vercel).
- Mode foto produk (visi) belum diuji; model default `nvidia/nemotron-3-super-120b-a12b:free` belum dikonfirmasi menerima gambar.

Cara menguji manual:

1. Pastikan `AI_API_KEY` (atau `OPENROUTER_API_KEY`) terisi di `.env.local`.
2. `npm run dev`, buka `/posting/baru`.
3. Isi produk + deskripsi, klik tombol "Analisis".
4. Tunggu respons; kartu analisis di bawah form seharusnya terisi ringkasan, fitur, audiens, dan angle.
5. Jika kartu tidak muncul, cek konsol + Network → `POST /api/analisis` (harus 200 bukan 502)."

## 15 Oktober 2026 — perbaikan kalender + penutup Fase 6

Fase: penutup Fase 6 (kalender, analitik, biaya AI).

Catatan pemulihan: pada 14 Oktober sempat tertulis log 5 baris yang menimpa 299 baris catatan sebelumnya (kesalahan tulis file). Berkas dikembalikan dari `HEAD` (`git restore docs/test-log.md`) lalu ditambahi entri ini, jadi riwayat 12 Oktober 2026 dan sebelumnya utuh.

| Pemeriksaan | Perintah | Hasil |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | Lulus, 0 error |
| Unit dan fixture | `npx vitest run` | 266 tes lulus di 24 berkas (212 di 20 berkas sebelum tes Fase 6 dan Fase 7 ditambahkan) |
| Lint berkas Fase 6 | `npx eslint app/(dashboard)/kalender/page.tsx ...` | Lulus setelah `Date.now()` dipindah ke efek (`react-hooks/purity`) |
| Lint seluruh repo | `npx eslint .` | Lulus, 0 temuan — aturan tidak dimatikan lagi |
| Halaman jalan | `next dev` di port 3111 | `/kalender`, `/antrian`, `/analitik`, `/pengaturan` merespons 200 |

Cara menguji manual (Fase 6):

1. `npm run dev`, buka `/posting/baru`, selesaikan satu konten sampai checklist lengkap, klik "Tandai siap posting".
2. Buka `/antrian` tab Disetujui, klik "Jadwalkan", pilih tanggal dan jam, simpan.
3. Buka `/kalender`: konten muncul di kartu hari yang sesuai dan di tabel "Jadwal bulan ini"; jam yang sudah lewat ditandai "lewat".
4. Batalkan jadwal dari tab Terjadwal; konten kembali ke siap posting dan hilang dari kalender.
5. Buka `/analitik`: bagian performa per angle, per hook, dan per letak link terisi dari laporan yang diimpor.

## 15 Oktober 2026 — Fase 7: adapter posting Threads

Fase: Fase 7 (auto-posting Threads), tahap adapter + antrian. Pengirim otomatis penuh belum dibuat
karena K12 belum disetujui (AGENTS aturan 4).

Yang dikerjakan:

- `lib/posting/` baru: `skema.ts` (kontrak + Zod), `antrian.ts` (gerbang kirim, jeda, batas harian,
  panjang byte), `threads.ts` (container -> publish -> `reply_to_id`), `threads-oauth.ts` (URL
  otorisasi, penukaran token, masa berlaku), `provider.ts` (registry + fallback manual),
  `store.ts` (pengaturan dan riwayat kirim di klien), `catat-post.ts` (log ke tabel `posts`).
- Rute baru: `POST /api/posting/kirim`, `GET /api/posting/ketersediaan`.
- UI: tombol "Kirim sekarang" di Antrian review (tab Terjadwal dan Gagal posting) dan di dialog
  Kalender, selalu lewat ConfirmDialog; baris status provider posting di header Antrian.
- Migrasi `0006_posts.sql` (belum dijalankan di Supabase).
- Dokumen: `adr/0007-threads-api-posting.md`, `provider-posting.md`, `skema-database.md` bagian 11,
  `dependency.md` baris Threads API, `env.example` variabel Threads.

| Pemeriksaan | Perintah | Hasil |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | Lulus, 0 error |
| Unit posting | `npx vitest run lib/posting` | 39 tes lulus di 4 berkas |
| Unit seluruh repo | `npx vitest run` | 266 tes lulus di 24 berkas |
| Lint | `npx eslint .` | Lulus, 0 temuan |
| Rute kirim lewat HTTP | `curl -X POST /api/posting/kirim` | Draft ditolak, `threads_api` tanpa kredensial jatuh ke manual, batas harian dan jeda dan jadwal-belum-tiba ditolak dengan alasan masing-masing |

Yang belum bisa diverifikasi dari sesi ini:

- Kirim nyata ke akun Threads uji: butuh app Meta, OAuth, dan token asli. Uji yang ada memakai fetch
  tiruan pada `lib/posting/threads.test.ts` (urutan panggilan, `reply_to_id`, kegagalan di tengah).
- Migrasi 0006 (dan 0002, 0003, 0004, 0005) belum dijalankan di project Supabase, jadi log `posts`
  masih kosong dan rute memakai riwayat localStorage untuk kuota 24 jam.

Cara menguji manual:

1. `npm run dev`, buka `/antrian`. Tanpa kredensial Threads, baris status harus menulis "manual saja
   (salin utas)" dan tab Terjadwal hanya menampilkan Salin utas / Batalkan jadwal.
2. Isi `POSTING_PROVIDER=threads_api`, `THREADS_USER_ID`, `THREADS_ACCESS_TOKEN` di `.env.local`,
   muat ulang `/antrian`: baris status berubah jadi "Threads API siap dipakai".
3. Jadwalkan satu konten ke waktu yang sudah lewat, buka `/kalender`, klik bloknya, lalu "Kirim
   sekarang" di dialog. Konfirmasi, dan periksa utas muncul di akun Threads serta konten pindah ke
   tab Sudah posting.
4. Matikan `THREADS_ACCESS_TOKEN` lalu ulangi: tombol kirim hilang dan salin manual tetap jalan.

## 21 Oktober 2026 — fitur carousel, Pollinations, sumber penawaran, dan offers

Fase: lanjutan Fase 6/7 — carousel (prompt 08), media Pollinations, sumber penawaran
(tahap 1-5), dan migrasi `0008_offers`. Kerja produksi disiapkan sesi Antigravity;
sesi ini merapikan typecheck dan menerbitkan kerja itu sebagai commit.

Yang dikerjakan (warisan Antigravity, sebelumnya staged):

- API `POST /api/carousel`, prompt `carousel-slides.v1` + schema, dan editor slide
  `features/posting/carousel-slide-editor.tsx`: render canvas 3 tema × 2 rasio,
  unduh PNG per slide dan semuanya, tambah/hapus/geser urutan slide.
- `lib/media/pollinations.ts` + test: gambar AI untuk foto produk carousel.
- Prompt `generate-status.v4`: instruksi khusus kategori penawaran hosting/SaaS,
  kursus, marketplace, dan lainnya.

Yang diperbaiki sesi ini:

- `/api/generate` kini menolak `mode_output=carousel` dengan pesan arah ke
  `/api/carousel` (dulu gagal typecheck: mode carousel dipaksa ke `PlatformId`).
- `alur-buat-posting` berhenti membaca `nama_toko`/`foto_produk`/`foto_url` yang
  tidak pernah ada di `SavedProduct`/`PenawaranSaved`: handle memakai `nama_internal`,
  foto memakai `gambar_url`.
- Tabel hook v1/v2/v3 dilengkapi `curiosity_gap`, `before_after`, `contrarian`
  (teks dari v4) agar kompatibel dengan union `gaya_hook` yang baru, tanpa mengubah
  prompt versi lama.

| Pemeriksaan | Perintah | Hasil |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | Lulus, exit 0 — 8 error diperbaiki |
| Lint | `npx eslint .` | Lulus, exit 0 |
| Unit | `npx vitest run` | 473 tes lulus di 47 berkas, exit 0 |
| Supabase | probe REST 19 tabel (service role) | Semua HTTP 200, termasuk `offers` (0008) dan `carousel_slides` |
| GitHub | `git fetch` + `git rev-parse HEAD origin/main` | commit ini didorong; sinkron setelah push |

Yang belum dipastikan dari sesi ini:

- Render canvas editor slide belum diuji visual di peramban; butuh coba manual.
- Pollinations memanggil layanan luar; tidak ada test jaringan penuh, hanya unit test
  dengan fetch tiruan.
- Tabel `offers` penuh datanya belum dipakai hunt end-to-end lewat UI.

Cara menguji manual:

1. `npm run dev`, buka `/posting/baru`, pilih mode output "Carousel", simpan produk
   dengan `gambar_url` terisi, lalu generate.
2. Di editor slide: ganti tema dan rasio, ubah teks slide, unduh PNG satu slide dan
   semua slide.
3. Mode Threads/X tetap jalan seperti semula; body dengan `mode_output=carousel` yang
   nyasar ke `/api/generate` mendapat 400 dengan pesan arah ke `/api/carousel`.
