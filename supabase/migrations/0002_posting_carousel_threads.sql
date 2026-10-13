-- ============================================================
-- AutoThreads: provider posting, varian platform, carousel, dan akun Threads
-- Sumber: docs/skema-database.md bagian 9.1-9.4, ADR 0002
-- ============================================================
-- Cara pakai sekali jalan: tempel seluruh isi file ini ke Supabase -> SQL Editor -> Run.
-- Dibungkus satu transaksi supaya kegagalan di tengah tidak meninggalkan skema separuh jadi
-- (kalau error, semuanya dibatalkan dan file ini bisa ditempel ulang tanpa bersih-bersih manual).
--
-- Belum ada kode aplikasi yang membaca tabel di migrasi ini. UI carousel, akun Threads, dan
-- varian platform baru dikerjakan mulai Fase 7, jadi migrasi ini menyiapkan tempatnya dulu.
--
-- Catatan cakupan: tidak ada tabel `provider_per_fungsi` di sini. ADR 0002 memutuskan provider
-- dipilih lewat environment variable, bukan baris database, dan docs/ai-provider.md menegaskan
-- kunci API hanya hidup di environment server. Menyimpan kunci di kolom database akan
-- melanggar AGENTS aturan 11.

begin;

-- ============================================================
-- 9.1 Provider posting dan varian platform (ADR 0002)
-- ============================================================

-- Provider posting disimpan per konten, default mode manual (AGENTS aturan 7).
alter table contents add column if not exists posting_provider text not null default 'manual'
  check (posting_provider in ('manual', 'threads_api', 'buffer', 'metricool', 'postiz', 'mixpost'));

-- Tabel acuan platform: tidak punya user_id karena isinya sama untuk semua user.
-- RLS tetap diaktifkan supaya anon key di klien tidak bisa membacanya. Hanya ada policy
-- select; penulisan (menambah platform baru) lewat service role di server.
-- Barisnya sengaja tidak diisi di sini: 'threads' baru masuk saat adapter platform dibuat.
create table if not exists platforms (
  kode text primary key,
  nama text not null,
  batas_karakter integer,
  aktif boolean not null default false
);

create table if not exists content_variants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id uuid not null references contents(id) on delete cascade,
  platform text not null references platforms(kode),
  format text,
  teks text,
  unique (content_id, platform)
);
create index if not exists content_variants_content_idx on content_variants(content_id);
create index if not exists content_variants_platform_idx on content_variants(platform);

-- ============================================================
-- 9.2 Status konten `ditolak` (F10, antrian review)
-- ============================================================
-- Nilai enum tidak bisa dihapus lagi setelah ditambahkan. Di PostgreSQL 12+ perintah ini boleh
-- berada di dalam transaksi, dengan syarat nilai barunya belum dipakai di transaksi yang sama.
alter type content_status add value if not exists 'ditolak';

-- ============================================================
-- 9.3 Carousel (F9, docs/fitur-carousel.md bagian 9)
-- ============================================================
-- Batas 3-10 slide, 8 kata di headline, dan 25 kata di isi dijaga di kode, bukan di database.
-- Renderer default `off`, jadi path_render boleh kosong.
create table if not exists carousel_slides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id uuid not null references contents(id) on delete cascade,
  urutan integer not null,
  peran text not null check (peran in ('cover', 'isi', 'cta')),
  kicker text,
  headline text,
  isi text,
  template text,
  rasio text not null default '4:5' check (rasio in ('4:5', '1:1')),
  path_render text,
  created_at timestamptz not null default now(),
  unique (content_id, urutan)
);
create index if not exists carousel_slides_content_idx on carousel_slides(content_id);

-- ============================================================
-- 9.4 Akun Threads dan masa berlaku token (Fase 7)
-- ============================================================
-- token_terenkripsi hanya dibaca di server; policy di bawah melindungi barisnya, bukan isi
-- kolomnya. Enkripsi dan pembacaan token tetap tanggung jawab kode server (AGENTS aturan 11).
create table if not exists threads_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  threads_user_id text not null,
  nama_tampilan text,
  token_terenkripsi text not null,
  token_kedaluwarsa_at timestamptz,
  status_koneksi text not null default 'terhubung'
    check (status_koneksi in ('terhubung', 'akan_kedaluwarsa', 'kedaluwarsa')),
  terakhir_diperbarui_at timestamptz not null default now(),
  unique (user_id, threads_user_id)
);
create index if not exists threads_accounts_user_idx on threads_accounts(user_id);

-- ============================================================
-- Row Level Security: setiap user hanya akses datanya sendiri
-- ============================================================
alter table platforms enable row level security;
alter table content_variants enable row level security;
alter table carousel_slides enable row level security;
alter table threads_accounts enable row level security;

-- drop policy lebih dulu supaya file ini aman ditempel ulang (create policy tidak idempoten).
drop policy if exists platform_read on platforms;
drop policy if exists owner_all on content_variants;
drop policy if exists owner_all on carousel_slides;
drop policy if exists owner_all on threads_accounts;

-- `platforms` hanya bisa dibaca user yang login. Tidak ada policy insert/update/delete,
-- jadi tidak ada satu pun klien yang bisa mengubah daftar platform.
create policy platform_read on platforms for select to authenticated
  using (true);

-- auth.uid() dibungkus select agar dievaluasi sekali per query, bukan per baris.
create policy owner_all on content_variants for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy owner_all on carousel_slides for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy owner_all on threads_accounts for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

commit;
