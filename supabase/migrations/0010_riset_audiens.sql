-- ============================================================
-- Heaviliate: migrasi 0010 — riset audiens dan peluang produk
-- Sumber: docs/content-machine.md bagian 5 (Tahap A), docs/skema-database.md 15
-- ============================================================
-- Cara pakai sekali jalan: tempel seluruh isi file ini ke Supabase -> SQL Editor -> Run.
-- Jalankan SETELAH 0009. Idempoten: create dibungkus "if not exists", policy
-- di-drop lebih dulu, dan constraint generations dibangun ulang dari daftar penuh.
--
-- Kenapa dua tabel ini ada:
--   Di alur lama, ide hanya bisa lahir dari produk yang sudah dibuat
--   (idea_batches.product_id not null). Alur konten yang dipakai sekarang
--   bergerak sebaliknya: pilih niche -> riset masalah audiens -> susun peluang
--   kategori produk -> baru buat produk. Dua tabel ini adalah artefak dua tahap
--   pertama, supaya hasilnya tersimpan dan bisa dibuka lagi, bukan teks yang
--   ditempel ulang ke ChatGPT.

begin;

-- ------------------------------------------------------------
-- audience_riset: satu baris per permintaan riset (10 masalah)
-- ------------------------------------------------------------
create table if not exists audience_riset (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  niche text not null check (char_length(niche) between 1 and 120),
  audiens text not null check (char_length(audiens) between 1 and 200),
  ringkasan text not null check (char_length(ringkasan) <= 4000),
  -- 10 objek { masalah, situasi, produk_contoh[], alasan }. Disimpan jsonb,
  -- bukan tabel anak, karena isinya selalu dibaca utuh per riset.
  masalah jsonb not null default '[]'::jsonb
    check (jsonb_typeof(masalah) = 'array'),
  prompt_version text not null,
  model text,
  created_at timestamptz not null default now()
);

-- Semua query aplikasi: riwayat riset milik satu user, terbaru di atas.
create index if not exists audience_riset_user_created_idx
  on audience_riset(user_id, created_at desc);

alter table audience_riset enable row level security;

drop policy if exists owner_all on audience_riset;
create policy owner_all on audience_riset for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ------------------------------------------------------------
-- peluang_produk: 20 kategori hasil tahap 2, anak dari satu riset
-- ------------------------------------------------------------
create table if not exists peluang_produk (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  riset_id uuid not null references audience_riset(id) on delete cascade,
  urutan integer not null check (urutan between 1 and 20),
  kategori text not null check (char_length(kategori) between 1 and 160),
  alasan text not null check (char_length(alasan) <= 2000),
  masalah_terkait text,
  contoh_produk text[] not null default '{}',
  prioritas text not null default 'sedang'
    check (prioritas in ('tinggi', 'sedang', 'rendah')),
  kesulitan_konten text not null default 'sedang'
    check (kesulitan_konten in ('rendah', 'sedang', 'tinggi')),
  -- User menandai kategori ini sudah dijadikan produk (tombol di /riset).
  dipilih boolean not null default false,
  produk_id uuid references products(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (riset_id, urutan)
);

create index if not exists peluang_produk_user_riset_idx
  on peluang_produk(user_id, riset_id, urutan);

alter table peluang_produk enable row level security;

drop policy if exists owner_all on peluang_produk;
create policy owner_all on peluang_produk for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ------------------------------------------------------------
-- generations.jenis: daftar penuh
-- ------------------------------------------------------------
-- Constraint dibangun ulang dari daftar lengkap supaya file ini tidak
-- bergantung pada 0007 sudah dijalankan atau belum. `carousel` ikut masuk:
-- selama belum ada, biaya carousel ditolak constraint dan pemakaian anggaran
-- bulanan tercatat lebih rendah dari yang sebenarnya.
alter table generations
  drop constraint if exists generations_jenis_check;

alter table generations
  add constraint generations_jenis_check
  check (jenis in (
    'analisis',
    'ide',
    'generate',
    'storyboard',
    'foto_ke_video',
    'naskah_video',
    'carousel',
    'audience',
    'peluang'
  ));

commit;
