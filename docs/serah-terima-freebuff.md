# Serah Terima ke AI Berikutnya (freebuff) — 10 Nov 2026

**Kamu mengambil alih proyek "Heaviliate"** — aplikasi web affiliate untuk kreator
Indonesia (Threads/Shopee). Bacalah file ini dan `AGENTS.md` SEBELUM menulis
kode apa pun. Jangan menimpa versi prompt lama. Jangan menambah dependensi
tanpa izin. Satu tugas per sesi.

---

## 1. Lokasi & lingkungan
- Proyek: `C:\Users\L16100278\Desktop\AFFILIATE PERSONAL\FILE KERJA AFFILIATE\heaviliate`
- Git: `autoblogmedianetwork/mouse`, branch `main`, selalu push tiap task selesai
- Stack: Next.js 16 App Router, TypeScript, Tailwind 4, Supabase, Zod, Vitest
- Shell: Git Bash di Windows. `ls -la` kolom "size" sebenarnya UID — pakai `stat -c %s`
- Obsidian vault: `D:\OTAK AI SLAMET\Otak slamet\Heaviliate\` (catatan 00–08)
- ⚠️ **BUG BERULANG**: tool write/edit sering membuat folder hantu `heviliate/`
  (tanpa "a"). SETELAH menulis file baru, selalu jalankan:
  `find heviliate -type f` → kalau ada, `mv` ke `heaviliate/...` lalu `rm -rf heviliate`.
- ⚠️ `git add` multi-path kadang gagal diam-diam. Setelah push, cek
  `git status --porcelain | grep -v vscode` dan commit pelengkap bila perlu.

## 2. Status saat ini (semua ter-push)
- **Fase 0–4 SEMUA TUNTAS.** Test **656 lulus (72 file)**, tsc/lint/build hijau.
- Fase 0: golden set 10 produk dummy → Fase 1: platform WA/TikTok, de-jargon,
  onboarding → Fase 2: menu Konten, wizard 4 layar, sinkron draft Supabase →
  Fase 3: skor kelayakan, persona preset + chip, review pasar, bank masalah,
  rekomendasi performa → Fase 4 (versi manual, NOL API): deteksi marketplace
  dari link + aturan konten per marketplace, cadangkan/pulihkan data JSON.
- Workflow docs versi **v0.7**. Detail tiap sesi: catatan Obsidian 05–08.
- Keputusan Fase 4 oleh user: **tanpa API, tanpa scraping** (takut banned).
  Jangan tawarkan API/scraping lagi tanpa diminta.

## 3. Tugas menunggu user (ingatkan, jangan kerjakan sendiri)
1. Jalankan `supabase/migrations/0013_skor_peluang.sql` di Supabase SQL Editor
   (2 baris ALTER TABLE, idempoten). Tanpa ini "Susun peluang" error.
2. Uji visual semua fitur Fase 3–4 di browser.
3. Ganti 10 produk dummy golden set dengan produk nyata + rubrik manual.

## 4. Usulan kerja berikutnya (pilih satu, tanya dulu ke user)
- Ekspor CSV daftar konten (murni lokal, aman)
- Kalender posting manual (tanpa API)
- Perbaikan apa pun yang ditemukan user saat uji visual

## 5. Aturan proyek yang TIDAK boleh dilanggar (dari AGENTS.md)
1. Satu tugas per sesi; jelaskan rencana, tunggu persetujuan sebelum koding
2. Semua keluaran AI = `draft`; jalur input manual selalu tersedia
3. Prompt adalah artefak berversi: JANGAN edit file prompt lama (v1–v7 utuh);
   aturan baru = file versi baru ATAU komposisi di route API
4. Data dummy ditandai "SAMPEL DUMMY" / "Contoh:" dan mudah dihapus
5. UI berbahasa Indonesia; komentar kode bahasa Inggris
6. Verifikasi sebelum klaim selesai: `npx tsc --noEmit`, `npm run lint`,
   `npm test`, `npm run build`
7. Akhiri task: daftar file berubah (aturan 17), commit `feat/fix/docs(...): ...`,
   push, catat ke Obsidian

## 6. Konvensi teknis penting
- Sesi wajib untuk API yang membakar kredit AI (`wajibSesi`), pola `jalankanAI`
- Skema Zod di `lib/ai/schemas.ts`; prompt di `lib/ai/prompts/` (v1…v7)
- localStorage = sumber kebenaran data; Supabase = cadangan (draft, sinkron 2-C)
- ESLint `react-hooks/set-state-in-effect`: setState async dalam `.then()` boleh;
  setState sinkron di effect butuh `eslint-disable-next-line` PERSIS di atasnya
- Golden run (kalau perlu): `export AI_BASE_URL="http://127.0.0.1:20128/v1" &&
  export AI_API_KEY="$(grep -m1 'apiKey:' /c/Users/L16100278/.omp/agent/models.yml |
  awk '{print $2}')" && export AI_MODEL="agnes/agnes-2.5-flash" && npm run test:golden`
- API key OpenRouter & DeepSeek di `.env.local` MATI (401) — jangan dicoba

## 7. Mulai dari sini
1. Baca `AGENTS.md` lalu `docs/Workflow-Heaviliate.md` (v0.7)
2. `npm test` untuk memastikan 656 lulus di mesinmu
3. Tanya user: uji visual sudah? migrasi 0013 sudah? mau kerja apa?
