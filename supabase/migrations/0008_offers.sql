-- ============================================================
-- Heaviliate: tabel offers — penawaran affiliate (Marketplace & Non-Marketplace)
-- Sumber: Penambahan konsep sumber penawaran (Marketplace, Manual, Dari link)
-- ============================================================
-- Idempoten: semua create dibungkus "if not exists" dan policy di-drop lebih dulu.

begin;

create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null default 'manual'
    check (source_type in ('marketplace', 'manual', 'link')),
  category text not null default 'marketplace'
    check (category in ('hosting', 'saas', 'course', 'marketplace', 'other')),
  name text not null,
  affiliate_url text not null,
  price text,
  features text,
  image_url text,
  marketplace_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists offers_user_created_idx on offers(user_id, created_at desc);
create index if not exists offers_category_idx on offers(user_id, category);

alter table offers enable row level security;

-- drop policy lebih dulu supaya file ini aman ditempel ulang.
drop policy if exists owner_all on offers;

create policy owner_all on offers for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

commit;
