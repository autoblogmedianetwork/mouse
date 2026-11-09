# Laporan golden set — 2026-11-09T15-48-53-248Z

Prompt: analisis-penawaran.v3, ide-konten.v2, generate-status.v7
Model: agnes/agnes-2.5-flash
Pengaturan uji: jumlah menengah, panjang sedang, anti AI slop aktif, letak link tanpa_link

## Tahap 1 (otomatis)

| Produk | JSON valid | Maks karakter | Kepatuhan karakter (auto) | Kesimpulan | Kesesuaian | Bahasa | Klaim | Variasi | Kepatuhan |
|---|---|---|---|---|---|---|---|---|---|
| produk-01 | ya | 150 | 5 | lulus | – | – | – | – | – | Produk dummy (sampel) — hasil hanya smoke test, bukan penilaian kualitas sesungguhnya. |
| produk-02 | ya | 201 | 5 | lulus | – | – | – | – | – | Produk dummy (sampel) — hasil hanya smoke test, bukan penilaian kualitas sesungguhnya. |
| produk-03 | ya | 301 | 5 | lulus | – | – | – | – | – | Produk dummy (sampel) — hasil hanya smoke test, bukan penilaian kualitas sesungguhnya. |
| produk-04 | ya | 185 | 5 | lulus | – | – | – | – | – | Produk dummy (sampel) — hasil hanya smoke test, bukan penilaian kualitas sesungguhnya. |
| produk-05 | ya | 204 | 5 | lulus | – | – | – | – | – | Produk dummy (sampel) — hasil hanya smoke test, bukan penilaian kualitas sesungguhnya. |
| produk-06 | ya | 175 | 5 | lulus | – | – | – | – | – | Produk dummy (sampel) — hasil hanya smoke test, bukan penilaian kualitas sesungguhnya. |
| produk-07 | ya | 155 | 5 | lulus | – | – | – | – | – | Produk dummy (sampel) — hasil hanya smoke test, bukan penilaian kualitas sesungguhnya. |
| produk-08 | ya | 162 | 5 | lulus | – | – | – | – | – | Produk dummy (sampel) — hasil hanya smoke test, bukan penilaian kualitas sesungguhnya. |
| produk-09 | ya | 224 | 5 | lulus | – | – | – | – | – | Produk dummy (sampel) — hasil hanya smoke test, bukan penilaian kualitas sesungguhnya. |
| produk-10 | ya | 202 | 5 | lulus | – | – | – | – | – | Produk dummy (sampel) — hasil hanya smoke test, bukan penilaian kualitas sesungguhnya. |

Kolom skor kosong (–) diisi manual memakai `golden/rubrik.md`. Skor di bawah 3 wajib diberi alasan di catatan.

## Catatan

- produk-01: Fitur wajib muncul di analisis — tidak muncul: warna tidak cepat pudar, ukuran S sampai XXL
- produk-02: Fitur wajib muncul di analisis — tidak muncul: baterai 6 jam, bobot 220 gram
- produk-03: Fitur wajib muncul di analisis — tidak muncul: bumbu balado meresap, kemasan zip stand
- produk-04: Fitur wajib muncul di analisis — tidak muncul: niacinamide 10 persen, zinc PCA 1 persen, tanpa alkohol dan pewangi, kemasan pump gelas gel
- produk-05: Fitur wajib muncul di analisis — tidak muncul: panas 8 jam dingin 12 jam
- produk-06: Fitur wajib muncul di analisis — tidak muncul: dua alternatif desain, satu kali revisi, file PNG JPG dan SVG, dikerjakan tiga hari kerja
- produk-08: Fitur wajib muncul di analisis — tidak muncul: kapasitas 0,6 liter, tiga mode, kabel lepas pasang
- produk-09: Fitur wajib muncul di analisis — tidak muncul: kertas 120 gsm anti tembus
- produk-10: Fitur wajib muncul di analisis — tidak muncul: botol kaca gelap dengan pump, asam laurat terjaga

## Exit criteria Fase 3

Minimal 8 dari 10 produk lolos penilaian manual (semua kriteria bernilai 3 atau lebih).
Isi `penilaian` pada `golden/produk-*.json`, lalu jalankan `npm run test:golden` lagi
untuk menghitung jumlah lolos. Tabel ini disalin ke `docs/penilaian.md`.
