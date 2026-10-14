-- ============================================================
-- AutoThreads: kolom jadwal konten (Fase 6, kalender)
-- Sumber: docs/skema-database.md bagian 6 (tabel contents), UI-Spec 3.4
-- ============================================================
-- Cara pakai sekali jalan: tempel seluruh isi file ini ke Supabase -> SQL Editor -> Run.
-- Idempoten: kolom dan index dibungkus "if not exists", jadi ditempel ulang tetap aman.
--
-- Catatan: halaman Kalender saat ini menyimpan jadwal di localStorage klien.
-- Kolom ini menyiapkan bentuk sinkron: objek konten lokal sudah punya field
-- `jadwal_at` dengan nama sama, sehingga saat konten disalin ke `contents` nilainya
-- langsung cocok tanpa mengubah kode lagi.

begin;

alter table contents add column if not exists jadwal_at timestamptz;

create index if not exists contents_user_jadwal_idx
  on contents(user_id, jadwal_at);

commit;
