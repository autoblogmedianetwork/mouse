# Skema Database: AutoThreads (Supabase)

**Sumber kebenaran untuk struktur data.** Jika ada perbedaan dengan PRD, file ini yang dipakai, lalu PRD diperbarui.
**Migrasi pertama:** `supabase/migrations/0001_init.sql` (isi SQL di bagian 6).

---

## 1. Prinsip

1. Setiap tabel punya `user_id` dan RLS. User hanya bisa membaca dan menulis datanya sendiri.
2. Foto disimpan di Supabase Storage. Tabel hanya menyimpan path dan metadata.
3. Teks hasil AI disimpan di tabel, bukan di file, supaya bisa dicari dan dihitung.
4. Setiap konten menyimpan versi prompt dan model yang dipakai, supaya hasilnya bisa dilacak.
5. Semua konten dimulai dengan status `draft`. Tidak ada default ke `siap_posting`.

---

## 2. Relasi Antar Tabel

```
auth.users
 ├─ products ──┬─ product_media (Storage path)
 │             ├─ affiliate_links
 │             └─ idea_batches ── ideas
 │                                  └─ contents ──┬─ threads_statuses
 │                                                ├─ generations (log AI dan biaya)
 │                                                 
 ├─ analysis_cache (hash deskripsi → hasil analisis)
 ├─ templates
 └─ settings
```

---

## 3. Enum

```sql
create type content_status as enum ('draft', 'siap_posting', 'terjadwal', 'terkirim', 'gagal');
create type link_placement as enum ('status_terakhir', 'balasan', 'tanpa_link');
create type product_source as enum ('manual', 'scraping');
create type generation_status as enum ('pending', 'done', 'failed');
```

---

## 4. Tabel

### products
Produk yang dianalisis. Diisi manual dulu (K5: scraping mati).

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid pk | default gen_random_uuid() |
| user_id | uuid | referensi auth.users |
| nama_internal | text | wajib, untuk pencarian dan tampilan |
| nama | text | nama dari listing |
| varian | text | varian yang dipilih user |
| harga | numeric(12,0) | rupiah, tanpa desimal |
| deskripsi | text | hasil salin dari Shopee |
| deskripsi_bersih | text | hasil pembersihan (maks 3.000 karakter) |
| kategori | text | opsional |
| sumber | product_source | default 'manual' |
| url_referensi | text | link Shopee, hanya referensi |
| created_at, updated_at | timestamptz | |

### product_media
Metadata foto atau video. File ada di Storage.

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid pk | |
| user_id | uuid | |
| product_id | uuid | cascade delete |
| storage_path | text | `{user_id}/{product_id}/{nama-file}.webp` |
| mime_type | text | image/webp |
| ukuran_bytes | integer | setelah kompresi |
| lebar, tinggi | integer | |
| is_referensi_seller | boolean | true jika foto dari listing seller (F0) |
| urutan | integer | urutan carousel |
| created_at | timestamptz | |

### analysis_cache
Menghindari analisis ulang produk yang sama (F-cache di PRD 15.1).

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid pk | |
| user_id | uuid | |
| hash | text | sha256 dari deskripsi_bersih + varian + versi prompt |
| hasil | jsonb | JSON hasil analisis |
| model | text | misalnya gemini-2.5-flash-lite |
| prompt_version | text | misalnya analisis-produk.v1 |
| created_at | timestamptz | |

Unique: `(user_id, hash)`.

### idea_batches and ideas

| Tabel | Kolom penting |
|---|---|
| idea_batches | id, user_id, product_id (cascade), created_at |
| ideas | id, user_id, batch_id (cascade), judul, deskripsi, jembatan, format_label, dipilih (bool, default false) |

### contents
Satu konten Threads (utas) hasil generate.

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid pk | |
| user_id | uuid | |
| idea_id | uuid | set null jika ide dihapus |
| product_id | uuid | set null jika produk dihapus |
| judul_internal | text | |
| status | content_status | default 'draft' |
| pengaturan | jsonb | jumlah status, panjang, instruksi, anti_ai_slop, persona |
| letak_link | link_placement | default 'status_terakhir' |
| link_produk | text | |
| tag | text[] | default '{}' |
| klik_manual | integer | default 0 |
| komisi_manual | numeric(12,0) | default 0 |
| versi | integer | default 1, bertambah saat regenerate |
| prompt_version | text | |
| model | text | |
| is_arsip | boolean | default false |
| arsip_at | timestamptz | dipakai untuk retensi (K3) |
| created_at, updated_at | timestamptz | |

Aturan: jika `updated_at` berubah setelah status `siap_posting`, status diubah ke `draft` (lihat UI-Spec 5.3). Ini dikerjakan di aplikasi, bukan di database.

### threads_statuses
Status per konten.

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid pk | |
| user_id | uuid | |
| content_id | uuid | cascade delete |
| urutan | integer | wajib, unik per konten |
| teks | text | wajib, maksimal 500 karakter (dijaga constraint) |
| jumlah_karakter | integer | generated, dihitung otomatis |
| edited_at | timestamptz | |

### generations
Log setiap panggilan AI. Dipakai untuk dashboard biaya (Fase 5) dan debugging.

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid pk | |
| user_id | uuid | |
| content_id | uuid | nullable, karena analisis produk tidak terkait konten |
| jenis | text | analisis, ide, generate, storyboard, foto_ke_video |
| status | generation_status | |
| attempts | integer | jumlah percobaan |
| model | text | |
| prompt_version | text | |
| input_tokens, output_tokens | integer | |
| biaya_usd | numeric(10,6) | |
| error | text | pesan singkat, tanpa data pribadi |
| created_at | timestamptz | |

### affiliate_links
Daftar link affiliate untuk halaman Link Affiliate (F5).

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid pk | |
| user_id | uuid | |
| product_id | uuid | set null |
| url | text | |
| catatan | text | |
| created_at | timestamptz | |

Unique: `(user_id, url)`.

### templates

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid pk | |
| user_id | uuid | |
| nama | text | |
| kategori | text | |
| isi | text | dengan placeholder `{{NAMA_PRODUK}}` dan lainnya |
| created_at, updated_at | timestamptz | |

### settings
Satu baris per user.

| Kolom | Tipe | Keterangan |
|---|---|---|
| user_id | uuid pk | |
| data | jsonb | model default, batas biaya (K6), aturan kepercayaan, retensi, scraping (default false) |
| updated_at | timestamptz | |

---

## 5. Storage

Satu bucket privat: `product-media`.

- Struktur path: `{user_id}/{product_id}/{uuid}.webp`
- Bucket tidak publik. Akses lewat signed URL yang berlaku singkat (misalnya 1 jam).
- Hanya pemilik folder (user_id di nama folder pertama) yang bisa baca, tulis, dan hapus.

**Aturan kompresi di klien (sebelum upload):**
- Sisi terpanjang maksimal 1080 px, rasio asli dipertahankan.
- Format WebP, kualitas sekitar 0,8.
- Jika ukuran asli di bawah 300 KB dan sudah WebP, tidak dikompres ulang.
- Target hasil sekitar 150 sampai 300 KB per foto.
- Dikerjakan dengan Canvas API di browser. Tidak perlu tool terpisah. Library opsional seperti `browser-image-compression` juga bisa.
- Video tidak dikompres di klien. Batas video di MVP: 30 detik dan 50 MB. Untuk F7 video, user tetap membuat video di Google Flow, bukan diunggah.

**Estimasi kapasitas:** dengan rata-rata 200 KB per foto, 1 GB dapat menampung sekitar 5.000 foto. Batas free tier Storage perlu dicek di halaman harga Supabase.

---

## 6. Migrasi Awal (0001_init.sql)

```sql
-- ============================================================
-- AutoThreads: skema awal
-- ============================================================

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
```

---

## 7. Catatan Implementasi

- **Retensi (K3):** konten yang diarsipkan lebih dari 90 hari sejak `arsip_at` dihapus beserta foto di Storage. Dikerjakan oleh Edge Function terjadwal di Fase 5, bukan di migrasi awal.
- **Hapus produk:** menghapus produk menghapus `product_media` (cascade), tapi file di Storage harus dihapus lewat kode, karena database tidak menghapus file.
- **Versi prompt:** setiap pemanggilan AI menyimpan `prompt_version` di `generations` dan di `contents`.
- **Validasi 500 karakter:** dijaga dua kali, di kode (sebelum simpan) dan di database (constraint).
- **Status siap posting:** database menyimpannya, tapi aturan "kembali ke draft saat diedit" dijalankan oleh aplikasi.
- **Fase 7 (auto-posting):** tabel `posts` dan `threads_accounts` ditambahkan saat M6, bukan sekarang.
- **Free tier:** jeda otomatis jika tidak dipakai beberapa hari. Cek batas storage dan database di halaman harga sebelum Fase 1.
