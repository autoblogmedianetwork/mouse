-- ============================================================
-- AutoThreads: tabel posts — log pengiriman (Fase 7, auto-posting Threads)
-- Sumber: docs/skema-database.md bagian 11, ADR 0007
-- ============================================================
-- Cara pakai sekali jalan: tempel seluruh isi file ini ke Supabase -> SQL Editor -> Run.
-- Idempoten: semua create dibungkus "if not exists" dan policy di-drop lebih dulu.
--
-- Kenapa ada: exit criteria Fase 7 butuh bukti "posting berhasil dan status
-- tercatat", sekaligus sumber kuota 24 jam yang tidak bisa dipalsukan klien.
-- Setiap percobaan kirim ditulis satu baris, berhasil maupun gagal.
--
-- Catatan content_id: sengaja text TANPA foreign key ke contents. Pustaka konten
-- masih hidup di localStorage, jadi id-nya (hasil crypto.randomUUID atau impor
-- lama) belum tentu ada di tabel contents. Foreign key sekarang akan membuat
-- insert gagal dan log-nya hilang diam-diam. FK ditambahkan bersamaan dengan
-- migrasi pustaka konten ke Supabase (lihat docs/skema-database.md bagian 11).

begin;

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id text not null,
  judul text not null,
  platform text not null default 'threads',
  penyedia text not null default 'manual'
    check (penyedia in ('manual', 'threads_api')),
  status text not null check (status in ('terkirim', 'gagal')),
  -- ID postingan akar di platform (Threads media id), null untuk mode manual.
  id_platform text,
  jumlah_terkirim integer not null default 0 check (jumlah_terkirim >= 0),
  jumlah_status integer not null default 0 check (jumlah_status >= 0),
  mode text not null default 'manual' check (mode in ('manual', 'auto')),
  error text,
  created_at timestamptz not null default now()
);

create index if not exists posts_user_created_idx on posts(user_id, created_at desc);
create index if not exists posts_content_idx on posts(user_id, content_id);

alter table posts enable row level security;

-- drop policy lebih dulu supaya file ini aman ditempel ulang.
drop policy if exists owner_all on posts;

-- auth.uid() dibungkus select agar dievaluasi sekali per query, bukan per baris.
create policy owner_all on posts for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

commit;
