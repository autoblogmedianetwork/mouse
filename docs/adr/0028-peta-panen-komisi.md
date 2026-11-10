# ADR 0028: Peta panen komisi dari jam pesanan yang ikut diimpor

Status: diterima
Tanggal: 2026-11-10

## Konteks

Laporan marketplace yang diimpor lewat `/impor` sudah memuat waktu pesanan pada
banyak ekspor (Shopee "Waktu Pesanan Dibuat", TikTok "Order Created Time"), tetapi
`parseTanggal()` hanya menyimpan bagian tanggalnya. Akibatnya pertanyaan "hari apa
dan jam berapa link saya dipanen" tidak bisa dijawab meski datanya sebenarnya ada
di berkas yang diunggah user.

Peta panen komisi (docs/status-ide.md bagian 3.1) butuh dua dimensi: hari dan jam.
Dua kendala nyata:

1. **Tidak semua laporan punya jam.** Laporan ringkasan produk kadang hanya berisi
   tanggal, dan membulatkan itu menjadi jam 00.00 akan mengarang pola yang tidak ada.
2. **Data performa masih di localStorage.** Tabel `performa_rows` belum dijalankan di
   Supabase, jadi perubahan bentuk baris masih murah — tetapi harus tetap sejajar
   dengan migrasi supaya pemindahan nanti tidak mendesain ulang.

## Keputusan

1. **`jam` menjadi field opsional pada baris performa** (`lib/impor/skema.ts`,
   `0–23`, default `null`). `parseJam()` di `lib/impor/normalisasi.ts` mengisinya
   hanya bila nilai tanggal juga memuat waktu; tanpa jam hasilnya `null`, bukan 0.
2. **Jam dibaca saat impor, bukan dihitung ulang di UI.** Satu sumber kebenaran,
   dan baris lama tanpa `jam` tetap sah lewat default Zod.
3. **Grid 7 × 6 blok (4 jam per blok), Senin lebih dulu.** 168 sel (7 × 24) terlalu
   jarang terisi untuk data affiliate rumahan; blok 4 jam cukup untuk menjawab
   "pagi/siang/sore/malam" tanpa kehilangan pola.
4. **Komisi cair yang diwarnai**, dengan pesanan dan klik di tooltip. Pesanan batal
   tidak boleh membuat satu blok terlihat ramai.
5. **Baris tanpa tanggal dihitung terpisah dan ditampilkan** (`tanpa_tanggal`),
   bukan dibuang diam-diam.
6. **Kolom `jam` ditambahkan ke `0003_performa_affiliate.sql`**, bukan migrasi baru,
   karena file itu belum pernah dijalankan di project mana pun. Begitu 0003
   dijalankan, perubahan skema berikutnya wajib lewat migrasi baru.

## Alasan

- Menyimpan jam di baris membuat agregasi tetap murni dan bisa diuji
  (`lib/performa/peta-panen.ts`), tanpa perlu membaca ulang berkas asli.
- `null` untuk "tidak diketahui" mencegah kesimpulan palsu seperti "jam 00.00 paling
  menghasilkan" yang sebenarnya hanya efek tanggal-saja.
- Blok 4 jam menjaga tabel tetap terbaca di layar 360 px tanpa scroll horizontal
  yang panjang, dan tetap bermakna saat data masih puluhan baris.

## Konsekuensi

- `xlsx.ts` sekarang menulis pecahan hari sebagai `YYYY-MM-DD HH:MM` untuk sel
  berformat tanggal-waktu; sel tanggal-saja tetap `YYYY-MM-DD`.
- Peta hanya muncul setelah ada baris bertanggal; tanpa jam ia jatuh ke tampilan
  per hari dan menjelaskan alasannya di UI.
- Bila nanti agregasi dipindah ke SQL, `performa_rows.jam` sudah tersedia; query
  pengelompokan mengikuti blok yang sama (`floor(jam / 4)`).
- Jam mengikuti waktu lokal yang tertulis di laporan, bukan zona waktu peramban.
  Laporan lintas zona waktu tidak dikonversi — itu batas yang diterima untuk
  dashboard pribadi.
