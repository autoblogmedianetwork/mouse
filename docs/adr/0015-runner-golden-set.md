# ADR 0015: Runner golden set terpisah dari `npm test`

Status: diterima
Tanggal: 2026-11-06

## Konteks

Exit criteria Fase 3 membutuhkan bukti bahwa minimal 8 dari 10 produk golden
set lolos penilaian manual (`docs/Rencana-Pengembangan-Heaviliate.md`).
`golden/README.md` sudah lama menyebut `npm run test:golden`, tetapi perintah
itu belum ada di `package.json`, dan `docs/penilaian.md` belum dibuat. Tanpa
perintah tersebut, tahap 1 (validasi otomatis) hanya bisa dikerjakan manual,
dan hasil antar versi prompt tidak sebanding.

Batasan yang ada:

- Prompt dibangun di TypeScript (`lib/ai/prompts/`), memakai alias `@/` yang
  hanya diselesaikan oleh bundler/vitest, bukan `node` biasa.
- AGENTS rule 3: tidak menambah dependency tanpa izin.
- Skema Zod yang dipakai route harus yang sama dengan runner, supaya golden
  set menguji jalur produksi.
- `npm test` tidak boleh memanggil API berbayar.

## Keputusan

1. **Runner adalah berkas vitest terpisah** (`golden/penilaian.golden.test.ts`)
   dengan config sendiri (`vitest.golden.config.ts`, `include` hanya
   `golden/**/*.golden.test.ts`). `npm test` tetap hanya unit dan fixture.
2. **`generateJSON` dipanggil langsung, bukan `jalankanAI`.** Golden run adalah
   evaluasi offline: tidak ada sesi Supabase, tidak menulis baris `generations`,
   dan tidak terikat batas biaya bulanan pengguna. Skema, prompt builder, dan
   retry tetap sama dengan route.
3. **`.env.local` dimuat oleh pembungkus** `scripts/test-golden.mjs` memakai
   `process.loadEnvFile`, karena Next memuatnya otomatis sedangkan vitest
   tidak. Tidak perlu dev server maupun login.
4. **Skor manual tetap di `golden/produk-*.json`**, di kolom `penilaian`, sesuai
   `golden/README.md`. Runner hanya membaca; ia tidak menulis balik ke berkas
   uji agar `harapan` dan skor tidak tercampur perubahan otomatis.
5. **Bukti ditulis ke `golden/hasil/<stempel>/`** (`laporan.md` dan
   `ringkasan.json`), bukan ke `docs/`. `docs/penilaian.md` adalah register
   manusia: prosedur, tabel hasil, dan status exit criteria.
6. **Kode keluar 0 hanya bila semua gate lulus** — prasyarat P5, tahap 1, dan
   ≥ 8/10 lolos manual. Alasan kegagalan dicetak, termasuk saat penilaian
   manual belum lengkap, sehingga `0` tidak pernah berarti "belum dinilai".
7. **`--dry-run`** menjalankan pemeriksaan struktur tanpa panggilan AI, supaya
   harness bisa diverifikasi sebelum P5 selesai.

## Alasan

- Vitest sudah menjadi test runner proyek dan menyelesaikan alias `@/`, jadi
  tidak ada dependency baru (AGENTS rule 3) dan tidak perlu transpile manual.
- Memakai `generateJSON` langsung menjaga golden run tetap murah dan tidak
  mengotori tabel biaya dengan panggilan yang bukan tindakan pengguna.
- Config terpisah membuat `npm test` tetap deterministik dan offline; golden
  set hanya berjalan saat diminta (PRD bagian pengujian).
- Menulis laporan sebagai berkas membuat perbandingan antar versi prompt
  (syarat `golden/README.md`) punya bukti yang bisa disimpan.

## Konsekuensi

- `npm run test:golden` butuh `AI_API_KEY`/`OPENROUTER_API_KEY`; tanpa kunci,
  setiap produk gagal dengan pesan dari `generateJSON`, bukan crash.
- Satu putaran penuh = 30 panggilan AI (belum termasuk retry) dan bisa memakan
  waktu beberapa menit; timeout runner 15 menit.
- Menambah produk atau mengubah pengaturan uji berarti mengubah runner, karena
  pengaturan sengaja dikunci agar hasil sebanding.
- `docs/penilaian.md` harus diperbarui setiap putaran; runner tidak menyunting
  dokumentasi.
- `harapan.ide.wajib_ada_format` harus memakai label dari `FORMAT_LABELS`.
  Label lain dilaporkan sebagai peringatan input, bukan kegagalan produk.
