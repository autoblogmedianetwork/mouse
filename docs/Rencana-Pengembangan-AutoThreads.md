# Rencana Pengembangan AutoThreads

**Acuan:** `PRD-AutoThreads.md`, `Workflow-AutoThreads.md`, `UI-Spec-AutoThreads.md`, `Template-Video-Affiliate.md`
**Pengembang:** Slamet (satu orang, paruh waktu)
**Status:** rencana, belum mulai coding

---

## 1. Tujuan Rencana

Menghasilkan MVP yang bisa dipakai untuk akun affiliate pribadi: dari input produk manual sampai konten Threads siap salin, dengan draft-first dan checkpoint di setiap tahap. Auto-posting dan analitik masuk setelah MVP stabil.

## 2. Ruang Lingkup

**Masuk MVP (Fase 0 sampai 5):**
- Input produk manual (scraping tetap default mati)
- Analisis produk dan ide konten dengan Gemini 2.5 Flash-Lite
- Generate status Threads dengan validasi 500 karakter
- Preview Threads, checklist sebelum siap posting, salin utas
- Pustaka konten, link affiliate, template deskripsi, pengaturan
- Mode foto ke video (F7.1) sebagai generator prompt, output tetap draft

**Di luar MVP:**
- Auto-posting ke Threads (Fase 7, bergantung akses API)
- Kalender dan analitik (Fase 6)
- Multi-user, paket berbayar, penjualan
- Tracking otomatis dari Shopee

---

## 3. Prasyarat Sebelum Fase 1

Semua item ini harus selesai. Kalau belum, fase berikutnya ditunda.

| No | Prasyarat | Cara verifikasi | Penanggung jawab |
|---|---|---|---|
| P1 | Endpoint, format request, dan harga Gemini 2.5 Flash-Lite | Baca dokumentasi resmi provider, catat di `docs/ai-provider.md` | Slamet |
| P2 | Satu panggilan API uji berhasil dan mengembalikan JSON valid | Script kecil di terminal | Slamet |
| P3 | Akun Supabase dan Vercel dibuat (tier gratis) | Login dan buat project kosong | Slamet |
| P4 | Repository Git dibuat dan terhubung ke Vercel | Push commit pertama | Slamet |
| P5 | Golden set: 10 produk uji dengan deskripsi dan hasil ideal ditulis manual | File `golden/produk-01.json` sampai `produk-10.json` | Slamet |
| P6 | Keputusan terbuka di bagian 4 sudah dijawab | Dicatat di `docs/keputusan.md` | Slamet |
| P7 | Foto produk bisa dikirim ke Gemini 2.5 Flash-Lite lewat API, dan respons JSON-nya valid | Satu panggilan uji dengan gambar | Slamet |
| P8 | Harga dan kuota gratis Gemini (termasuk TTS) sudah dicek di halaman resmi | Catat tanggal pengecekan di `docs/ai-provider.md` | Slamet |
| P9 | Cadangan sudah ditentukan (MiMo atau DeepSeek) dan diuji dengan golden set yang sama | Catatan hasil di `docs/penilaian.md` | Slamet |

---

## 4. Keputusan yang Harus Dijawab Lebih Dulu

| No | Pertanyaan | Dampak kalau belum dijawab | Usulan default |
|---|---|---|---|
| K1 | Apakah preview memakai rasio asli Threads? | Desain preview dan komponen media | Ya, rasio 4:5 untuk foto |
| K2 | Apakah ada tombol "Simpan sebagai template"? | Alur di halaman Buat posting | Ya, di bilah aksi sebagai menu sekunder |
| K3 | Berapa lama konten diarsipkan sebelum dihapus? | Skema data dan job pembersihan | 90 hari, lalu arsip bisa dihapus manual |
| K4 | Metode login? | Setup auth Supabase | Magic link email |
| K5 | Scraping tetap default mati di MVP? | Scope Fase 2 | Ya, scraping ditunda ke Fase 5 atau setelahnya |
| K6 | Batas biaya API per bulan? | Logika kuota dan peringatan | Mulai dari batas keras yang bisa diubah di Pengaturan |
| K7 | Apakah foto produk dianalisis AI? | Model harus mendukung gambar atau tidak | Tunda sampai P1 terverifikasi |

---

## 5. Fase Pengembangan

Setiap fase punya tugas, hasil, dan exit criteria. Fase berikutnya tidak dimulai sebelum exit criteria terpenuhi.

### Fase 0: Persiapan (1 minggu)
**Tugas:** selesaikan prasyarat P1 sampai P6. Siapkan struktur folder dan konvensi kode.
**Hasil:** repo, dokumen keputusan, golden set, satu panggilan API berhasil.
**Exit criteria:**
- Semua prasyarat tercentang.
- Satu produk uji bisa dianalisis lewat script dan menghasilkan JSON valid.

### Fase 1: Fondasi (1 minggu)
**Tugas:**
- Inisialisasi Next.js (App Router, TypeScript), Tailwind, shadcn/ui.
- Komponen `AppShell`: sidebar, topbar, halaman kosong untuk setiap menu.
- Skema database awal (tabel users, products, idea_batches, ideas, generations, contents, threads_statuses, templates) dengan migrasi.
- Auth magic link dan Row Level Security: setiap user hanya melihat datanya.
- Layer provider AI (`lib/ai/`) dengan fungsi `generateJSON(prompt, schema)`.

**Exit criteria:**
- Login berfungsi dan data user lain tidak bisa diakses (diuji dengan dua akun).
- Semua menu sidebar bisa dibuka. Menu "Segera" tidak bisa diklik.
- Layer AI mengembalikan JSON tervalidasi untuk prompt uji.

### Fase 2: Analisis dan Ide (M1, 1 sampai 2 minggu)
**Tugas:**
- Form input produk manual (nama, varian, harga, deskripsi, link).
- Pembersihan deskripsi (hapus link, hashtag spam, emoji berlebihan, teks berulang, potong 3.000 karakter).
- Prompt 1 (analisis) dan Prompt 2 (10 ide) dari PRD bagian 10.
- Validasi JSON dengan skema Zod, satu kali retry, pesan error jika gagal.
- Cache hasil analisis berdasarkan hash deskripsi.
- Tahap "Ringkasan produk" dan "Pilih ide" dengan checkpoint.

**Exit criteria:**
- Dari 10 produk golden set, minimal 9 menghasilkan JSON valid.
- Analisis ulang produk yang sama mengambil dari cache (tidak memanggil API lagi).
- Biaya satu analisis tercatat dan sesuai estimasi.

### Fase 3: Generate, Preview, dan Salin (M2, 1 sampai 2 minggu)
**Tugas:**
- Pengaturan generate (jumlah status, panjang, instruksi, Anti AI Slop, persona, letak link, aturan kepercayaan).
- Prompt 3 untuk status per konten, satu job per ide terpilih, progres per konten.
- Validasi 500 karakter di kode dengan regenerate khusus status yang lewat (maks 2 retry).
- Editor status dengan penghitung karakter dan pemisah otomatis.
- Komponen `ThreadsPreview` (real time dari state form).
- `ChecklistGate` dan label status (draft, siap posting).
- Autosave setiap 10 detik. Simpan draft. Salin utas lengkap.

**Exit criteria:**
- Tidak ada status yang tersimpan lebih dari 500 karakter.
- Konten yang diedit setelah "siap posting" kembali ke draft.
- Salin utas menghasilkan teks yang urutannya benar (diuji dengan tempel ke Threads).
- Golden set: minimal 8 dari 10 hasil lolos penilaian manual (daftar di `docs/penilaian.md`).

### Fase 4: Pustaka, Template, dan Pengaturan (M3, 1 minggu)
**Tugas:**
- Pustaka konten dengan filter, pencarian, duplikat, arsip, dan hapus dengan konfirmasi.
- Link affiliate dengan catatan klik dan komisi manual.
- Template deskripsi dengan placeholder.
- Riwayat dasar (status konten dan waktu).
- Halaman Pengaturan (AI, aturan konten, retensi, scraping mati).
- Ekspor konten ke file teks atau JSON (cadangan data).
- Dashboard dengan kartu ringkasan dan lanjutkan draft.

**Exit criteria:**
- Semua halaman MVP bisa diakses di desktop dan mobile.
- Ekspor dan impor cadangan menghasilkan data yang sama.
- Dashboard menampilkan draft terakhir dengan benar.

### Fase 4.5: Mode Foto ke Video (F7.1, 3 sampai 5 hari)
Bisa dikerjakan setelah Fase 3, tidak wajib untuk M3.

**Tugas:**
- Form upload foto (dari F0) dengan durasi dan rasio default.
- Template prompt tetap dengan kunci produk dan batas VO 25 kata.
- Output prompt final dengan checkpoint konfirmasi.
- Checklist cek hasil video.

**Exit criteria:**
- Prompt final mengandung semua kunci produk dan larangan.
- Tidak ada upload otomatis ke Google Flow.
- Status tetap draft sampai user menandai selesai.

### Fase 5: Pemakaian Pribadi dan Penguatan (2 sampai 3 minggu)
**Tugas:**
- Pakai untuk akun affiliate sendiri, minimal 15 konten.
- Catat setiap kegagalan: JSON invalid, karakter lewat, produk berubah di video, klaim berlebihan.
- Perbaiki prompt dengan versi (catat versi di setiap konten).
- Tambahkan dashboard biaya API bulanan.
- Tambahkan feedback jempol per status untuk menyetel Anti AI Slop.
- Perbaiki hal yang paling sering gagal.

**Exit criteria:**
- Minimal 15 konten dibuat dan 10 di antaranya diposting.
- Biaya rata-rata per konten tercatat dan sesuai estimasi.
- Tidak ada kegagalan validasi yang tidak tertangani.

### Fase 6: Kalender dan Analitik (opsional, setelah Fase 5)
**Tugas:**
- Kalender bulan dan minggu, jadwal untuk konten siap posting (tanpa auto-posting).
- Analitik sederhana dari klik dan komisi manual: performa per angle, per hook, per letak link.

**Exit criteria:**
- Konten terjadwal tampil di kalender dengan benar.
- Analitik bisa menjawab minimal satu pertanyaan: angle mana yang paling banyak klik.

### Fase 7: Auto-posting Threads (M6, opsional, bergantung akses API)
**Syarat masuk:** akses Threads API sudah disetujui dan dokumentasi batas posting sudah dibaca.

**Tugas:**
- Hubungkan akun Threads lewat OAuth, token disimpan di server.
- Antrian posting dengan jeda antar posting dan batas harian.
- Status terkirim, gagal, dan coba lagi.
- Fallback ke mode manual saat API gagal.

**Exit criteria:**
- Posting ke akun uji berhasil dan status tercatat.
- Konten yang belum disetujui tidak pernah terkirim.
- Kegagalan API tidak menghilangkan konten dari pustaka.

---

## 6. Strategi Pengujian

| Jenis | Yang diuji | Kapan |
|---|---|---|
| Unit | Validator 500 karakter, parser JSON, pembersih deskripsi, hash cache | Setiap perubahan logika |
| Skema | Setiap output AI divalidasi dengan Zod | Setiap panggilan |
| Golden set | 10 produk uji, dinilai manual dengan rubrik | Setiap perubahan prompt |
| Integrasi | Alur lengkap: produk, ide, generate, simpan, salin | Setiap akhir fase |
| Keamanan | RLS: user A tidak bisa membaca data user B | Setiap perubahan skema |
| Manual | Checklist UI di tiap halaman, desktop dan mobile | Akhir setiap fase |

**Rubrik golden set (skor 1 sampai 5):** kesesuaian dengan deskripsi, bahasa Indonesia kasual, tidak ada klaim tak terbukti, variasi antarstatus, dan kepatuhan batas karakter.

---

## 7. Definisi Selesai (Definition of Done)

Sebuah fitur dianggap selesai jika:
- Berfungsi di desktop dan mobile sesuai `UI-Spec-AutoThreads.md`.
- Input manual tersedia untuk fitur yang menerima data produk.
- Output AI selalu berstatus draft sampai checkpoint disetujui.
- Ada pesan error yang jelas untuk setiap kegagalan yang mungkin.
- Lolos tes unit dan checklist manual.
- Perubahan prompt tercatat dengan versi dan diuji di golden set.
- Tidak ada API key atau token di kode klien.

---

## 8. Estimasi Waktu dan Biaya

**Waktu:** dengan 10 sampai 15 jam per minggu, MVP (Fase 0 sampai 4) membutuhkan sekitar **8 sampai 10 minggu**. Fase 4.5 menambah sekitar 1 minggu. Fase 5 sekitar 2 hingga 3 minggu, tergantung seberapa sering pemakaian pribadi menemukan masalah.

**Biaya bulanan perkiraan:**
- Supabase, Vercel: gratis (tier gratis, perlu dicek batasnya saat mulai).
- API Gemini 2.5 Flash-Lite: perkiraan di bawah Rp 50 per batch 4 konten, berdasarkan harga Gemini 2.5 Flash-Lite yang ditemukan. Angka pasti harus dicek ulang setelah P1.
- Domain (opsional): sekitar Rp 150.000 per tahun.

Estimasi ini belum memperhitungkan waktu belajar tools baru dan revisi desain.

---

## 9. Risiko dan Mitigasi

| Risiko | Kemungkinan | Dampak | Mitigasi |
|---|---|---|---|
| Format API Gemini tidak sesuai dugaan | Sedang | Fase 2 tertunda | Selesaikan P1 dan P2 sebelum Fase 1, siapkan provider cadangan |
| Output AI sering tidak valid JSON | Tinggi | Alur terputus | Skema ketat, satu retry, prompt diuji di golden set |
| Biaya API lebih tinggi dari perkiraan | Sedang | Anggaran terlampaui | Cache, batas biaya bulanan, dashboard biaya di Fase 5 |
| Akses Threads API lama disetujui | Tinggi | Fase 7 tertunda | Mode manual tetap jadi jalur utama, Fase 7 tidak mengganggu MVP |
| Scope membesar | Tinggi | Tidak pernah selesai | Patuhi batas MVP, fitur baru masuk backlog |
| Waktu paruh waktu tidak konsisten | Sedang | Jadwal mundur | Tetapkan target mingguan kecil, prioritaskan exit criteria |
| Konten terdengar seperti AI generik | Sedang | Konten tidak dipakai | Golden set, feedback jempol, Anti AI Slop |

---

## 10. Backlog Setelah MVP

- Scraping sebagai mode opsional (jika K5 berubah)
- Analisis gambar produk (jika P1 mendukung visual)
- Multi-akun dan tim
- Notifikasi jadwal
- Ekspor ke Google Sheets

---

## 11. Langkah Pertama Minggu Ini

1. Selesaikan P1 dan P2: baca dokumentasi Gemini dan jalankan satu panggilan uji.
2. Jawab K1 sampai K7 dan catat di `docs/keputusan.md`.
3. Buat repo, akun Supabase, dan Vercel (P3, P4).
4. Tulis golden set 10 produk (P5).
