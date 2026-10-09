-- ============================================================
-- AutoThreads: skema awal
-- Sumber: docs/skema-database.md bagian 6
-- ============================================================
-- Cara pakai sekali jalan: tempel seluruh isi file ini ke Supabase -> SQL Editor -> Run.
-- Dibungkus satu transaksi supaya kegagalan di tengah tidak meninggalkan skema separuh jadi
-- (kalau error, semuanya dibatalkan dan file ini bisa ditempel ulang tanpa bersih-bersih manual).

begin;

-- Enum
create type content_status as enum ('draft', 'siap_posting', 'terjadwal', 'terkirim', 'gagal');
create type link_placement as enum ('status_terakhir', 'balasan', 'tanpa_link');
create type product_source as enum ('manual', 'scraping');
create type generation_status as enum ('pending', 'done', 'failed');

-- Fungsi updated_at otomatis
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ------------------------------------------------------------
-- products
-- ------------------------------------------------------------
create table products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nama_internal text not null,
  nama text,
  varian text,
  harga numeric(12,0),
  deskripsi text,
  deskripsi_bersih text check (char_length(deskripsi_bersih) <= 3000),
  kategori text,
  sumber product_source not null default 'manual',
  url_referensi text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger products_updated before update on products
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- product_media
-- ------------------------------------------------------------
create table product_media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  storage_path text not null,
  mime_type text not null default 'image/webp',
  ukuran_bytes integer check (ukuran_bytes > 0),
  lebar integer,
  tinggi integer,
  is_referensi_seller boolean not null default false,
  urutan integer not null default 0,
  created_at timestamptz not null default now()
);
create index product_media_product_idx on product_media(product_id, urutan);

-- ------------------------------------------------------------
-- analysis_cache
-- ------------------------------------------------------------
create table analysis_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hash text not null,
  hasil jsonb not null,
  model text not null,
  prompt_version text not null,
  created_at timestamptz not null default now(),
  unique (user_id, hash)
);

-- ------------------------------------------------------------
-- idea_batches dan ideas
-- ------------------------------------------------------------
create table idea_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  batch_id uuid not null references idea_batches(id) on delete cascade,
  judul text not null,
  deskripsi text,
  jembatan text,
  format_label text,
  dipilih boolean not null default false
);

-- ------------------------------------------------------------
-- contents
-- ------------------------------------------------------------
create table contents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idea_id uuid references ideas(id) on delete set null,
  product_id uuid references products(id) on delete set null,
  judul_internal text not null,
  status content_status not null default 'draft',
  pengaturan jsonb not null default '{}'::jsonb,
  letak_link link_placement not null default 'status_terakhir',
  link_produk text,
  tag text[] not null default '{}',
  klik_manual integer not null default 0 check (klik_manual >= 0),
  komisi_manual numeric(12,0) not null default 0 check (komisi_manual >= 0),
  versi integer not null default 1,
  prompt_version text,
  model text,
  is_arsip boolean not null default false,
  arsip_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger contents_updated before update on contents
  for each row execute function set_updated_at();
create index contents_user_status_idx on contents(user_id, status);

-- ------------------------------------------------------------
-- threads_statuses
-- ------------------------------------------------------------
create table threads_statuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id uuid not null references contents(id) on delete cascade,
  urutan integer not null check (urutan >= 1),
  teks text not null check (char_length(teks) between 1 and 500),
  jumlah_karakter integer generated always as (char_length(teks)) stored,
  edited_at timestamptz,
  unique (content_id, urutan)
);

-- ------------------------------------------------------------
-- generations (log AI)
-- ------------------------------------------------------------
create table generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id uuid references contents(id) on delete set null,
  jenis text not null check (jenis in ('analisis', 'ide', 'generate', 'storyboard', 'foto_ke_video')),
  status generation_status not null default 'pending',
  attempts integer not null default 0,
  model text not null,
  prompt_version text not null,
  input_tokens integer,
  output_tokens integer,
  biaya_usd numeric(10,6),
  error text,
  created_at timestamptz not null default now()
);
create index generations_user_created_idx on generations(user_id, created_at desc);

-- ------------------------------------------------------------
-- affiliate_links
-- ------------------------------------------------------------
create table affiliate_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  url text not null,
  catatan text,
  created_at timestamptz not null default now(),
  unique (user_id, url)
);

-- ------------------------------------------------------------
-- templates
-- ------------------------------------------------------------
create table templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nama text not null,
  kategori text,
  isi text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger templates_updated before update on templates
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- settings
-- ------------------------------------------------------------
create table settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{"scraping_aktif": false}'::jsonb,
  updated_at timestamptz not null default now()
);
create trigger settings_updated before update on settings
  for each row execute function set_updated_at();

-- ============================================================
-- Row Level Security: setiap user hanya akses datanya sendiri
-- ============================================================
alter table products enable row level security;
alter table product_media enable row level security;
alter table analysis_cache enable row level security;
alter table idea_batches enable row level security;
alter table ideas enable row level security;
alter table contents enable row level security;
alter table threads_statuses enable row level security;
alter table generations enable row level security;
alter table affiliate_links enable row level security;
alter table templates enable row level security;
alter table settings enable row level security;

create policy owner_all on products for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy owner_all on product_media for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy owner_all on analysis_cache for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy owner_all on idea_batches for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy owner_all on ideas for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy owner_all on contents for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy owner_all on threads_statuses for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy owner_all on generations for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy owner_all on affiliate_links for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy owner_all on templates for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy owner_all on settings for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Storage: bucket privat untuk foto produk
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-media', 'product-media', false, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- Folder pertama nama file = user_id
create policy media_select_own on storage.objects for select to authenticated
  using (bucket_id = 'product-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy media_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'product-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy media_update_own on storage.objects for update to authenticated
  using (bucket_id = 'product-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy media_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'product-media' and (storage.foldername(name))[1] = auth.uid()::text);

commit;
