-- AutoThreads: mode naskah video (prompt 09) mencatat generasi dengan jenis
-- sendiri supaya statistik biaya di Widget biaya bisa memisahkannya dari
-- generate status biasa.
--
-- Catatan: migrasi 0006 (posts) belum dijalankan di Supabase; jalankan berurutan
-- (0006 lalu 0007) di SQL Editor sesuai docs/skema-database.md bagian 12.

alter table generations
  drop constraint if exists generations_jenis_check;

alter table generations
  add constraint generations_jenis_check
  check (jenis in ('analisis', 'ide', 'generate', 'storyboard', 'foto_ke_video', 'naskah_video'));
