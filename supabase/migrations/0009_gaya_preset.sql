-- ============================================================
-- Migrasi 0009: preset gaya carousel per akun
-- Fitur: panel "Gaya Slide" dapat menyimpan tema favorit user
-- (skala font, warna aksen, posisi konten, kelonggaran) sebagai
-- preset yang bisa diterapkan ke setiap carousel baru.
-- ============================================================

create table if not exists carousel_gaya_preset (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nama text not null,
  gaya jsonb not null,           -- { skalaFont, warnaAksen, posisiKonten, ruangKeliling }
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, nama)
);

create or replace trigger carousel_gaya_preset_updated before update on carousel_gaya_preset
  for each row execute function set_updated_at();

-- Index utama semua query: daftar preset milik satu user.
create index if not exists carousel_gaya_preset_user_idx
  on carousel_gaya_preset(user_id, updated_at desc);

alter table carousel_gaya_preset enable row level security;

drop policy if exists owner_all on carousel_gaya_preset;
create policy owner_all on carousel_gaya_preset for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
