# ADR 0008: Batas karakter platform disimpan di kode, bukan di tabel `platforms`

Status: diterima
Tanggal: 15 Oktober 2026

## Konteks

MVP hanya Threads dengan batas 500 karakter, jadi batas itu di-hard-code di
`lib/statuses/validator-500.ts`. Fitur 9 menambah X sebagai platform output
kedua dengan batas 280 karakter, dan prompt 03 harus tahu batas platform yang
dipilih (prompt v3, lihat `lib/ai/prompts/generate-status.v3.ts`).

Tabel `platforms` (migrasi 0002) sudah punya kolom `batas_karakter`, dan
`docs/Workflow-Heaviliate.md` bagian multi-platform menulis bahwa batas
disimpan di tabel, bukan di kode. Tapi baris `platforms` sengaja kosong di
migrasi, RLS-nya baca-saja untuk `authenticated`, dan membaca DB hanya untuk
menampilkan angka batas di form menambah latensi dan kegagalan baru (form
generate harus tetap jalan saat Supabase down, mengikuti pola fallback manual
yang sudah ada).

## Keputusan

1. Batas karakter per platform (Threads 500, X 280) disimpan di
   `lib/platforms/batas.ts` sebagai data kode, bersama daftar mode output
   (`threads`, `x`, `naskah_video`) dan label UI-nya.
2. Prompt 03 versi v3 menerima parameter `platform` dan menurunkan batas ke
   prompt dari modul itu; skema Zod `statusesSkema` menerima batas yang sama,
   jadi jawaban model yang kepanjangan langsung di-retry (AGENTS aturan 7 dan 9).
3. `validateStatus`, `validateStatusList`, dan `splitIntoStatuses` menerima
   parameter batas opsional dengan default batas Threads, sehingga semua pemanggil
   lama tidak berubah dan X mengoper 280 lewat UI.
4. Nilai di `platforms.batas_karakter` tetap dibiarkan; kalau nanti dibutuhkan
   (misalnya saat Fase 7 menambah platform dari UI), hanya `lib/platforms/batas.ts`
   yang berubah menjadi membaca DB dengan cache.

## Alternatif yang ditolak

- **Membaca `platforms.batas_karakter` dari Supabase saat render form.** Form
  generate tidak pernah bergantung pada DB (input manual selalu tersedia,
  AGENTS aturan 5); menambah query ke jalur itu memperluas permukaan kegagalan
  untuk dua angka konstan.
- **Mengganti kolom di `pengaturan`/settings.** Batas adalah fungsi platform,
  bukan preferensi user; mengulanginya di tempat lain membuat dua sumber
  kebenaran.
- **Hard-code 280 di komponen X.** Memecah aturan "batas dijaga di kode dan
  constraint database" karena editor, preview, pemisah, dan prompt akan punya
  angka yang berbeda-beda.

## Konsekuensi

- Menambah platform baru berarti satu entri di `BATAS_PLATFORM` plus baris di
  `LABEL_MODE_OUTPUT`; UI pemilih mode mengikut otomatis.
- Angka 280 dan 500 harus dicek ulang dari dokumentasi resmi tiap platform
  sebelum dipakai ulang (catatan di `lib/platforms/batas.ts`).
- Nomor versi prompt 03: v3 untuk batas platform (fitur ini). Fitur format
  narasi 6 tahap memakai v4 (pergeseran dari rencana awal yang menulis v3;
  catatan di `docs/glosarium.md`).
