# Test Log: AutoThreads

Catatan hasil tes per tanggal. Rincian lapisan tes ada di `docs/rencana-testing.md`.

## 12 Oktober 2026 — sinkronisasi dokumen dan deploy pertama

Fase: prasyarat (P3, P4) dan penutup Fase 1 (fondasi sesi Supabase).

| Pemeriksaan | Perintah | Hasil |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | Lulus, 0 error |
| Lint | `npm run lint` | Lulus, 0 temuan |
| Unit dan fixture | `npx vitest run` | 146 tes lulus di 12 berkas |
| Build produksi | `npx next build` | Lulus, 19 rute, proxy terdeteksi |
| Aplikasi jalan | `next start` di localhost | `/`, `/masuk`, `/konten`, `/impor` merespons 200 |
| Deploy | `vercel deploy --prod` | Ready in 24s, build sukses di Vercel |
| Produksi | `https://autothreads-sigma.vercel.app` | `/`, `/masuk`, `/konten`, `/impor` merespons 200, tanpa error konsol |
| Login terpasang | buka produksi di peramban | `/masuk` menampilkan form email dan tombol "Kirim tautan login", bukan pesan env kurang |
| Env Vercel | `vercel env ls` | 7 variabel di Production dan Preview (Supabase URL, anon key, service role, GEMINI_MODEL, APP_URL, AI_MONTHLY_BUDGET_USD, SCRAPING_ENABLED) |
| Git ke Vercel | `vercel git connect` | Repo `autoblogmedianetwork/mouse` sudah tersambung ke project, jadi push ke `main` memicu deploy |

Catatan cara memasang env: `vercel env add` interaktif untuk nama `NEXT_PUBLIC_*` (prompt penyimpanan)
dan untuk `preview` (prompt git branch), jadi pengisian dilakukan dengan `--no-sensitive --force --yes`
untuk variabel publik dan `--force --yes` untuk variabel rahasia, nilai lewat stdin, tidak pernah
ditampilkan di terminal.

Yang belum diuji dan masih menjadi batas:

- Magic link end-to-end belum diuji. Formnya sudah tampil, tetapi tautan perlu email nyata, dan
  `https://autothreads-sigma.vercel.app/auth/callback` harus masuk daftar Redirect URLs di Supabase.
- `GEMINI_API_KEY` masih kosong di `.env.local`, jadi tidak ikut dikirim ke Vercel dan panggilan AI
  belum bisa diuji (P2, P8). Isi dulu, lalu jalankan ulang pengisian env.
- `supabase/migrations/0003_performa_affiliate.sql` belum dijalankan di project Supabase.
- Tes RLS dua akun (`rencana-testing.md` bagian 4) belum dijalankan karena migrasi belum diterapkan.
- Golden set belum jalan: `golden/produk-*.json` masih placeholder dan perintah
  `npm run test:golden` belum dibuat (rencananya mulai Fase 2).

Cara menguji manual:

1. Buka `https://autothreads-sigma.vercel.app`.
2. Cek empat rute: `/`, `/masuk`, `/impor`, `/analitik`.
3. Setelah env Supabase diisi, coba magic link dan pastikan halaman `/masuk` menampilkan pesan yang
   benar saat email belum terdaftar.

## 12 Oktober 2026 — Antrian review (UI-Spec 3.9)

Fase: bagian awal F10 (antrian review). Data masih localStorage, jadi tes integrasi RLS tidak
berlaku untuk tugas ini.

| Pemeriksaan | Perintah / cara | Hasil |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | Lulus, 0 error |
| Lint | `npm run lint` | Lulus, 0 temuan |
| Unit dan fixture | `npx vitest run` | 163 tes lulus di 15 berkas (3 berkas baru: `lib/konten/skema.test.ts`, `lib/konten/store.test.ts`, `lib/ai/biaya.test.ts`) |
| Build produksi | `npx next build` | Lulus, rute `/antrian` terdaftar |
| Rute lama | `curl -I localhost:3210/konten` | `307` ke `/antrian` |
| Jumlah per tab | buka `/antrian` dengan 5 konten uji | Perlu review 2, Disetujui 1, Terjadwal 0, Gagal posting 0, Sudah posting 1, Ditolak 1 |
| Label Otomatis | konten dengan `otomatis: true` | Muncul tepat satu kali di kartu yang benar |
| Aksi massal tandai siap | pilih 2 draft, satu checklist lengkap | 1 dipindah ke Disetujui, 1 dilewati dengan pesan checklist belum lengkap |
| Tab Ditolak | buka tab | Kartu tampil dengan aksi Pulihkan ke draft, Duplikat, Hapus |
| Widget biaya | periksa header | "Belum ada panggilan AI tercatat. Batas bulanan $5.00" |
| Konsol | pemeriksaan konsol peramban | Tidak ada error |

Yang belum dicakup:

- Kartu belum menampilkan thumbnail, karena `contents` tidak punya field media. Menunggu field foto
  dan relasi `product_media` di Supabase.
- Tab Terjadwal, Gagal posting, dan tombol "Jeda semua" baru tampil kosong: provider posting dan
  mode semi/otomatis belum dibuat (Fase 5-7).
- Widget biaya menampilkan angka nol saat log lokal terisi; log sendiri baru terisi setelah pemanggilan
  AI mencatat `usageMetadata` (tugas batas biaya, K6).
- Deploy produksi belum memuat halaman ini; jalankan `vercel deploy --prod` setelah push.
