# AutoThreads

Dashboard pribadi untuk membuat konten affiliate. MVP mengaktifkan Threads, dengan arsitektur yang disiapkan untuk platform dan marketplace lain. Hasil AI selalu berstatus draft sampai kamu menandainya siap.

## Dokumen

| Berkas | Isi |
|---|---|
| AGENTS.md | Aturan untuk AI coding assistant |
| docs/PRD-AutoThreads.md | Fitur dan aturan |
| docs/UI-Spec-AutoThreads.md | Layout, komponen, status |
| docs/Workflow-AutoThreads.md | Alur user dan state |
| docs/Rencana-Pengembangan-AutoThreads.md | Fase, exit criteria, testing |
| docs/Template-Video-Affiliate.md | Acuan modul video |
| docs/keputusan.md | Keputusan yang menunggu konfirmasi dan prasyarat |
| docs/ai-provider.md | Provider AI per fungsi, harga, endpoint |
| docs/skema-database.md | Tabel, RLS, storage, rencana migrasi berikutnya |
| docs/glosarium.md | Istilah Indonesia ke nama kode |
| docs/adr/ | Keputusan teknis (0001 sampai 0003) |
| prompts/ | Prompt AI bernomor versi |
| golden/ | Produk uji untuk regresi kualitas |
| env.example | Semua environment variable (nama ini dipakai karena `.env*` diabaikan Git) |

## Mulai

Prasyarat: Node.js LTS, akun Supabase, API key provider yang dipakai.

```bash
npm install
cp env.example .env.local      # isi nilainya
npx supabase link --project-ref <ref>
npx supabase db push           # migrasi di docs/skema-database.md bagian 6
npm run dev                    # http://localhost:3000
```

## Pilihan provider dan fitur

- **AI** dipilih per fungsi lewat `AI_*_PROVIDER` (ADR 0002).
- **Posting** dipilih per konten: manual, Threads API, Buffer, Metricool, Postiz, atau Mixpost. Manual selalu tersedia.
- **Tools media** (rembg, HyperFrames, VoiceStudio) default mati dan diaktifkan per fitur (ADR 0003).

Tools lokal hanya bisa diakses dari PC tempat tool berjalan, atau dari server yang bisa dijangkau dengan `MEDIA_TOOLS_TOKEN`. Vercel tidak bisa memanggil localhost.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Jalankan lokal |
| `npm test` | Tes unit |
| `npm run test:golden` | Jalankan prompt ke golden set (tersedia mulai Fase 2) |
| `npm run lint` | Periksa kode |
| `npx supabase db push` | Terapkan migrasi |

## Aturan penting

1. Semua panggilan AI lewat `lib/ai/`. Komponen tidak memanggil API langsung.
2. Setiap output AI divalidasi dengan Zod sebelum ditampilkan.
3. Setiap status Threads maksimal 500 karakter (dijaga di kode dan database).
4. Tidak ada posting otomatis tanpa konten yang sudah disetujui.
5. Kunci API tidak pernah ada di kode klien.
6. Scraping nonaktif secara default.
7. Foto dikompres di browser sebelum diunggah ke Supabase Storage.

## Versi prompt

Setiap prompt bernomor versi di nama dan frontmatter. Versi yang sudah dipakai tidak diubah. Buat versi baru (misalnya `01-analisis-produk.v2.md`) dan uji di golden set.

## Deploy

1. Hubungkan repo ke Vercel.
2. Isi environment variable di Vercel sesuai `env.example`. Variabel tools lokal dikosongkan kecuali tool berjalan di server yang bisa diakses.
3. Setiap push ke `main` di-deploy otomatis.

## Status

- [ ] Fase 0: persiapan
- [ ] Fase 1: fondasi
- [ ] Fase 2: analisis dan ide
- [ ] Fase 3: generate dan preview
- [ ] Fase 4: pustaka dan pengaturan
- [ ] Fase 4.5: foto ke video
- [ ] Fase 5: pemakaian pribadi
