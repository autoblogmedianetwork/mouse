-- ============================================================
-- AutoThreads: gaya hook per konten (Fase 6, analitik per hook)
-- Sumber: docs/skema-database.md bagian 6 (tabel contents), PRD F3a + F11
-- ============================================================
-- Cara pakai sekali jalan: tempel seluruh isi file ini ke Supabase -> SQL Editor -> Run.
-- Idempoten: kolom dan index dibungkus "if not exists", jadi ditempel ulang tetap aman.
--
-- Kenapa ada: pengaturan generate sudah punya `gaya_hook` (pertanyaan,
-- masalah_relatif, pernyataan_mengejutkan, bawaan), tapi nilainya tidak pernah
-- disimpan per konten. Tanpa kolom ini, halaman Analitik tidak bisa menjawab
-- "gaya hook mana yang paling banyak klik" (Fase 6, exit criteria).
--
-- Kolom disimpan sebagai text, bukan enum: daftar gaya hook masih bisa
-- bertambah lewat Pengaturan, dan nilai tak dikenal cukup diabaikan aplikasi.

begin;

alter table contents
  add column if not exists gaya_hook text not null default 'bawaan';

create index if not exists contents_user_hook_idx
  on contents(user_id, gaya_hook);

commit;
