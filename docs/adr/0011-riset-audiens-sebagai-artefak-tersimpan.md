# ADR 0011: Riset audiens dan peluang produk sebagai artefak tersimpan (tahap 1-2)

Tanggal: 5 November 2026. Status: diterima.

## Konteks

Alur konten affiliate selama ini dijalankan sebagai tujuh percakapan ChatGPT terpisah
(audience problem finder, product opportunity finder, angle, hook, soft selling,
optimizer, roadmap). Hasil tiap tahap disalin manual ke tahap berikutnya, sehingga tidak
ada jejak mana produk yang lahir dari masalah audiens mana.

Di aplikasi, rantai data dimulai dari `products`: `idea_batches.product_id` bersifat
`not null` di migrasi 0001. Artinya ide hanya bisa dibuat setelah produk ada, padahal
alur yang dipakai bergerak sebaliknya — pilih niche dan audiens dulu, baru cari produk.

## Keputusan

1. **Dua artefak baru, tersimpan per user.** `audience_riset` (10 masalah audiens,
   `masalah` sebagai jsonb) dan `peluang_produk` (20 kategori, anak dari satu riset).
   Migrasi `0010_riset_audiens.sql`, keduanya dengan RLS `(select auth.uid()) = user_id`.
2. **Dua rute, bukan satu.** `POST /api/audience` menyimpan riset; `POST
   /api/audience/peluang` membaca riset dari database lalu menyimpan 20 kategori.
   Pemisahan ini menjaga tahap 1 tetap tersimpan saat tahap 2 gagal atau anggaran AI
   habis, dan memungkinkan penyusunan ulang peluang tanpa membayar ulang riset.
3. **Niche punya default, bukan dikunci.** Form memakai "Rumah tangga & perlengkapan
   dapur" sebagai nilai awal yang bisa diubah, supaya 30 konten pertama konsisten tanpa
   menghalangi niche lain di kemudian hari.
4. **Kategori belum menjadi produk.** `peluang_produk` hanya menyimpan kategori, alasan,
   dan contoh generik. Baris `products` baru dibuat saat user menekan "Buat produk";
   harga dan tautan tetap diisi user (AGENTS rule 5).
5. **Tahap yang belum dibangun tidak ikut di migrasi ini.** `hooks`, `content_reviews`,
   kolom `ideas.kategori_angle`, dan pelonggaran `idea_batches.product_id` menunggu
   Tahap B/C. Migrasi 0010 sengaja hanya berisi tabel yang langsung dipakai.
6. **`generations.jenis` dibangun ulang dari daftar penuh.** Nilai baru: `audience`,
   `peluang`, dan `carousel` (yang selama ini hilang sehingga biaya carousel tidak
   tercatat).
7. **Google Sheets lewat CSV, bukan koneksi.** `riset.csv` dan `peluang.csv` dihasilkan
   dari data tersimpan; tidak ada impor untuk dua tahap ini.

## Alternatif yang ditolak

- **Melonggarkan `idea_batches.product_id` sekarang.** Perubahan itu baru berguna saat
  tahap 3 (`ide-konten.v3`) menerima `riset_id`. Melakukannya lebih awal berarti migrasi
  setengah jadi yang tidak dipakai kode mana pun.
- **Satu rute yang menjalankan dua prompt sekaligus.** Kalau prompt kedua gagal, user
  harus membayar ulang prompt pertama atau kehilangan hasilnya. Dua rute lebih jujur
  soal biaya dan status.
- **Menyimpan kategori langsung sebagai `products`.** Akan memenuhi tabel produk dengan
  baris tanpa harga dan tautan, dan menyamarkan bahwa pemilihan produk adalah keputusan
  user.
- **Menambah parameter kerangka penulisan (PSC, AIDA, PAS, BAB, HBSC) di sini.**
  Kerangka mengubah prompt 03 dan `contents.pengaturan`, bukan hulu pipeline. Belum ada
  di kode dan perlu ADR sendiri beserta versi prompt baru.

## Konsekuensi

- Halaman `/riset` adalah pintu masuk pipeline; ide tanpa produk (tahap 3) menyusul di
  Tahap B setelah `idea_batches` dilonggarkan.
- Menjalankan ulang peluang mereset tanda `dipilih`/`produk_id`, tetapi tidak menghapus
  produk yang sudah dibuat.
- Semua hasil AI tetap draft dan divalidasi Zod: tepat 10 masalah, tepat 20 kategori.
  Jawaban yang tidak sesuai jumlah di-retry sekali lalu dilaporkan gagal.
