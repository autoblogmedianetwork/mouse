# ADR 0005: Atribusi komisi ke konten lewat kode pelacak (sub_id)

Status: diterima
Tanggal: 11 Oktober 2026
Terkait: ADR 0004 (impor laporan affiliate), PRD F5 dan F3a, Workflow bagian 3 tahap 10

## Konteks

Setelah impor laporan affiliate berjalan (ADR 0004), dashboard bisa menjawab "produk mana yang laku"
dan "marketplace mana yang paling menghasilkan". Pertanyaan yang paling berguna untuk keputusan
konten berikutnya belum terjawab: **utas mana yang menghasilkan komisi itu**.

Baris laporan sudah membawa `sub_id` (kolom Sub_id Shopee, Creator TikTok Shop, kanal Tokopedia),
dan tabel `contents` sudah punya `ide_judul` (angle yang dipilih di F2) serta `klik_manual`. Yang
hilang hanya penghubung antara laporan dan konten: konten belum punya kode yang dikenal marketplace.

## Keputusan

1. **Kode pelacak per konten.** Setiap konten mendapat kode `at-xxxxxx` yang dihitung dari id konten
   (`subIdDefault` di `lib/performa/atribusi.ts`). Kodenya deterministik, bukan acak: konten dan
   laporan lama tetap cocok walau aplikasi dimuat ulang, dan tidak ada migrasi data saat fitur ini
   aktif. Kode ditampilkan di Pustaka konten dengan tombol salin.
2. **Pemetaan manual untuk kode lama.** User bisa menautkan `sub_id` apa pun (misalnya `threads-01`
   yang sudah dipakai sebelumnya) ke konten. Pemetaan user menimpa kode bawaan, sehingga tidak ada
   link lama yang perlu diubah.
3. **Sumber perhitungan tunggal.** Semua angka atribusi dihitung fungsi murni di
   `lib/performa/atribusi.ts`: komisi, komisi cair, pesanan, klik, komisi per klik, konversi, dan
   pengelompokan per angle. Dashboard dan halaman Analitik memakai hasil yang sama.
4. **Klik: impor menang, manual cadangan.** Klik dari laporan marketplace dipakai bila ada; kalau
   laporan tidak memuat klik, angka `klik_manual` konten yang dipakai. Keduanya **tidak
   dijumlahkan**, supaya konversi tidak membengkak.
5. **Angka tidak bohong.** Konten dengan komisi nol tetap ditampilkan; baris laporan yang tidak
   punya `sub_id` dilaporkan terpisah dan tidak "dibagikan" ke konten mana pun; `sub_id` yang belum
   dikenali muncul di daftar pemetaan, bukan dibuang diam-diam. Baris berstatus batal tetap masuk
   perhitungan komisi (nilainya negatif) tetapi **tidak** dihitung sebagai pesanan, baik di ringkasan
   `lib/impor/performa.ts` maupun di atribusi, sehingga kata "pesanan" berarti hal yang sama di
   semua tampilan dan jumlah per konten cocok dengan angka total. Jumlahnya tetap bisa dilihat
   terpisah lewat `pesanan_batal` dan catatan "N batal" di kartu Total komisi.
6. **Baris klik dipisahkan dari baris penjualan.** Ekspor analitik marketplace sering hanya memuat
   klik tanpa komisi. Baris seperti itu diberi `jenis = 'klik'`, dihitung untuk klik saja, dan tidak
   menambah komisi, GMV, pesanan, produk unik, atau tren bulanan (melengkapi ADR 0004).
7. **Penyimpanan.** Peta `sub_id → konten` disimpan di localStorage (`autothreads-atribusi`) dengan
   bentuk sejajar calon kolom `affiliate_links.sub_id` (lihat `skema-database.md` bagian 8).

## Konsekuensi

- Dashboard kini bisa menampilkan "konten paling menghasilkan", dan Analitik menampilkan tabel
  per konten serta per angle beserta konversi klik ke pesanan.
- Fitur ini baru memberi hasil setelah user memasang kode pelacak di link affiliate. Karena itu
  kode ditampilkan di Pustaka konten dan petunjuk pemasangannya ada di halaman Analitik.
- Angka konversi bergantung pada ketersediaan kolom klik di laporan. Bila tidak ada, konversi
  dihitung dari klik manual, dan baris itu ditandai "(manual)" di tabel.
- Atribusi belum memakai data klik/impresi platform lain (misalnya Threads Insights) dan belum
  menangani satu konten yang diposting ke beberapa platform dengan kode berbeda; saat multi-platform
  aktif, satu konten boleh punya beberapa kode.
- Sampai Supabase aktif, peta ini hanya ada di peramban tempat user memasangnya.
