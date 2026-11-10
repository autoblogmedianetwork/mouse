# ADR 0021: Kalkulator Komisi & Target Cuan Lokal

Status: diterima
Tanggal: 2026-11-11

## Konteks

Pengguna Heaviliate ingin tahu perkiraan pendapatan dan kebutuhan penjualan per produk MP afiliasi, sebelum memilih produk.
Formula lama (manual): hitung komisi per produk → hitung kebutuhan penjualan → hitung target harian.

Tidak ada API eksternal yang diperlukan — ini bisa diimplementasikan sepenuhnya di sisi klien dengan data harga & persen komisi.

## Keputusan

- Menggunakan formula lokal:
  - `komisiPerPenjualan = round((harga_produk * persen_komisi) / 100)`
  - `penjualanDibutuhkan = ceil(target / komisiPerPenjualan)`
  - `estimasiOmset = penjualanDibutuhkan * harga_produk`
  - `targetHarian`: `target / 30` dengan `penjualanHarian = ceil(penjualanDibutuhkan / 30)`.
- Membuat `lib/affiliate/kalkulator-komisi.ts` + `lib/affiliate/kalkulator-komisi.test.ts`.
- Tampilan berupa komponen `KalkulatorKomisi` yang meminta:
  - harga produk,
  - persentase komisi,
  - target pendapatan bulanan.

Komponen ini akan dibuat nanti dan akan dipasangkan ke halaman dashboard atau pengaturan.

## Konsekuensi

Tidak ada dependensi baru. Pencatatan pandangan dana adalah semua lokal & pribadi. Ditambahkan unit test.

## Versi detail

Versi 1.0 (2026-11-11) — implementasi dasar.
