# Laporan golden set — 2026-11-09T15-22-52-340Z

Prompt: analisis-penawaran.v3, ide-konten.v2, generate-status.v7
Model: nvidia/nemotron-3.5-lightning:free
Pengaturan uji: jumlah menengah, panjang sedang, anti AI slop aktif, letak link tanpa_link

## Tahap 1 (otomatis)

| Produk | JSON valid | Maks karakter | Kepatuhan karakter (auto) | Kesimpulan | Kesesuaian | Bahasa | Klaim | Variasi | Kepatuhan |
|---|---|---|---|---|---|---|---|---|---|
| produk-01 | tidak | – | 1 | JSON tidak valid | – | – | – | – | – | Produk dummy (sampel) — hasil hanya smoke test, bukan penilaian kualitas sesungguhnya. |
| produk-02 | tidak | – | 1 | JSON tidak valid | – | – | – | – | – | Produk dummy (sampel) — hasil hanya smoke test, bukan penilaian kualitas sesungguhnya. |
| produk-03 | tidak | – | 1 | JSON tidak valid | – | – | – | – | – | Produk dummy (sampel) — hasil hanya smoke test, bukan penilaian kualitas sesungguhnya. |
| produk-04 | tidak | – | 1 | JSON tidak valid | – | – | – | – | – | Produk dummy (sampel) — hasil hanya smoke test, bukan penilaian kualitas sesungguhnya. |
| produk-05 | tidak | – | 1 | JSON tidak valid | – | – | – | – | – | Produk dummy (sampel) — hasil hanya smoke test, bukan penilaian kualitas sesungguhnya. |
| produk-06 | tidak | – | 1 | JSON tidak valid | – | – | – | – | – | Produk dummy (sampel) — hasil hanya smoke test, bukan penilaian kualitas sesungguhnya. |
| produk-07 | tidak | – | 1 | JSON tidak valid | – | – | – | – | – | Produk dummy (sampel) — hasil hanya smoke test, bukan penilaian kualitas sesungguhnya. |
| produk-08 | tidak | – | 1 | JSON tidak valid | – | – | – | – | – | Produk dummy (sampel) — hasil hanya smoke test, bukan penilaian kualitas sesungguhnya. |
| produk-09 | tidak | – | 1 | JSON tidak valid | – | – | – | – | – | Produk dummy (sampel) — hasil hanya smoke test, bukan penilaian kualitas sesungguhnya. |
| produk-10 | tidak | – | 1 | JSON tidak valid | – | – | – | – | – | Produk dummy (sampel) — hasil hanya smoke test, bukan penilaian kualitas sesungguhnya. |

Kolom skor kosong (–) diisi manual memakai `golden/rubrik.md`. Skor di bawah 3 wajib diberi alasan di catatan.

## Catatan

- produk-01: JSON analisis valid — HTTP 401: User not found. (gagal setelah 2 percobaan)
- produk-01: HTTP 401: User not found. (gagal setelah 2 percobaan)
- produk-02: JSON analisis valid — HTTP 401: User not found. (gagal setelah 2 percobaan)
- produk-02: HTTP 401: User not found. (gagal setelah 2 percobaan)
- produk-03: JSON analisis valid — HTTP 401: User not found. (gagal setelah 2 percobaan)
- produk-03: HTTP 401: User not found. (gagal setelah 2 percobaan)
- produk-04: JSON analisis valid — HTTP 401: User not found. (gagal setelah 2 percobaan)
- produk-04: HTTP 401: User not found. (gagal setelah 2 percobaan)
- produk-05: JSON analisis valid — HTTP 401: User not found. (gagal setelah 2 percobaan)
- produk-05: HTTP 401: User not found. (gagal setelah 2 percobaan)
- produk-06: JSON analisis valid — HTTP 401: User not found. (gagal setelah 2 percobaan)
- produk-06: HTTP 401: User not found. (gagal setelah 2 percobaan)
- produk-07: JSON analisis valid — HTTP 401: User not found. (gagal setelah 2 percobaan)
- produk-07: HTTP 401: User not found. (gagal setelah 2 percobaan)
- produk-08: JSON analisis valid — HTTP 401: User not found. (gagal setelah 2 percobaan)
- produk-08: HTTP 401: User not found. (gagal setelah 2 percobaan)
- produk-09: JSON analisis valid — HTTP 401: User not found. (gagal setelah 2 percobaan)
- produk-09: HTTP 401: User not found. (gagal setelah 2 percobaan)
- produk-10: JSON analisis valid — HTTP 401: User not found. (gagal setelah 2 percobaan)
- produk-10: HTTP 401: User not found. (gagal setelah 2 percobaan)

## Exit criteria Fase 3

Minimal 8 dari 10 produk lolos penilaian manual (semua kriteria bernilai 3 atau lebih).
Isi `penilaian` pada `golden/produk-*.json`, lalu jalankan `npm run test:golden` lagi
untuk menghitung jumlah lolos. Tabel ini disalin ke `docs/penilaian.md`.
