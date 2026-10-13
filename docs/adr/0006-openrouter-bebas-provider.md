# ADR 0006: Provider chat bebas lewat endpoint OpenAI-compatible

Status: diterima
Tanggal: 13 Oktober 2026
Menggantikan: ADR 0001 (untuk peran chat/JSON)

## Konteks

ADR 0001 memilih Google Gemini sebagai provider utama karena satu akun menutup teks, gambar, dan TTS.
Dalam praktiknya `GEMINI_API_KEY` tidak pernah terisi, sehingga `/api/analisis`, `/api/ide`, dan
`/api/generate` selalu menjawab 502 dan semua alur AI terkunci di "lanjutkan dengan input manual".

Selain itu kunci Google terikat ke satu vendor dan free tier-nya berubah-ubah. Sebaliknya OpenRouter
menyediakan model berlabel `:free` yang bisa dipakai tanpa saldo, dan protokol `/chat/completions`
yang sama dipakai DeepSeek, Groq, Ollama, LM Studio, dan sebagian besar provider lain.

## Keputusan

`lib/ai/generate-json.ts` dipanggil ulang ke endpoint apa pun yang mengikuti format OpenAI:

| Variabel | Bawaan | Peran |
|---|---|---|
| `AI_BASE_URL` | `https://openrouter.ai/api/v1` | Dasar URL; endpoint yang dipanggil `{AI_BASE_URL}/chat/completions` |
| `AI_MODEL` | `nvidia/nemotron-3-super-120b-a12b:free` | Nama model |
| `AI_API_KEY` | - | Bearer token, server-only |

`OPENROUTER_API_KEY` tetap dibaca sebagai cadangan bila `AI_API_KEY` kosong, supaya rahasia lama di
Vercel tidak perlu diganti nama.

`GEMINI_API_KEY` dan `GEMINI_MODEL` tidak lagi dibaca kode mana pun. Jalur Gemini dihapus total,
bukan disimpan sebagai cabang.

## Alasan

- Gratis tanpa saldo: model `:free` di OpenRouter tidak butuh kartu kredit.
- Bisa dipakai model apa pun tanpa ubah kode, termasuk LLM lokal di PC sendiri lewat Ollama atau LM Studio.
- Satu jalur kode, bukan dua. Menyimpan cabang Gemini berarti dua jalur yang harus diuji dan dua tempat error yang bisa salah baca.
- `response_format: {type: "json_object"}` tersedia di model default dan di sebagian besar model OpenAI-compatible, jadi JSON mode tetap jalan.
- Data produk tidak dikirim ke banyak vendor sekaligus: satu panggilan, satu provider, sesuai ADR 0002.

## Konsekuensi

- Semua panggilan AI tetap lewat `lib/ai/` (AGENTS aturan 6). UI tidak tahu provider apa yang dipakai.
- Model gratis OpenRouter bisa tiba-tiba dihapus atau diberi rate limit ketat. Karena itu model ID
  dicatat di `generations.model` dan `AI_MODEL` bisa diganti dari Vercel tanpa deploy ulang.
- Ganti provider = ganti tiga variabel di Vercel, tanpa ubah kode.
- `AI_CHAT_PROVIDER` / `AI_VISION_PROVIDER` (ADR 0002) tetap ada untuk memilih per fungsi; nilai
  bawaan ikut diganti dari `gemini` ke `openrouter`.
- Model gratis belum tentu sebaik Gemini untuk bahasa Indonesia kasual. Kualitas diverifikasi lewat
  golden set sebelum dianggap selesai (P5, P9).

## Alternatif yang ditolak

- **Tetap Gemini, tambah OpenRouter sebagai cadangan.** Dua jalur, dua set variabel, dua kemungkinan
  salah baca. `GEMINI_API_KEY` sudah terbukti tidak terisi.
- **OpenAI-compatible sebagai cabang, Gemini tetap default.** Bertentangan dengan permintaan
  eksplisit untuk berhenti memakai Gemini.
- **Router pengembangan lokal (FreeLLMAPI).** Belum diverifikasi, hanya lokal, dan kebijakan data
  produk tidak jelas (lihat `docs/dependency.md` bagian 3).
