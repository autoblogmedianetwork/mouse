# ADR 0024: Statistik Bank Masalah, Pembangkit Hashtag Lokal, Pengingat Cadangan

Status: diterima
Tanggal: 2026-11-11

## Konteks

Tiga ide dari daftar "aman, tanpa API" belum ada, padahal ketiganya kecil dan
menutup celah kerja harian:
1. Bank masalah audiens menumpuk tetapi tidak ada ringkasan kategori mana yang
   paling sering muncul — padahal itu sumber ide terkuat.
2. Caption butuh hashtag; satu-satunya sumber sekarang adalah AI carousel, jadi
   konten Threads/WA tidak punya cara membuat tagar tanpa memanggil model.
3. Data hanya hidup di localStorage; tidak ada pengingat untuk mengunduh
   cadangan, sehingga kerusakan browser berarti kehilangan seluruh pustaka.

## Keputusan

1. **`lib/riset/statistik-bank.ts`** — `ringkasBank()` mengembalikan total,
   jumlah bulan berjalan, dan kategori terurut. Dashboard menampilkan kartu
   "Bank masalah" dengan tiga kategori teratas. Fungsi murni + unit test.
2. **`lib/konten/hashtag.ts`** — `bangkitkanHashtag({ nama, kategori })`
   menyusun maksimal 10 tagar dari kata produk, kamus kategori, dan tagar umum.
   Setiap tagar disaring ulang lewat `periksaKataTerlarang()` sehingga tagar
   seperti `#terbaik` tidak pernah dihasilkan. Tersedia sebagai bagian 4 di
   `/lab`, dengan tombol salin.
3. **`lib/konten/cadangan.ts` + `PengingatCadangan`** — pengingat muncul di
   dashboard bila belum pernah mencadangkan atau sudah lewat 7 hari. Tombol
   "Unduh cadangan" memakai `eksporJSON(muatKonten())` yang sama dengan ekspor
   manual, lalu mencatat `autothreads-cadangan-terakhir`. Tidak ada sinkronisasi
   server dan tidak ada notifikasi browser — sesuai keputusan "tanpa server".

## Konsekuensi

- Semua fitur tetap lokal, tanpa dependency baru, dan bisa diuji tanpa DOM.
- Hashtag tidak pernah memuat klaim berisiko karena disaring di sumbernya.
- Pengguna punya jalur pengaman data tanpa menambah beban backend.
