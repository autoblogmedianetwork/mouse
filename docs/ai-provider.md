# AI Provider: AutoThreads

**Status:** draft, menunggu verifikasi P1, P7, dan P8 di `Rencana-Pengembangan-AutoThreads.md`
**Terakhir diperiksa:** belum diverifikasi langsung dari halaman resmi (isi harga di bawah berasal dari aggregator pada 2026, bukan dari console)

---

## 1. Keputusan

| Peran | Provider | Model | Alasan |
|---|---|---|---|
| Utama (teks, gambar, JSON) | Google Gemini API | `gemini-2.5-flash-lite` | Paling hemat, menerima gambar, satu key untuk teks dan TTS |
| Naik kelas (jika kualitas kurang) | Google Gemini API | `gemini-3.1-flash-lite` | Lebih baru, mendukung teks, gambar, dan video, output lebih panjang |
| Cadangan 1 | Xiaomi MiMo API | Nama model perlu dicek (sumber menyebut mimo-v2-flash atau mimo-v2.6-flash) | Sudah diuji sebagai kandidat, endpoint OpenAI-compatible |
| Cadangan 2 | DeepSeek API | deepseek-v4 atau deepseek-v3.2 (nama perlu dicek) | Sangat murah, tapi server di luar negeri, perlu pertimbangan data |

Scraping dan pembuatan video **tidak** dikerjakan oleh model mana pun di dokumen ini. Scraping ada di kode, video di Google Flow.

---

## 2. Harga (perkiraan, perlu dicek)

| Model | Input per 1M token | Output per 1M token | Sumber |
|---|---|---|---|
| gemini-2.5-flash-lite | $0.10 | $0.40 | Aggregator Gemini pricing, Juli 2026 |
| gemini-3.1-flash-lite | $0.25 | $1.50 | Aggregator Gemini pricing, Juli 2026 |
| Gemini TTS | belum dipastikan | belum dipastikan | Sumber tidak konsisten, cek di ai.google.dev |
| mimo-v2-flash (overseas, lama) | $0.10 | $0.30 | Halaman billing Xiaomi (sudah dialihkan ke V2.5) |

**Estimasi per batch 4 konten** (10 ribu input, 6 ribu output):
- gemini-2.5-flash-lite: sekitar $0.0034 (sekitar Rp 55)
- gemini-3.1-flash-lite: sekitar $0.0125 (sekitar Rp 200)

Kedua angka perlu dihitung ulang dengan data nyata dari P7 dan Fase 2.

---

## 3. Endpoint dan konfigurasi (P1 terisi 9 Oktober 2026)

```
Provider:        Google Gemini API
Endpoint:        POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
Auth:            header x-goog-api-key: $GEMINI_API_KEY (server-side only)
Model ID:        gemini-2.5-flash-lite
API key:         disimpan di environment variable server (GEMINI_API_KEY), tidak pernah di klien
Mode output:     generationConfig.responseMimeType = "application/json" (JSON mode),
                 output diparse lalu divalidasi dengan Zod, 1 retry jika gagal
Batas request:   tergantung tier (free tier tersedia; cek console.cloud.google.com)
Tanggal cek:     9 Oktober 2026 (dokumentasi resmi ai.google.dev/api/generate-content)
Catatan:         Google juga memperkenalkan API "interactions" (/v1beta/interactions)
                 untuk model Gemini 3.x. models.generateContent masih didokumentasikan
                 resmi (Sep 2026) dan dipakai untuk gemini-2.5-flash-lite.
```

---

## 4. Checklist verifikasi

- [x] **P1:** endpoint dan format request dicatat dari dokumentasi resmi (9 Okt 2026).
- [ ] **P2:** satu panggilan teks berhasil dan mengembalikan JSON valid (butuh GEMINI_API_KEY di .env.local).
- [ ] **P7:** satu panggilan dengan gambar produk berhasil. Catat apakah respons menyebut detail yang benar-benar ada di gambar.
- [ ] **P8:** harga dan kuota gratis dicek. Tanggal dicatat.
- [ ] TTS: model dan harga dicek, dan satu contoh suara Indonesia sudah didengar.
- [ ] Batas laju (rate limit) dan perilaku saat melebihi batas dicatat.
- [ ] Cara menangani error (timeout, 429, konten diblokir) didokumentasikan.

---

## 5. Aturan pemakaian

1. **Semua pemanggilan lewat `lib/ai/`.** Komponen UI tidak boleh memanggil API langsung.
2. **Setiap output divalidasi dengan Zod.** Jika gagal, satu kali retry, lalu tampilkan pesan error. Output mentah tidak ditampilkan.
3. **Versi model dicatat di setiap konten.** Jika Google mengganti model, hasil lama tetap bisa dilacak.
4. **Biaya dicatat per panggilan.** Token input dan output disimpan agar biaya bulanan bisa dihitung.
5. **Pindah provider tanpa ubah fitur.** Cukup ganti implementasi di `lib/ai/`, skema tetap sama.
6. **Gambar hanya dikirim jika user mengunggah.** Foto dari listing seller hanya untuk referensi internal (lihat F0 di PRD).

---

## 6. Pemicu pindah ke cadangan

Pindah ke model lain jika salah satu terjadi:
- JSON tidak valid lebih dari 10% dari golden set setelah satu retry.
- Bahasa Indonesia terdengar kaku atau tidak natural menurut penilaian rubrik.
- Biaya bulanan melebihi batas yang ditetapkan di K6.
- Provider mematikan model yang sedang dipakai (seperti Gemini 2.0 Flash yang dihentikan 1 Juni 2026).

---

## 7. Riwayat keputusan

| Tanggal | Keputusan |
|---|---|
| Oktober 2026 | Utama dipindah dari MiMo ke Gemini 2.5 Flash-Lite. MiMo jadi cadangan. Alasan: satu provider untuk teks, gambar, dan TTS, serta harga setara. |

---

## 8. Provider per fungsi (ADR 0002)

Setiap fungsi dipilih terpisah lewat environment variable. Daftar lengkap dan alasan ada di `docs/adr/0002-provider-per-fungsi.md`.

| Fungsi | Variabel | Provider utama | Cadangan | Akun yang dibutuhkan |
|---|---|---|---|---|
| Chat | `AI_CHAT_PROVIDER` | Gemini 2.5 Flash-Lite | Groq, OpenRouter, DeepSeek, MiMo | Google (utama), lainnya lewat "Login with Google" jika didukung |
| Visi | `AI_VISION_PROVIDER` | Gemini | Provider chat yang menerima gambar | Sama dengan chat |
| TTS | `AI_TTS_PROVIDER` | Gemini TTS | ElevenLabs, Edge TTS | Google, atau akun ElevenLabs |
| Transkripsi | `AI_TRANSCRIBE_PROVIDER` | Groq (Whisper) | Gemini | Akun Groq (opsional) |
| Posting | `POSTING_PROVIDER` | manual | Threads API, Buffer, Metricool, Postiz, Mixpost | Facebook untuk Threads API, akun masing-masing untuk lainnya |

Catatan:
- Cek kuota gratis dan harga setiap provider sebelum mendaftar (P8). Angka di dokumen ini belum diverifikasi langsung.
- Dilarang membuat banyak akun untuk mengakali kuota. Gunakan satu akun dan pilih provider yang bisa login dengan akun itu.
- Video AI (Google Flow) dijalankan manual oleh user, tidak diintegrasikan ke aplikasi.

---

## 9. Tools media (ADR 0003)

Tools media default `off` dan diaktifkan per fitur.

| Fitur | Variabel | Pilihan | Catatan |
|---|---|---|---|
| Kompresi foto | `MEDIA_COMPRESS` | browser, off | Kompresi di browser, tanpa server |
| Hapus background | `MEDIA_BG_REMOVAL` | off, local (rembg), cloud | rembg butuh Python dan CPU cukup |
| Render video template | `MEDIA_VIDEO_RENDER` | off, local (HyperFrames) | Butuh Chromium stabil |
| TTS lokal | `AI_TTS_PROVIDER=voicestudio` | VoiceStudio di `VOICESTUDIO_URL` | API kompatibel OpenAI, butuh perangkat memadai |

Tool lokal hanya bisa dipanggil dari PC yang menjalankannya, atau dari server yang bisa dijangkau dengan `MEDIA_TOOLS_TOKEN`. Vercel tidak bisa memanggil localhost.

Untuk perangkat low-end, gunakan `off` atau backend cloud. Setelah perangkat atau VPS memadai, aktifkan tanpa mengubah kode.
