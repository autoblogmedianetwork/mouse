-- 0011: plafon teks threads_statuses 500 -> 2200 (ADR 0020)
--
-- Mode output teks bertambah: WhatsApp Status (700) dan Caption TikTok (2200).
-- Constraint lama (check 500, migrasi 0001, tanpa nama eksplisit sehingga
-- Postgres menamai otomatis `threads_statuses_teks_check`) memblokir konten
-- platform tersebut. Batas per-platform tetap dijaga di kode
-- (lib/platforms/batas.ts); database hanya menjaga plafon tertinggi.
--
-- Tidak ada data yang diubah: semua baris yang ada <= 500 tetap lolos.

alter table threads_statuses
  drop constraint threads_statuses_teks_check;

alter table threads_statuses
  add constraint threads_statuses_teks_batas_check check (char_length(teks) between 1 and 2200);
