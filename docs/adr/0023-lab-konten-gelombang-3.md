# ADR 0023: Lab Konten — Lab Uji, Ide dari Masalah, Serial 7 Hari

Status: diterima
Tanggal: 2026-11-11

## Konteks

Gelombang 3 meminta tiga alat berbasis AI: simulator pembeli, mesin ide dari bank
masalah riset, dan serial konten 7 hari. Proyek sudah punya jalur AI bersama
(`generate-json` → `jalankanAI`), prompt berversi, skema Zod, dan gerbang sesi
(`wajibSesi`). Semua fitur baru harus memakai jalur itu, bukan panggilan API
langsung dari komponen (AGENTS aturan 6 dan 11).

## Keputusan

1. **Satu halaman `/lab`** berisi tiga bagian, karena ketiganya adalah alat
   tinjauan sebelum posting dan berbagi pola unggah → hasil → salin.
2. **Prompt berversi** (tidak menimpa versi lama):
   - `lab-uji.v1` — tiga persona (`skeptis`, `ibu_muda`, `mahasiswa`), skor
     0–100, reaksi/keberatan/saran per persona.
   - `ide-masalah.v1` — satu masalah → tepat 3 hook dengan sudut berbeda.
   - `serial-7-hari.v1` — satu produk → 7 hari; hari 1–2 tanpa jualan, hari 5
     wajib jujur soal kekurangan, hari 7 ajakan halus.
   Semua prompt memakai `ATURAN_BAHASA` dan melarang klaim absolut.
3. **Skema Zod** di `lib/ai/schemas.ts`, divalidasi di rute dengan satu retry
   (aturan 9). Jumlah item dikunci (`length(3)`, `length(7)`).
4. **Rute**: `POST /api/lab-uji`, `/api/ide-masalah`, `/api/serial-7-hari`.
   Ketiganya `wajibSesi`, memakai `jalankanAI`, dan menghormati batas biaya
   bulanan (429 saat anggaran habis).
5. **`generations.jenis` tetap memakai nilai yang sudah diizinkan** constraint
   migrasi 0010 — `audience` (lab uji), `ide` (mesin ide), `generate` (serial) —
   supaya tidak perlu migrasi baru hanya untuk label biaya. Pemetaan ini dicatat
   di sini agar tidak dianggap salah tulis.
6. **Hasil selalu draft.** Tidak ada tombol yang langsung mengubah status konten
   menjadi `siap_posting`; pengguna menyalin hasil ke editor dan melewati
   checklist seperti biasa (PRD F0).

## Konsekuensi

- Tidak ada dependency baru; semua lewat jalur AI yang sudah ada.
- Butuh `AI_BASE_URL`/`AI_API_KEY`/`AI_MODEL` yang hidup. Bila provider gagal,
  rute menjawab 502 dengan pesan dari `generate-json`, dan UI menampilkannya apa
  adanya (tanpa hasil palsu).
- Biaya ketiga alat tercatat di dashboard biaya dengan jenis masing-masing.
