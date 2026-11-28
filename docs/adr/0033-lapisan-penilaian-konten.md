# ADR 0033 — Lapisan penilaian konten (psikologi, kepatuhan, perangking sudut)

- **Status:** Diterima
- **Tanggal:** 2026-11-28
- **Konteks:** Setelah Lab Iklan, muncul tiga pertanyaan yang terus berulang tiap
  kali menulis konten: apakah kalimatnya menarik, apakah melanggar aturan, dan
  sudut mana yang layak diulang.

## Keputusan

Tiga penilai, semuanya **deterministik**: fungsi murni di `lib/`, tanpa AI,
tanpa jaringan, tanpa biaya kredit. Bisa dijalankan offline dan diuji.

| Penilai | Berkas | Keluaran |
|---|---|---|
| Psikologi konten | `lib/psikologi/skor-hook.ts` | skor 0–100, prinsip yang dipakai/belum, cuplikan pemicu, peringatan trik menipu |
| Kepatuhan | `lib/kepatuhan/periksa.ts` | temuan `blokir`/`peringatan` + cuplikan, skor, pengingat tetap |
| Perangking sudut | `lib/performa/rangking-angle.ts` | urutan sudut + putusan + keyakinan + alasan bernomor |

## Alasan tidak memakai AI

1. Hasilnya harus **bisa dipertanggungjawabkan**. "Skor 62" dari model bahasa
   tidak bisa ditelusuri; regex yang menemukan "sisa 3" bisa dilihat dan
   dibantah.
2. Biaya. Alat ini dipakai pada setiap konten, berkali-kali. AI akan
   menghabiskan batas biaya bulanan sebelum kontennya sampai ke Threads.
3. Offline. Ketiganya tetap bekerja saat sinyal hilang — sama seperti Fase 4.

## Konsekuensi

- Aturan kepatuhan tinggal di **satu tempat** dan mengutip pasal T&C, supaya
  tidak tersebar di beberapa prompt.
- Peringatan **menurunkan** skor psikologi, bukan diabaikan: trik seperti scarcity
  karangan bukan "efektif", melainkan risiko komisi hangus (pasal 6.3n).
- Perangking sudut tidak menyimpulkan dari data tipis: di bawah dua konten,
  putusannya "uji lagi", bukan "tinggalkan".
- Kalau nanti aturan Shopee berubah, yang diubah hanya pola di `lib/kepatuhan/`,
  bukan seluruh prompt.
