# AI Provider: AutoThreads

**Status:** chat/JSON sudah lepas dari Gemini (ADR 0006, 13 Okt 2026). TTS dan visi menunggu verifikasi P7 dan P8.
**Terakhir diperiksa:** 13 Oktober 2026, daftar model OpenRouter lewat `https://openrouter.ai/api/v1/models`. Harga provider lain di bawah masih perkiraan aggregator.

---

## 1. Keputusan

| Peran | Provider | Model | Alasan |
|---|---|---|---|
| Chat dan JSON (utama) | OpenRouter | `nvidia/nemotron-3-super-120b-a12b:free` | Gratis tanpa saldo, JSON mode didukung, 262K konteks |
| Chat dan JSON (ganti) | Endpoint kompatibel OpenAI mana pun | bebas | Cukup ubah `AI_BASE_URL` + `AI_MODEL`; contoh DeepSeek, Groq, Ollama, LM Studio |
| Chat dan JSON (model gratis lain) | OpenRouter | `google/gemma-4-31b-it:free` | JSON mode didukung, 32K output; kandidat cadangan pertama |
| Chat dan JSON (tanpa JSON mode) | OpenRouter | `nvidia/nemotron-3.5-lightning:free`, `thinkingmachines/inkling:free` | Output sangat panjang, tapi tanpa `response_format`; parser `parse-json.ts` menangani |
| Visi | (menunggu P7) | - | Belum ada model yang diuji menerima foto produk |
| TTS | (menunggu P8) | - | Kandidat: Gemini TTS, ElevenLabs, Edge TTS, VoiceStudio lokal |
| Ditolak | Google Gemini untuk chat/JSON | - | ADR 0001 digantikan ADR 0006 |

Scraping dan pembuatan video **tidak** dikerjakan oleh model mana pun di dokumen ini. Scraping ada di kode, video di Google Flow.

---

## 2. Harga (perkiraan, perlu dicek)

| Model | Input per 1M token | Output per 1M token | Sumber |
|---|---|---|---|
| nvidia/nemotron-3-super-120b-a12b:free | $0 (free tier) | $0 (free tier) | `openrouter.ai/api/v1/models`, 13 Okt 2026. Rate limit ketat |
| google/gemma-4-31b-it:free | $0 (free tier) | $0 (free tier) | Sama |
| deepseek-chat (contoh berbayar) | belum dicek | belum dicek | Cek di platform.deepseek.com |
| Gemini TTS | belum dipastikan | belum dipastikan | Chat Gemini sudah ditolak; TTS masih kandidat |

Angka per batch 4 konten tidak dihitung karena model utama gratis. Setelah pindah ke model berbayar,
hitung ulang dari data nyata P7 dan Fase 2.

---

## 3. Endpoint dan konfigurasi (diisi ulang 13 Oktober 2026, ADR 0006)

```
Provider:        apa pun yang kompatibel OpenAI (bawaan: OpenRouter)
Endpoint:        POST {AI_BASE_URL}/chat/completions
                 bawaan AI_BASE_URL = https://openrouter.ai/api/v1
Auth:            header Authorization: Bearer $AI_API_KEY (server-only)
                 OPENROUTER_API_KEY dipakai bila AI_API_KEY kosong
Model ID:        AI_MODEL
                 bawaan = nvidia/nemotron-3-super-120b-a12b:free
Body:            { model, messages: [{role:"user", content: prompt}],
                   temperature, response_format: { type: "json_object" } }
Ekstraksi:       payload.choices[0].message.content → parseModelJson → Zod, 1 retry jika gagal
Batas request:   tergantung provider (OpenRouter: rate limit per menit untuk model :free)
Tanggal cek:     13 Oktober 2026 (openrouter.ai/docs/quickstart dan /api/v1/models)

Contoh ganti provider tanpa ubah kode:
  AI_BASE_URL=https://api.deepseek.com/v1   AI_MODEL=deepseek-chat
  AI_BASE_URL=http://localhost:11434/v1      AI_MODEL=qwen2.5:7b   (Ollama)
  AI_BASE_URL=http://localhost:1234/v1       AI_MODEL=llama-3.2    (LM Studio)
```

Model gratis di OpenRouter per 13 Okt 2026 yang mendukung `response_format` JSON mode:

| Model | Parameter | Konteks | Output maks |
|---|---|---|---|
| nvidia/nemotron-3-super-120b-a12b:free | 120B | 262K | 235K |
| google/gemma-4-31b-it:free | 31B | 262K | 32K |
| nvidia/nemotron-3.5-lightning:free | - | 1M | 64K |
| thinkingmachines/inkling:free | - | 1M | 262K |

Dua terakhir tidak mendukung `response_format`; kode tetap mengirimnya, dan bila ditolak model tinggal
diganti lewat `AI_MODEL`. Llama, Qwen, dan Mistral free tier sudah dihapus dari OpenRouter.

---

## 4. Checklist verifikasi

- [x] **P1:** endpoint dan format request dicatat dari dokumentasi resmi (13 Okt 2026, OpenRouter).
- [ ] **P2:** satu panggilan teks berhasil dan mengembalikan JSON valid (butuh `AI_API_KEY` atau `OPENROUTER_API_KEY` di .env.local).
- [ ] **P7:** satu panggilan dengan gambar produk berhasil. Catat apakah respons menyebut detail yang benar-benar ada di gambar. **Tertunda:** model default belum tentu menerima gambar.
- [ ] **P8:** harga dan kuota gratis dicek. Tanggal dicatat. Model gratis sudah tercatat di bagian 2; kuota per menit belum.
- [ ] TTS: model dan harga dicek, dan satu contoh suara Indonesia sudah didengar.
- [ ] Batas laju (rate limit) dan perilaku saat melebihi batas dicatat.
- [ ] Cara menangani error (timeout, 429, konten diblokir) didokumentasikan.

---

## 5. Aturan pemakaian

1. **Semua pemanggilan lewat `lib/ai/`.** Komponen UI tidak boleh memanggil API langsung.
2. **Setiap output divalidasi dengan Zod.** Jika gagal, satu kali retry, lalu tampilkan pesan error. Output mentah tidak ditampilkan.
3. **Versi model dicatat di setiap konten.** Jika provider menghapus model, hasil lama tetap bisa dilacak.
4. **Biaya dicatat per panggilan.** Token input dan output disimpan agar biaya bulanan bisa dihitung.
5. **Pindah provider tanpa ubah fitur.** Cukup ganti `AI_BASE_URL`, `AI_MODEL`, dan `AI_API_KEY` di server, skema tetap sama.
6. **Gambar hanya dikirim jika user mengunggah.** Foto dari listing seller hanya untuk referensi internal (lihat F0 di PRD).
7. **API key hanya di server.** `AI_API_KEY` dan `OPENROUTER_API_KEY` tidak pernah sampai ke klien (AGENTS aturan 11). Lewat Vercel → Settings → Environment Variables, tidak lewat chat.

---

## 6. Pemicu ganti model atau provider

Ganti model atau provider jika salah satu terjadi:
- JSON tidak valid lebih dari 10% dari golden set setelah satu retry.
- Bahasa Indonesia terdengar kaku atau tidak natural menurut penilaian rubrik.
- Rate limit provider membuat generate sering gagal (model gratis OpenRouter rentan di sini).
- Provider mematikan atau menghapus model yang sedang dipakai.

Caranya cukup ubah `AI_MODEL` (dan `AI_BASE_URL` bila pindah provider) di .env.local atau Vercel.
Tidak perlu deploy ulang kode, karena kedua variabel dibaca saat runtime.

---

## 7. Riwayat keputusan

| Tanggal | Keputusan |
|---|---|
| Oktober 2026 | Utama dipindah dari MiMo ke Gemini 2.5 Flash-Lite. MiMo jadi cadangan. Alasan: satu provider untuk teks, gambar, dan TTS, serta harga setara. |
| 13 Oktober 2026 | Chat dan JSON lepas dari Gemini (ADR 0006). Endpoint jadi OpenAI-compatible, bawaan OpenRouter `nvidia/nemotron-3-super-120b-a12b:free`. `GEMINI_API_KEY` dan `GEMINI_MODEL` tidak lagi dibaca kode. Alasan: key Google tidak pernah terisi dan provider terkunci ke satu vendor. |

---

## 8. Provider per fungsi (ADR 0002)

Setiap fungsi dipilih terpisah lewat environment variable. Daftar lengkap dan alasan ada di `docs/adr/0002-provider-per-fungsi.md`. Nilai bawaan disesuaikan ADR 0006.

| Fungsi | Variabel | Provider utama | Cadangan | Akun yang dibutuhkan |
|---|---|---|---|---|
| Chat | `AI_CHAT_PROVIDER` | Endpoint kompatibel OpenAI (bawaan OpenRouter) | Groq, DeepSeek, MiMo, Ollama lokal | OpenRouter untuk bawaan, lainnya lewat "Login with Google" jika didukung |
| Visi | `AI_VISION_PROVIDER` | mengikuti chat | provider chat yang menerima gambar | Sama dengan chat |
| TTS | `AI_TTS_PROVIDER` | off | ElevenLabs, Edge TTS, VoiceStudio lokal | Google (kalau Gemini TTS dipakai), atau akun ElevenLabs |
| Transkripsi | `AI_TRANSCRIBE_PROVIDER` | off | Groq (Whisper) | Akun Groq (opsional) |
| Posting | `POSTING_PROVIDER` | manual | Threads API, Buffer, Metricool, Postiz, Mixpost | Facebook untuk Threads API, akun masing-masing untuk lainnya |

Catatan:
- Chat dan visi saat ini lewat **satu** pemanggilan di `lib/ai/generate-json.ts`, jadi keduanya memakai `AI_BASE_URL` + `AI_MODEL` yang sama. Pemisahan per fungsi jadi nyata setelah visi dan TTS dibuat.
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
