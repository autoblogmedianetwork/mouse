-- Migrasi 0015: catat provider AI yang dipakai per panggilan.
-- Nama provider (dari ai_provider.nama) atau 'env' bila memakai env server.
-- Nullable: baris lama sebelum migrasi ini tidak punya informasi provider.

alter table generations
  add column if not exists provider text;
