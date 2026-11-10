-- Migrasi 0014: provider AI per user (Gelombang 3, opsi B).
-- Kunci API disimpan terenkripsi (AES-256-GCM) di server; RLS membatasi per user.

create table if not exists ai_provider (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nama text not null,
  base_url text not null,
  model text not null,
  api_key_enc text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table ai_provider enable row level security;

drop policy if exists "ai_provider_owner_all" on ai_provider;
create policy "ai_provider_owner_all" on ai_provider
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Satu provider aktif per user.
create unique index if not exists ai_provider_one_active_per_user
  on ai_provider (user_id) where (is_active = true);
