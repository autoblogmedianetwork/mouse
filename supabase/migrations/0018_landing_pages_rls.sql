-- 0018_landing_pages_rls — tutup tabel landing_pages milik 0017.
--
-- Masalah: 0017 membuat tabel tanpa RLS. Karena anon key ikut terkirim ke
-- browser, tanpa RLS siapa pun bisa membaca, menambah, dan menghapus baris di
-- tabel itu lewat PostgREST. Migrasi ini menutupnya dan mengikat tiap baris ke
-- pemiliknya, sama seperti tabel lain di proyek ini.

-- 1. Milik siapa baris ini. Nullable supaya baris lama tidak menggagalkan migrasi.
alter table landing_pages
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

-- 2. Slug cukup unik per pengguna, bukan unik global.
--    Tanpa ini, dua pengguna tidak bisa memakai slug yang sama.
alter table landing_pages
  drop constraint if exists landing_pages_slug_key;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'landing_pages_user_slug_key'
  ) then
    alter table landing_pages
      add constraint landing_pages_user_slug_key unique (user_id, slug);
  end if;
end
$$;

-- 3. RLS: baris hanya terlihat dan bisa diubah oleh pemiliknya.
alter table landing_pages enable row level security;

drop policy if exists "landing_pages_select_milik" on landing_pages;
create policy "landing_pages_select_milik" on landing_pages
  for select using (auth.uid() = user_id);

drop policy if exists "landing_pages_insert_milik" on landing_pages;
create policy "landing_pages_insert_milik" on landing_pages
  for insert with check (auth.uid() = user_id);

drop policy if exists "landing_pages_update_milik" on landing_pages;
create policy "landing_pages_update_milik" on landing_pages
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "landing_pages_delete_milik" on landing_pages;
create policy "landing_pages_delete_milik" on landing_pages
  for delete using (auth.uid() = user_id);

-- 4. Baris lama tanpa pemilik tidak bisa diakses siapa pun; hapus supaya bersih.
delete from landing_pages where user_id is null;

comment on table landing_pages is
  'Metadata halaman landing statis dari Lab Iklan. Satu baris milik satu pengguna (RLS).';
