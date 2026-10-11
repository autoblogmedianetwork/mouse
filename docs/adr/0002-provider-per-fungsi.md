# ADR 0002: Provider AI dan posting dipisah per fungsi

Status: diterima
Tanggal: Oktober 2026

## Konteks
Kebutuhan aplikasi mencakup chat (teks dan JSON), visi (gambar produk), audio (TTS), dan posting ke beberapa platform. Satu provider tidak cukup untuk semua fungsi, dan kuota gratis tiap provider berbeda. Pemilik ingin memakai provider yang dipilih bebas dan selalu punya pilihan manual maupun otomatis untuk posting.

## Keputusan
Setiap fungsi punya antarmuka sendiri di `lib/ai/` dan `lib/posting/`. Provider dipilih per fungsi lewat environment variable dan bisa diganti tanpa mengubah fitur.

| Fungsi | Antarmuka | Provider utama | Cadangan |
|---|---|---|---|
| Chat (teks, JSON) | `chat` | Gemini 2.5 Flash-Lite | Groq, OpenRouter (model gratis), DeepSeek atau MiMo (berbayar) |
| Visi (gambar produk) | `vision` | Gemini 2.5 Flash-Lite | Provider chat lain yang menerima gambar |
| Audio (TTS) | `tts` | Gemini TTS | ElevenLabs, Edge TTS |
| Audio (transkripsi, opsional) | `transcribe` | Groq (Whisper) | Gemini |
| Video AI | Tidak diintegrasikan | Google Flow (manual oleh user) | Kling atau MiniMax (manual) |
| Posting | `posting` | Mode manual (salin) | Threads API, Buffer, Metricool, Postiz atau Mixpost (self-host) |

## Pilihan posting yang selalu tersedia
Di setiap konten, user memilih salah satu mode berikut. Mode manual selalu ada sebagai cadangan.
1. **Manual (salin):** default, tidak butuh akun atau API.
2. **Threads API:** aktif setelah review Meta disetujui.
3. **Buffer atau Metricool:** hosted, tanpa server sendiri. Dicek dukungan Threads sebelum dipakai.
4. **Postiz atau Mixpost:** self-host. Hanya dipakai di VPS atau server terpisah, karena butuh Docker dan database sendiri.

Aplikasi menyimpan `posting_provider` per konten. Jika provider gagal, konten kembali ke mode manual.

## Aturan
- Semua pemanggilan provider lewat antarmuka di `lib/ai/` atau `lib/posting/`. Komponen UI tidak memanggil API langsung.
- Setiap provider wajib punya fungsi `isAvailable()` dan `validate()` sebelum dipanggil.
- Kunci API per provider disimpan di server saja.
- Penambahan provider baru cukup membuat satu adapter dan mencatatnya di `docs/ai-provider.md`.

## Konsekuensi
- Mengurangi risiko satu provider berhenti, karena setiap fungsi punya cadangan.
- Setiap provider perlu akun sendiri. Akun Google dipakai untuk provider yang mendukung "Login with Google". Pembuatan banyak akun untuk menambah kuota tidak dianjurkan karena melanggar ketentuan layanan banyak provider.
- Harga dan kuota gratis harus dicek sebelum mendaftar (P8).
