# ADR 0020: Platform teks baru — WhatsApp Status dan Caption TikTok

Status: diterima
Tanggal: 2026-11-09

## Konteks

MVP memakai Threads sebagai satu-satunya platform teks aktif (plus X sebagai
mode ringkas). Mayoritas affiliate Indonesia justru aktif di WhatsApp Status
dan TikTok, sehingga aplikasi tidak menjangkau kanal kerja mereka. Arsitektur
sudah disiapkan multi-platform: `PLATFORM_IDS`, `BATAS_PLATFORM`, dan prompt
`generate-status` sudah ter-parametrisasi per platform sejak v3/v4 (ADR 0008
menyimpan batas di kode, bukan tabel).

Penghambat teknis: `threads_statuses.teks` dikunci `check (char_length(teks)
between 1 and 500)` sejak migrasi 0001, dan `batasKarakterMode` memakai batas
itu sebagai plafon semua mode non-Threads.

## Keputusan

Tambah dua platform teks sebagai mode output: **WhatsApp Status (700
karakter)** dan **Caption TikTok (2200 karakter)**. Plafon database
`threads_statuses.teks` dinaikkan dari 500 ke 2200 lewat migrasi 0011; batas
per-platform tetap dijaga di kode (`batasKarakterMode`), bukan di database.

## Alasan

- WhatsApp Status teks dibatasi 700 karakter dan Caption TikTok 2200
  karakter sesuai dokumentasi platform saat fitur ini dibuat.
- Memakai plafon DB 2200 + validasi kode per platform menghindari migrasi
  bertahap setiap kali platform baru masuk, tanpa melemahkan kepatuhan:
  UI, Zod, dan prompt tetap menegakkan batas spesifik platform.
- Alternatif yang ditolak: tabel status terpisah per platform (duplikasi
  struktur tanpa manfaat untuk MVP), dan menaikkan constraint ke nilai
  tak terbatas (kehilangan lapisan pertahanan kedua).

## Konsekuensi

- `threads_statuses` kini bisa menyimpan teks sampai 2200 karakter; batas
  Threads 500 tetap ditegakkan `validateStatus`/`batasKarakterMode` untuk
  mode Threads, jadi konten lama dan alur Threads tidak berubah.
- Prompt `generate-status.v4` bertambah dua entri `GAYA_PLATFORM` (wajib
  karena `Record<PlatformId, string>`); prose untuk Threads dan X tidak
  diubah, sehingga tidak ada prompt versi baru (aturan 13) — perubahan
  bersifat tabel lookup untuk platform yang sebelumnya belum ada.
- Preview visual masih khusus Threads; mode baru memakai editor + penghitung
  karakter, preview spesifik platform menyusul di fase berikutnya.
- Posting otomatis ke WhatsApp/TikTok belum tersedia dan tidak direncanakan
  di task ini; kirim tetap manual (salin) sesuai aturan 7.
