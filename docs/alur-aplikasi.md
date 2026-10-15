# Alur Aplikasi Heaviliate

Panduan memakai aplikasi dari awal sampai posting terbit, plus penjelasan
setiap fitur. Untuk aturan teknis per fitur, lihat berkas acuan di tabel
bawah; dokumen ini fokus **alur dan cara kerjanya**, bukan keputusan desain.

## 1. Masuk (Login)

- Halaman `/masuk` memakai **login tautan sekali pakai (magic link)** lewat
  email — tanpa kata sandi.
- Isi email → klik **Kirim tautan login** → buka email → klik tautan →
  aplikasi menukar kode sesi di `/auth/callback` lalu menempatkan Anda ke
  dashboard.
- Sampai semua halaman terhubung Supabase, aplikasi tetap bisa dipakai dari
  penyimpanan peramban (localStorage); login dipakai supaya Bank Konten,
  laporan performa, dan atribusi bisa ikut ke akun Anda nantinya.
- Sudah masuk? Halaman yang sama menampilkan email aktif dan tombol keluar.

## 2. Alur utama: Buat posting (`/posting/baru`)

Lima tahap berurutan, setiap tahap punya checkpoint sendiri (PRD F0):

1. **Produk** — isi produk manual: nama internal, deskripsi produk (boleh
   tempel dari Shopee), varian, harga, link referensi. Ada pula
   **Quick Capture**: bookmarklet yang menangkap halaman produk dan
   membuka form yang sudah terisi.
2. **Analisis** — AI merampa produk (fitur, target audiens, angle, klaim
   yang perlu dicek). Bisa dikoreksi atau ditulis manual bila AI gagal.
3. **Ide** — AI membuat 10 ide konten; pilih satu atau beberapa. Kartu
   **Ide manual** selalu tersedia tanpa AI.
4. **Generate** — atur mode output dan gaya:
   - **Mode output**: Threads (500 karakter), X (280), atau Naskah video
     (3 bagian: hook visual, fungsi produk, CTA, 30–60 detik).
   - Panjang thread, panjang status, gaya hook, persona, letak link
     (status terakhir / balasan / tanpa link), instruksi tambahan,
     **Anti AI Slop**, dan **Aturan kepercayaan** (wajib sebutkekurangan).
5. **Preview & edit** — editor per status dengan penghitung karakter,
   preview kartu Threads, checklist gerbang (semua status valid +
   checklist lengkap), tombol **Salin per status / Salin utas**,
   **Suara narasi** (baca utas), dan **Panduan foto candid**.

Hasil selalu berstatus **draft**. Tecapai **siap posting** hanya lewat
tombol user setelah checklist bersih — tidak pernah otomatis.

## 3. Antrian review (`/antrian`)

Tab status: Perlu review (draft), Disetujui (siap posting), Terjadwal,
Gagal posting, Sudah posting, Ditolak. Di sini:

- **Tandai siap** massal — gerbang checklist diperiksa per konten, tidak
  bisa lompat.
- **Jadwalkan** konten siap posting → pilih tanggal jam → status
  **terjadwal**.
- **Kirim** (Fase 7) berstatus terbijas: mode manual (salin) selalu ada;
  kirim API Threads hanya aktif bila kredensial ada di server, dengan
  jeda antar posting dan batas 20 per 24 jam dijaga aplikasi.
- Duplikat konten untuk mengulang yang sudah sukses.

## 4. Kalender (`/kalender`)

- Tampilan mingguan (Senin–Minggu) + tabel jadwal bulan ini.
- Geser blok ke hari lain, konfirmasi dulu — jam posting tidak bergeser.
- Konten dengan jadwal yang sudah lewat disorot; bisa jadwal ulang atau
  kirim sekarang (dengan konfirmasi). →

## 5. Pengingat (dashboard)

Panel atas dashboard otomatis menampilkan:

- **Jadwal lewat** — konten terjadwal yang waktunya sudah berlalu.
- **Jadwal hari ini** — beserta jamnya.
- **Terjadwal 7 hari ke depan.**
- **Draft terbengkalai** — konten draft/siap posting (di pustaka maupun
  draft di Buat posting) yang ≥ 3 hari tidak diubah.

Tombol **Tutup** menyembunyikan item sampai besok (muncul lagi otomatis),
tombol aksi membuka halaman tujuan. Aturan lengkap:
[fitur-pengingat.md](fitur-pengingat.md).

## 6. Pustaka konten & Riwayat

- **Pustaka** (`/konten`): Bank konten internal — cari, filter status,
  arsip (retensi 90 hari, K3), duplikat, dan **Ekspor JSON** sebagai
  cadangan data.
- **Riwayat** (`/riwayat`): log setiap aksi salin/kirim: waktu, konten, mode,
  status akhir, dengan filter tanggal.

## 7. Analitik & Impor Performa

- **Impor** (`/impor`): unggah CSV komisi affiliate dari Shopee / TikTok
  Shop / Tokopedia — menggantikan pengisian klik & komisi manual satu per
  satu.
- **Analitik** (`/analitik`): ringkasan komisi, GMV, produk terlaris, tren
  bulanan, A/B per gaya hook-angle-letak link, plus **Daftar produk yang
  lama tidak diposting** dengan filter 7/14/30/90 hari sejak kirim
  terakhir (aturan: [daftar-produk-belum-diposting.md](daftar-produk-belum-diposting.md)).

## 8. Link, Template, Pengaturan

- **Link** (`/link`): daftar link affiliate, klik & komisi manual, ringkasan
  klik tertinggi.
- **Template** (`/template`): deskripsi produk dengan placeholder `{{...}}`
  untuk mempercepat pengisian berulang.
- **Pengaturan** (`/pengaturan`): profil, model AI (server-side, API key
  tidak pernah ke klien), batas biaya bulanan, scraping mati default (K5),
  aturan konten bawaan (gaya hook, kekurangan, Anti AI Slop), provider
  posting (manual selalu ada), dan retensi arsip.

## 9. Peta status konten

`draft` → (checklist + gerbang) → `siap_posting` → (jadwalkan) →
`terjadwal` → (kirim, manual/api) → `terkirim` — jalur lainnya:
`gagal` (bisa dicoba lagi), `ditolak`, dan `arsip` (dihapus setelah retensi).

Aturan pendukung: batas 500 karakter Threads (280 untuk mode X) dijaga di
kode dan database; semua output AI = draft; tidak ada `siap_posting`/kirim
tanpa aksi user.

## 10. Berkas acuan

| Dokumen | Isi |
|---|---|
| PRD-Heaviliate.md | Daftar fitur, aturan bisnis |
| UI-Spec-Heaviliate.md | Layout dan komponen |
| Workflow-Heaviliate.md | Alur user dan state |
| Rencana-Pengembangan-Heaviliate.md | Fase & exit criteria |
| fitur-pengingat.md, daftar-produk-belum-diposting.md | Fitur lanjutan |
