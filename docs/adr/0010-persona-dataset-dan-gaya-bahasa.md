# ADR 0010: Persona hasil kurasi dataset + gaya bahasa natural di semua prompt AI

Tanggal: 21 Oktober 2026. Status: diterima.

## Konteks

Dataset "Awesome ChatGPT Prompts" (153.172 baris CSV, kolom act/prompt) memuat ribuan
peran prompt berbahasa Inggris. Heaviliate butuh variasi nada konten yang lebih kaya
dari tiga persona awal (Bawaan, Sahabat, Ahli), dan semua output AI harus terasa
natural khas media sosial Indonesia — bukan bahasa baku atau terjemahan kaku.

## Keputusan

1. **Persona sebagai data yang dikurasi, bukan prompt mentah dari dataset.**
   Sisa isi CSV tidak diimport ke runtime. Script sekali-pakai
   `scripts/kurasi-persona-prompt.mjs` (parser RFC-4180 mini, tanpa dependency baru)
   menyaring peran relevan (fieldset: cerita, copywriting, pemasaran, sosial, konten,
   produk — 2551 akt diamati, ±36 relevant terpilih lama digabung). Enam peran terbaik
   dilokalkan ke data persona: `pendongeng`, `copywriter`, `pengiklan`, `komedian`,
   `motivator`, `spesialis-sosmed` (`lib/ai/persona.ts`, total 9 id). UI pembaca
   `PERSONA_LIST` tidak berubah strukturnya.

2. **Gaya bahasa sebagai blok bersama, bukan disalin ke tiap prompt.**
   `lib/ai/gaya-bahasa.ts` mengekspor `ATURAN_BAHASA`. Tiap fitur AI mendapat versi
   prompt baru berupa wrapper di atas versi sebelumnya (AGENTS aturan 13: versi lama
   tidak ditimpa):

   | Fitur | Dari | Menjadi |
   |---|---|---|
   | Analisis penawaran | `analisis-penawaran.v2` | `analisis-penawaran.v3` |
   | Ide konten | `ide-konten.v1` | `ide-konten.v2` |
   | Generate status | `generate-status.v4` | `generate-status.v5` |
   | Naskah video | `naskah-video.v1` | `naskah-video.v2` |
   | Carousel | `carousel-slides.v1` | `carousel-slides.v2` |

   Kelima route `app/api/*` kini memakai versi baru sehingga `prompt_version` yang
   tercatat di tabel `generations` telah mengikuti.

## Alternatif yang ditolak

- **Menerjemahkan seluruh CSV**: hasil 7+ MB yang tidak terpakai runtime; DOM peran
  developer/matematika/penerjemah tidak relevan untuk konten affiliate.
- **Menyuntikkan prompt mentah dataset ke prompt builder**: percakapan peran
  ("I want you to act as...") bahasa Inggris, panjang, dan tidak dibutuhkan Zod schema.
  Persona tervokon lokalis ya cukup.
- **Mengubah prompt versi lama di tempat**: melanggar aturan 13.

## Konsekuensi

- Persona baru bekerja lewat alur yang sama: draf simpan `Pengaturan.persona` (string),
  dinormalisasi `normalkanPersonaId`, diterjemahkan `labelPersonaUntukPrompt` saat prompt
  dibangun.
- Penyesuaian kalimat `ATURAN_BAHASA` ke depan cukup satu file; efeknya menyebar ke
  versi wrapper berikutnya, bukan ke versi lama yang terbanner legacy.
- Prompt `*.md` (01-08) tidak diduplikasi ulang untuk tiap versi wrapper; perubahan
  disarikan di ADR ini dan `docs/test-log.md`.
