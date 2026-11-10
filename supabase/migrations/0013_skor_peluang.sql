-- Migrasi 0013: skor kelayakan peluang (Fase 3-A).
-- Idempoten: aman dijalankan berulang kali.
-- Kolom opsional — tabel lama tanpa skor tetap valid.

alter table peluang_produk
  add column if not exists skor jsonb;

alter table peluang_produk
  add column if not exists skor_total smallint;

-- Catatan bentuk `skor` (ditulis oleh API, dibaca UI):
-- { "permintaan": 1-5, "kompetisi": 1-5, "kemudahan_konten": 1-5,
--   "potensi_komisi": 1-5, "alasan": { per dimensi, maks 300 char } }
-- `skor_total` = jumlah keempat nilai (4-20); >= 16 ditandai "layak duluan".
