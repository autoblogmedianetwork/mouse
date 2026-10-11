# ADR 0003: Tools media tersedia dan diaktifkan per fitur

Status: diterima (menggantikan draft "tools lokal ditunda")
Tanggal: Oktober 2026

## Konteks
Aplikasi membutuhkan beberapa tools media: kompresi foto, hapus background (rembg), render video dari template (HyperFrames), dan TTS atau voice cloning lokal (VoiceStudio). Pengembangan dilakukan di laptop low-end, tapi fiturnya tetap harus siap dipakai kapan pun perangkat atau server memadai.

## Keputusan
Semua tools media tersedia sebagai adapter di `lib/media/`. Setiap fitur punya setting backend sendiri dan default-nya `off`. Pengguna mengaktifkan fitur di Pengaturan, dan aplikasi memeriksa ketersediaannya sebelum menampilkan tombolnya.

| Fitur | Variabel | Pilihan | Default |
|---|---|---|---|
| Kompresi foto | `MEDIA_COMPRESS` | `browser` (sudah ada), `off` | `browser` |
| Hapus background | `MEDIA_BG_REMOVAL` | `off`, `local` (rembg), `cloud` | `off` |
| Render video template | `MEDIA_VIDEO_RENDER` | `off`, `local` (HyperFrames) | `off` |
| Suara (TTS) | `MEDIA_TTS` | `cloud` (Gemini TTS, ElevenLabs), `local` (VoiceStudio), `off` | `cloud` jika ada kunci, lainnya `off` |

## Cara kerja
1. Setiap tool dibungkus antarmuka `MediaTool` dengan dua fungsi: `isAvailable()` dan `run(input)`.
2. `isAvailable()` memeriksa koneksi ke URL lokal atau cloud. Untuk tool lokal, ini mengecek server yang sedang berjalan.
3. Jika tool tidak tersedia, tombol fitur tampil dengan label "Tidak tersedia" dan tooltip berisi langkah menyalakannya. Alur tetap bisa dilanjutkan dengan jalur manual atau cloud.
4. Setiap hasil dicatat di `generations` dengan `jenis` dan backend yang dipakai.

## Batasan penting: lokal vs Vercel
Aplikasi di Vercel tidak bisa memanggil `localhost` di PC kamu. Karena itu, tool lokal hanya bisa dipakai dengan salah satu cara berikut:
- **Saat pengembangan:** aplikasi dijalankan di PC yang sama dengan tool (`npm run dev`).
- **Dari Vercel:** tool dijalankan di server yang bisa diakses dari internet, misalnya VPS, dan dihubungkan lewat URL dengan autentikasi.
- **Untuk pemakaian rutin di laptop jadul:** pakai backend `cloud` atau `off`.

## Konfigurasi per perangkat
- Laptop low-end: `MEDIA_BG_REMOVAL=off`, `MEDIA_VIDEO_RENDER=off`, `MEDIA_TTS=cloud`.
- PC atau VPS yang memadai: aktifkan tool yang dibutuhkan dan isi URL-nya di `.env`.

## Konsekuensi
- Fitur tidak perlu dibangun ulang saat perangkat ditingkatkan. Cukup ubah variabel.
- Menambah tool baru cukup membuat satu adapter di `lib/media/`.
- Untuk VoiceStudio, suara yang di-clone harus suara yang kamu punya hak untuk dipakai.
- rembg dan HyperFrames bisa berat. Jalankan satu tool dalam satu waktu di perangkat yang terbatas.
