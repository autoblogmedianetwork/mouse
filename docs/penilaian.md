# Penilaian Golden Set (Fase 3)

Dokumen ini adalah tempat mencatat hasil golden set. Exit criteria Fase 3 yang
dinilai di sini: **minimal 8 dari 10 hasil lolos penilaian manual**
(`docs/Rencana-Pengembangan-Heaviliate.md` bagian Fase 3).

Rubriknya ada di `golden/rubrik.md`; format berkas uji di `golden/README.md`.
Jangan mengubah `harapan` setelah set pertama dijalankan, karena hasil antar
versi prompt jadi tidak bisa dibandingkan.

## Status

| Hal | Nilai |
|---|---|
| Produk berstatus `siap` | 10 dari 10 — **SEMUA DUMMY (SAMPEL)**, diisi 9 Nov 2026 |
| Golden set terakhir dijalankan | 9 Nov 2026 — **tahap 1 LULUS penuh: 10/10 JSON valid, kepatuhan karakter 5/5** (model `agnes-2.5-flash` via router lokal 9router) |
| Exit criteria Fase 3 | tahap 2 (penilaian manual) belum diisi — dan set dummy harus diganti produk nyata dulu |

> **Peringatan:** set saat ini adalah produk dummy lintas kategori (fashion,
> elektronik, makanan, kecantikan, rumah tangga, jasa, hobi, kesehatan)
> yang ditulis agent. Setiap berkas diberi `keterangan: SAMPEL DUMMY`.
> Hasil run dengan set ini hanya **smoke test** (membuktikan harness dan
> prompt berjalan), BUKAN pengukuran kualitas. Ganti dengan produk nyata
> sebelum memakai hasil sebagai gate Fase 3.

Selama P5 belum selesai, `npm run test:golden` berhenti di pemeriksaan
prasyarat dan **tidak** memanggil AI, sehingga tidak ada biaya yang keluar.
Untuk memastikan harness-nya sendiri sehat, pakai `--dry-run`.

## Cara menjalankan

| Perintah | Fungsi |
|---|---|
| `npm run test:golden` | Jalankan prompt 1, 2, 3 ke semua produk siap, periksa tahap 1, lalu nilai exit criteria Fase 3 dari skor manual |
| `npm run test:golden -- --dry-run` | Hanya baca 10 berkas dan cetak jumlah yang siap; tanpa panggilan AI |

Syarat:

- `AI_API_KEY` (atau `OPENROUTER_API_KEY`) ada di `.env.local`. Skrip memuat
  `.env.local` dan `.env` sendiri; tidak perlu `npm run dev`.
- Tidak perlu login Supabase. Runner memanggil `generateJSON` langsung, bukan
  `jalankanAI`, jadi tidak menulis baris `generations` dan tidak menyentuh
  batas biaya bulanan (ADR 0015).

Biaya satu putaran penuh: 30 panggilan (10 analisis, 10 ide, 10 generate),
belum termasuk retry. Prompt 1 dan 2 retry sekali, prompt 3 retry dua kali.

Keluaran ditulis ke `golden/hasil/<stempel-waktu>/`:

- `laporan.md` — tabel siap salin ke bagian **Tabel hasil** di bawah;
- `ringkasan.json` — data mesin untuk pembandingan antar versi prompt.

## Tahap 1: validasi otomatis

Wajib lulus sebelum penilaian manual. Runner memakai skema Zod yang sama
dengan route `/api/analisis`, `/api/ide`, dan `/api/generate`.

| Pemeriksaan | Gagal bila |
|---|---|
| JSON valid | Lebih dari 1 dari 10 produk tidak menghasilkan JSON sesuai skema (Fase 2: minimal 9/10) |
| Jumlah ide | Bukan tepat 10 |
| Label format | `format_label` di luar `FORMAT_LABELS` |
| Kepatuhan karakter | Ada status di atas 500 karakter |
| Harga | Ada status menyebut `Rp`/`IDR` padahal `harapan.status.tidak_boleh_ada_harga` |

Pemeriksaan yang hanya menjadi **saran** (tidak menggagalkan): fitur wajib
muncul di analisis, ada ide dengan format yang diminta, dan ada status yang
menyebut kekurangan. Ketiganya bagian dari penilaian manual, bukan gate.

Pengaturan uji dikunci di runner supaya hasil antar versi prompt sebanding:
jumlah status `menengah`, panjang `sedang`, Anti AI Slop aktif, letak link
`tanpa_link`, platform Threads (500 karakter).

## Tahap 2: penilaian manual

1. Buka `golden/hasil/<stempel>/laporan.md` dan baca tiap hasil.
2. Beri skor 1 sampai 5 untuk lima kriteria di `golden/rubrik.md`, **tanpa
   melihat versi prompt** supaya tidak bias.
3. Tulis skor ke `penilaian` pada `golden/produk-*.json`:
   `kesesuaian_deskripsi`, `bahasa_indonesia_kasual`,
   `tanpa_klaim_tak_terbukti`, `variasi_antarstatus`, `kepatuhan_karakter`.
4. Skor di bawah 3 wajib diberi alasan di `penilaian.catatan`.
5. Jalankan `npm run test:golden` lagi untuk menghitung exit criteria.

Produk yang JSON-nya tidak valid dianggap gagal di semua kriteria dan tidak
dinilai manual (aturan di `golden/rubrik.md`).

## Cara exit criteria dihitung

- **Produk lolos** = JSON valid **dan** kelima kriteria manual bernilai ≥ 3.
- **Fase 3 lulus** bila produk lolos ≥ 8 dari 10.
- Kode keluar `npm run test:golden`: `0` lulus, `1` belum lulus. Alasannya
  dicetak di akhir: prasyarat P5 belum selesai, tahap 1 gagal, penilaian
  manual belum lengkap, atau jumlah lolos masih di bawah 8.

## Tabel hasil

Diisi dari `laporan.md` putaran terakhir. Kolom skor memakai rubrik 1 sampai 5.

| Produk | JSON | Maks karakter | Kepatuhan (auto) | Kesesuaian | Bahasa | Klaim | Variasi | Kepatuhan | Catatan |
|---|---|---|---|---|---|---|---|---|---|
| produk-01 | – | – | – | – | – | – | – | – | belum diisi |
| produk-02 | – | – | – | – | – | – | – | – | belum diisi |
| produk-03 | – | – | – | – | – | – | – | – | belum diisi |
| produk-04 | – | – | – | – | – | – | – | – | belum diisi |
| produk-05 | – | – | – | – | – | – | – | – | belum diisi |
| produk-06 | – | – | – | – | – | – | – | – | belum diisi |
| produk-07 | – | – | – | – | – | – | – | – | belum diisi |
| produk-08 | – | – | – | – | – | – | – | – | belum diisi |
| produk-09 | – | – | – | – | – | – | – | – | belum diisi |
| produk-10 | – | – | – | – | – | – | – | – | belum diisi |

## Riwayat putaran

| Tanggal | Versi prompt | Model | JSON valid | Lolos manual | Catatan |
|---|---|---|---|---|---|
| – | analisis v3, ide v2, status v6 | – | – | – | belum dijalankan |
| 2026-11-09 | analisis v3, ide v2, status v6 | nvidia/nemotron-3.5-lightning:free | 0/10 | – | **gagal jalan**: OpenRouter 401 "User not found" (key mati); DeepSeek key juga 401; router lokal 9router/FreeLLMPool mati. Set: dummy 10/10 |
| 2026-11-09 | analisis v3, ide v2, status v6 | agnes-2.5-flash (via 9router lokal) | **10/10** | – | **SMOKE TEST LULUS** — tahap 1 bersih setelah 2 perbaikan: (1) `parse-json.ts` kini membuang teks penutup setelah JSON; (2) `generate-json.ts` kini menoleransi body respons yang dicatut `data: [DONE]` oleh proxy SSE. Exit criteria masih menunggu penilaian manual (by design) |

### Perbaikan kode yang lahir dari run ini

1. `lib/ai/parse-json.ts` — output yang **diawali `{` lalu ditutup teks
   penjelasan** kini bisa diparse (sebelumnya hanya preamble yang dibuang).
2. `lib/ai/generate-json.ts` — helper `bacaJsonRespons()` membuang penanda
   SSE `data: [DONE]` yang menempel di akhir body non-streaming dari proxy
   lokal. Ditemukan berkat smoke test ini; tanpa itu, SEMUA panggilan lewat
   9router pasti gagal.
3. Test baru: 4 buah (2 parse-json, 2 generate-json). Total suite 610 lulus.

## Catatan terbuka

- `harapan.ide.wajib_ada_format` pada berkas placeholder memakai label
  `Pengalaman`, sedangkan `FORMAT_LABELS` hanya berisi Listicle, Checklist,
  Storytelling, Perbandingan, Problem-Solution, dan Tutorial. Runner
  melaporkannya sebagai peringatan input dan melewati pemeriksaan itu. Saat
  mengisi P5, pakai label dari daftar tersebut.
- `docs/eval-log.md` yang disebut `golden/README.md` belum ada; bagian
  **Riwayat putaran** di atas dipakai sebagai catatan sementara.
