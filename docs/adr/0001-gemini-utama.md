# ADR 0001: Google Gemini sebagai provider AI utama

Status: diterima
Tanggal: Oktober 2026

## Konteks
Aplikasi butuh AI untuk tiga hal: analisis teks dan gambar produk, ide konten, dan generate status Threads dalam format JSON. Anggaran sangat kecil, dan kualitas bahasa Indonesia kasual penting. Sebelumnya dipertimbangkan MiMo (Xiaomi), DeepSeek, dan Gemini.

## Keputusan
Gunakan Google Gemini API dengan model `gemini-2.5-flash-lite` sebagai utama. `gemini-3.1-flash-lite` menjadi opsi naik kelas. MiMo dan DeepSeek menjadi cadangan.

## Alasan
- Harga per token setara dengan kandidat lain (perkiraan sekitar $0.10 per 1 juta token input dan $0.40 per 1 juta token output untuk model utama), jadi biaya per batch hampir sama.
- Menerima gambar, sehingga foto produk bisa dianalisis (K7).
- Menyediakan model TTS untuk VO Indonesia (Fase 4.5), dengan satu akun dan billing.
- Satu ekosistem dengan Google Flow, yang dipakai untuk video.

## Konsekuensi
- Semua panggilan AI wajib lewat `lib/ai/` sehingga provider bisa diganti tanpa mengubah fitur.
- Harga, kuota gratis, dan endpoint harus dicek ulang di dokumentasi resmi (P1, P8) sebelum Fase 2.
- Model lama bisa dihentikan. Gemini 2.0 Flash sudah dihentikan pada 1 Juni 2026, jadi model ID selalu dicatat di `generations.model`.
- Jika kualitas JSON atau bahasa Indonesia tidak memenuhi rubrik golden set, pindah ke `gemini-3.1-flash-lite`, lalu ke cadangan (lihat docs/ai-provider.md bagian 6).

## Catatan
Angka harga di atas berasal dari aggregator pada 2026, bukan dari halaman resmi. Belum diverifikasi langsung.
