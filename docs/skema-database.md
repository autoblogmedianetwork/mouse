# Skema Database: Heaviliate (Supabase)

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
| model | text | misalnya nvidia/nemotron-3-super-120b-a12b:free (ikut AI_MODEL) |
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
| gaya_hook | text | gaya hook pembuka yang dipakai saat generate (Fase 6, PRD F3a). Nilai: `pertanyaan`, `masalah_relatif`, `pernyataan_mengejutkan`, `bawaan` |
| link_produk | text | |
| tag | text[] | default '{}' |
| klik_manual | integer | default 0 |
| komisi_manual | numeric(12,0) | default 0 |
| versi | integer | default 1, bertambah saat regenerate |
| prompt_version | text | |
| model | text | |
| jadwal_at | timestamptz | penanda jadwal kalender (Fase 6). Diisi hanya saat status `terjadwal` |
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
| jenis | text | analisis, ide, generate, storyboard, foto_ke_video, naskah_video (migrasi 0007) |
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

### carousel_gaya_preset
Preset gaya carousel per akun (panel "Gaya Slide", migrasi 0009). Satu preset menyimpan empat field gaya
yang sama dengan panel: `skalaFont` (70–150), `warnaAksen` (hex atau string kosong = ikut tema),
`posisiKonten` (`atas` | `tengah`), `ruangKeliling` (90–140). Format `gaya` divalidasi Zod di
`lib/konten/gaya-preset.ts`.

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid pk | |
| user_id | uuid | cascade delete |
| nama | text | nama preset, unik per user |
| gaya | jsonb | empat field gaya di atas |
| created_at, updated_at | timestamptz | |

Unique: `(user_id, nama)`. RLS: `owner_all` dengan `(select auth.uid()) = user_id`.
Untuk nilai default di aplikasi (skala 100, aksen ikut tema, posisi tengah, kelonggaran 100):
`PENGATURAN_GAYA_AWAL` di `lib/konten/gaya-preset.ts`.

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
-- Heaviliate: skema awal
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

---

## 8. Migrasi 0003: tabel performa affiliate (file siap, belum dijalankan di project)

Status: file `supabase/migrations/0003_performa_affiliate.sql` sudah ada di repo (11 Oktober 2026) dan
**belum dijalankan** di project Supabase. Cara menjalankan: tempel seluruh isi file ke Supabase →
SQL Editor → Run. Nomor 0003 dipakai karena 0002 sudah dipesan untuk "provider per fungsi +
`content_variants`" yang belum dibuat.

Isi file tersebut:

| Objek | Ringkasan |
|---|---|
| `marketplace`, `status_pesanan` | Enum baru, sejajar `lib/impor/skema.ts` |
| `performa_imports` | Satu baris per berkas: nama, marketplace, jumlah baris/ditolak, pemisah, skor deteksi, `komisi_total`, `gmv_total` |
| `performa_rows` | Baris penjualan atau baris klik: `sub_id`, `klik`, `jenis`, `status_kode`, `komisi` (boleh negatif), `tanggal date` |
| Index | `performa_imports(user_id, created_at desc)`; `performa_rows(user_id, tanggal desc)`, `(user_id, marketplace)`, `(import_id)` |
| RLS | `owner_all` di kedua tabel dengan `(select auth.uid()) = user_id` |
| `affiliate_links.sub_id` | Kolom baru + unique index `(user_id, lower(sub_id))` untuk kode pelacak per konten (ADR 0005) |

Tiga hal yang berbeda dari draft lama di bagian bawah dokumen ini:

1. `tanggal` ikut masuk kunci unique. Tanpa itu, laporan ringkasan produk (tanpa ID pesanan) untuk
   produk yang sama di hari berbeda akan saling menimpa.
2. `klik` dan `jenis` masuk sebagai kolom tabel, bukan `alter table` terpisah.
3. `komisi_total` dan `gmv_total` disimpan di `performa_imports` supaya daftar "Sumber data" di
   halaman Analitik tidak perlu menjumlah ulang semua baris hanya untuk satu angka.

Catatan yang masih berlaku:

- `komisi` boleh negatif karena laporan memuat retur dan pembatalan.
- `tanggal` boleh null dan null dianggap berbeda oleh unique index, jadi aplikasi sebaiknya mengisi
  tanggal impor untuk baris yang laporannya tidak punya kolom tanggal.
- Agregasi (komisi cair, GMV, tren bulanan, konversi) tetap dihitung di aplikasi lewat
  `lib/impor/performa.ts` dan `lib/performa/atribusi.ts`, bukan di database.
- Konten yang belum punya `sub_id` tetap sah: yang dipakai adalah kode pelacak hasil hitungan dari
  id konten, bukan kolom baru di `contents`.

### 8.1 Draft lama (arsip, jangan dipakai sebagai acuan)

Bagian di bawah ini adalah draft pertama sebelum file migrasi dibuat. Bentuk finalnya ada di
`supabase/migrations/0003_performa_affiliate.sql`. Disimpan hanya sebagai catatan sejarah.

Dipakai oleh fitur impor laporan affiliate (ADR 0004, halaman `/impor` dan `/analitik`). Bentuk
kolomnya sudah dipakai apa adanya oleh `lib/impor/skema.ts` di localStorage, jadi migrasi nanti hanya
memindahkan field.

```sql
-- 0003_performa_affiliate.sql (draft awal, sudah digantikan oleh file migrasi di repo)

create type marketplace as enum ('shopee', 'tiktok', 'tokopedia', 'lainnya');
create type status_pesanan as enum ('selesai', 'menunggu', 'batal', 'lainnya');

-- Satu baris per impor berkas, untuk jejak dan tombol "batalkan impor".
create table performa_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nama_berkas text not null,
  marketplace marketplace not null,
  jumlah_baris integer not null default 0,
  jumlah_ditolak integer not null default 0,
  pemisah text,                            -- ',', ';', '\t', atau 'xlsx'
  skor_deteksi integer not null default 0,
  created_at timestamptz not null default now()
);

-- Baris performa hasil impor. Unik per pesanan+produk supaya impor ulang
-- memperbarui baris lama, bukan menggandakan komisi (ADR 0004).
create table performa_rows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  import_id uuid not null references performa_imports(id) on delete cascade,
  marketplace marketplace not null,
  id_pesanan text not null default '',
  produk text not null default '',
  varian text not null default '',
  tanggal date,
  jumlah numeric(12,2) not null default 1,
  harga numeric(14,2) not null default 0 check (harga >= 0),
  komisi numeric(14,2) not null default 0,
  tingkat_komisi numeric(6,2),
  status_pesanan text not null default '',
  status_kode status_pesanan not null default 'lainnya',
  sub_id text not null default '',
  updated_at timestamptz not null default now(),
  unique (user_id, marketplace, id_pesanan, produk)
);

create index performa_rows_user_tanggal_idx on performa_rows(user_id, tanggal desc);
create index performa_rows_user_marketplace_idx on performa_rows(user_id, marketplace);

alter table performa_imports enable row level security;
alter table performa_rows enable row level security;
create policy owner_all on performa_imports for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy owner_all on performa_rows for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Catatan:

- `komisi` boleh negatif karena laporan memuat retur dan pembatalan.
- Baris tanpa `id_pesanan` (laporan ringkasan produk) tetap disimpan; keunikannya dibedakan lewat
  kombinasi `produk`.
- Agregasi (komisi cair, GMV, tren bulanan) dihitung di aplikasi lewat `lib/impor/performa.ts`
  supaya aturannya teruji unit dan bisa dipakai saat data masih di localStorage.

Tambahan untuk migrasi yang sama (atribusi komisi per konten, ADR 0005):

```sql
-- Kode pelacak per link affiliate, dipakai mencocokkan laporan dengan konten.
alter table affiliate_links add column sub_id text;
create unique index affiliate_links_user_subid_idx
  on affiliate_links(user_id, lower(sub_id)) where sub_id is not null;

-- Baris klik dari ekspor analitik marketplace tidak dihitung sebagai penjualan.
alter table performa_rows add column klik integer not null default 0
  check (klik >= 0);
alter table performa_rows add column jenis text not null default 'penjualan'
  check (jenis in ('penjualan', 'klik'));
```

Catatan:

- Agregasi komisi dan konversi tetap dihitung di aplikasi (`lib/impor/performa.ts` dan
  `lib/performa/atribusi.ts`), bukan di database, supaya aturannya teruji unit dan tetap bisa dipakai
  saat data masih di localStorage.
- Konten yang belum punya `sub_id` tetap sah: yang dipakai adalah kode pelacak hasil hitungan dari
  id konten, bukan kolom baru di `contents`.

---

## 9. Migrasi 0002: provider posting, carousel, akun Threads (file siap, belum dijalankan)

Status: file `supabase/migrations/0002_posting_carousel_threads.sql` sudah ada di repo
(13 Oktober 2026) dan **belum dijalankan** di project Supabase. Cara menjalankan: tempel seluruh
isi file ke Supabase → SQL Editor → Run.

Nomor yang sudah terpakai: `0001_init.sql`, `0002_posting_carousel_threads.sql`, dan
`0003_performa_affiliate.sql`. Bagian 9.1 sampai 9.4 di bawah adalah rancangan aslinya; selisih
kecil antara rancangan dan file migrasi yang benar-benar ditulis dicatat di 9.7.

Tidak ada tabel `provider_per_fungsi` di skema ini. ADR 0002 memutuskan provider dipilih lewat
environment variable per fungsi, dan `docs/ai-provider.md` menegaskan kunci API hanya hidup di
environment server, jadi tidak ada kolom kunci API di database mana pun.

### 9.1 Provider posting dan varian platform (ADR 0002)

```sql
alter table contents add column posting_provider text not null default 'manual'
  check (posting_provider in ('manual', 'threads_api', 'buffer', 'metricool', 'postiz', 'mixpost'));

create table platforms (
  kode text primary key,              -- 'threads', 'instagram', 'facebook', 'tiktok', 'wa_saluran'
  nama text not null,
  batas_karakter integer,             -- nilai awal, cek dokumentasi resmi tiap platform sebelum aktif
  aktif boolean not null default false
);

create table content_variants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id uuid not null references contents(id) on delete cascade,
  platform text not null references platforms(kode),
  format text,
  teks text,
  unique (content_id, platform)
);

create index content_variants_content_idx on content_variants(content_id);
alter table content_variants enable row level security;
create policy owner_all on content_variants for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
```

- `marketplaces` ditambahkan saat adapter marketplace kedua dibuat.
- `threads_statuses` tetap dipakai di MVP, lalu dipindah ke `content_variants` bertahap (Workflow bagian 9).

### 9.2 Status konten `ditolak` (F10, antrian review)

```sql
alter type content_status add value if not exists 'ditolak';
```

Tab "Ditolak" di Antrian review memakai status ini. Perubahan enum tidak bisa dibatalkan, jadi
dijalankan setelah UI tab-nya siap.

### 9.3 Carousel (F9, `docs/fitur-carousel.md` bagian 9)

```sql
create table carousel_slides (
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

create index carousel_slides_content_idx on carousel_slides(content_id);
alter table carousel_slides enable row level security;
create policy owner_all on carousel_slides for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
```

Batas jumlah slide (3 sampai 10), 8 kata di headline, dan 25 kata di isi dijaga di kode, bukan di
database. Hasil render disimpan di Storage pada `{user_id}/carousel/{content_id}/`, dengan retensi
yang sama seperti foto (K3). Renderer default `off`, jadi `path_render` boleh kosong.

### 9.4 Akun Threads dan masa berlaku token (Fase 7)

```sql
create table threads_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  threads_user_id text not null,
  nama_tampilan text,
  token_terenkripsi text not null,     -- hanya dibaca di server
  token_kedaluwarsa_at timestamptz,
  status_koneksi text not null default 'terhubung'
    check (status_koneksi in ('terhubung', 'akan_kedaluwarsa', 'kedaluwarsa')),
  terakhir_diperbarui_at timestamptz not null default now(),
  unique (user_id, threads_user_id)
);

create index threads_accounts_user_idx on threads_accounts(user_id);
alter table threads_accounts enable row level security;
create policy owner_all on threads_accounts for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
```

Token tidak pernah dikirim ke klien: policy di atas hanya melindungi baris, enkripsi dan pembacaan
token tetap di server (AGENTS aturan 11).

### 9.5 Mode kerja (F10, `docs/fitur-mode-kerja.md` bagian 2)

Tidak ada tabel baru. Parameter disimpan di `settings.data` (`settings.user_id` sudah unik per user):

| Kunci | Default | Rentang |
|---|---|---|
| `mode_kerja` | `manual` | `manual`, `semi`, `penuh` |
| `ambang_skor` | 70 | 0 sampai 100 |
| `skor_prioritas` | 85 | 0 sampai 100 |
| `maks_draft_otomatis_per_hari` | 3 | 1 sampai 10 |
| `jam_aktif_mulai`, `jam_aktif_selesai` | 07:00, 22:00 | WIB |
| `interval_cek_menit` | 30 | 15 sampai 240 |

Batas biaya bulanan (`AI_MONTHLY_BUDGET_USD`) tetap di env, bukan di `settings`, supaya tidak bisa
diubah dari klien. Mode `penuh` tidak dibuat sebelum K12 diputuskan.

### 9.6 Tabel yang masih ditunda

- `posts`: riwayat pengiriman dan ID posting platform, ditambahkan saat Fase 7.
- Tabel cache ide: belum ada di skema; analisis sudah punya `analysis_cache`.
- Isi baris `platforms`: tabelnya dibuat kosong. Baris `threads` masuk bersama adapter platform
  pertama, karena `batas_karakter` dan `aktif` harus dicek ke dokumentasi resmi dulu.

### 9.7 Selisih antara rancangan 9.1-9.4 dan file migrasi

Empat hal ini berbeda dari SQL di atas, semuanya disengaja:

| Hal | Rancangan 9.1-9.4 | File `0002_posting_carousel_threads.sql` |
|---|---|---|
| `platforms` dan RLS | RLS hanya di `content_variants`, `carousel_slides`, `threads_accounts` | RLS juga diaktifkan di `platforms`, dengan policy select `using (true)` untuk `authenticated` dan tanpa policy tulis |
| Index foreign key | Hanya `content_variants(content_id)` | Ditambah `content_variants_platform_idx` untuk foreign key `platform` |
| Amannya tempel ulang | `create table` dan `create policy` polos | Semua `create` pakai `if not exists`, dan tiap policy didahului `drop policy if exists` |
| Enum `ditolak` | `alter type ... add value if not exists` | Sama, tapi ditempatkan di dalam transaksi supaya ikut dibatalkan bila pernyataan berikutnya gagal |

Alasan baris `platforms`: tabel tanpa RLS di Supabase bisa dibaca memakai anon key yang ikut
terkirim ke peramban, padahal `platforms` tidak menyimpan data siapa pun. Karena itu tabel acuan
ini dibuat baca-saja untuk user yang login, dan penulisan platform baru hanya lewat service role.

---

## 10. Migrasi 0004 dan 0005: kolom Fase 6 pada `contents`

Dua kolom ditambahkan lewat migrasi terpisah supaya `0001_init.sql` tetap jadi catatan sejarah
skema awal dan tidak ada migrasi lama yang diedit (aturan repo nomor 12). Keduanya:

| Migrasi | Objek | Ringkasan |
|---|---|---|
| `0004_jadwal_konten.sql` | `contents.jadwal_at` + `contents_user_jadwal_idx` | Penanda jadwal kalender (Fase 6). Diisi hanya saat status `terjadwal`; dibatalkan kembali ke `siap_posting` dengan kolom ini dinull-kan |
| `0005_gaya_hook_konten.sql` | `contents.gaya_hook` + `contents_user_hook_idx` | Gaya hook pembuka yang dipakai saat generate, dipakai analitik per hook (Fase 6) |

Catatan implementasi:

- Keduanya memakai `add column if not exists` dan `create index if not exists`, jadi aman ditempel
  ulang ke SQL Editor.
- `gaya_hook` bertipe `text` dengan default `'bawaan'`, bukan enum. Daftar gaya hook (lihat
  `Pengaturan`) masih bisa bertambah tanpa migrasi tipe, dan nilai tak dikenal cukup diabaikan
  aplikasi.
- Aplikasi sudah memakai kedua field di localStorage dengan nama yang sama (`jadwal_at`,
  `gaya_hook`), jadi saat konten disalin ke `contents` tidak ada pemetaan nama lagi.
- Prefiks `user_id` di kedua index mengikuti aturan RLS: semua query aplikasi selalu difilter
  pemiliknya, dan index tanpa `user_id` di depan tidak akan terpakai.

---

## 11. Migrasi 0006: tabel `posts` (log pengiriman, Fase 7)

Status: file `supabase/migrations/0006_posts.sql` sudah ada di repo (15 Oktober 2026) dan **belum
dijalankan** di project Supabase. Cara menjalankan: tempel seluruh isi file ke Supabase → SQL
Editor → Run. Sumber keputusan: ADR 0007.

Setiap percobaan kirim ditulis satu baris — berhasil maupun gagal — supaya exit criteria Fase 7
("posting berhasil dan status tercatat") punya bukti, dan supaya kuota 24 jam bisa dihitung dari
sumber yang tidak bisa dipalsukan klien.

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid pk | |
| user_id | uuid | cascade delete |
| content_id | text | **tanpa** foreign key: pustaka konten masih di localStorage, jadi id-nya belum tentu ada di `contents`. FK ditambahkan bersamaan dengan migrasi pustaka |
| judul | text | disalin saat kirim supaya log tetap terbaca kalau konten dihapus |
| platform | text | `threads` (K8) |
| penyedia | text | `manual` atau `threads_api`, sejajar `lib/posting/skema.ts` |
| status | text | `terkirim` atau `gagal` |
| id_platform | text | ID postingan akar di Threads; null untuk mode manual |
| jumlah_terkirim | integer | berapa status yang benar-benar terbit (bisa kurang dari jumlah_status kalau gagal di tengah) |
| jumlah_status | integer | panjang utas yang dicoba dikirim |
| mode | text | `manual` atau `auto`; pengirim otomatis penuh menunggu K12 |
| error | text | pesan gagal, dipotong 500 karakter |
| created_at | timestamptz | dasar jendela kuota 24 jam |

| Index | Kolom |
|---|---|
| `posts_user_created_idx` | `(user_id, created_at desc)` — dipakai query kuota 24 jam |
| `posts_content_idx` | `(user_id, content_id)` — riwayat per konten |

RLS: `owner_all` untuk `authenticated` dengan `(select auth.uid()) = user_id`, sama seperti tabel
lain. Tidak ada policy untuk `anon`.

Catatan implementasi:

- Penulisan log bersifat best-effort (`lib/posting/catat-post.ts`): kegagalan insert muncul di log
  proses, bukan membatalkan kiriman yang sudah terjadi di Threads.
- Kalau tabel ini belum ada atau belum ada barisnya, rute kirim memakai riwayat localStorage yang
  dikirim klien untuk memeriksa jeda dan batas harian. Batasan ini tercatat di
  `docs/provider-posting.md`.
- Tabel `threads_accounts` (migrasi 0002) sudah menyediakan tempat token; kolom `status_koneksi`
  bernilai sama dengan hasil `statusKoneksi()` di `lib/posting/threads-oauth.ts`.

## 12. Migrasi 0007: jenis `naskah_video` di `generations`

Status: file `supabase/migrations/0007_jenis_naskah_video.sql` sudah ada di repo (15 Oktober 2026)
dan **belum dijalankan** di project Supabase. Jalankan setelah migrasi 0006 (berurutan) di SQL
Editor.

Mode naskah video (prompt 09, `/api/naskah-video`) mencatat generasi dengan jenis sendiri
`naskah_video` supaya Widget biaya bisa memisahkannya dari generate status. Perubahan hanya pada
check constraint `generations.jenis_check`: daftar nilai bertambah `naskah_video`. Tidak ada kolom
atau tabel baru, dan `lib/ai/statistik.ts` tidak perlu diubah karena sudah mengelompokkan per jenis
apa pun yang datang.

Jika migrasi belum dijalankan, insert ke `generations` dari rute naskah video akan ditolak
constraint; dampaknya hanya catatan biaya yang hilang (respons AI ke user tetap terkirim), karena
pencatatan generasi bersifat best-effort (`lib/ai/catat-generation.ts`).

## 13. Migrasi 0008: tabel `offers` (Penawaran Marketplace & Non-Marketplace)

Status: file `supabase/migrations/0008_offers.sql` ditambahkan (17 Oktober 2026).

Menampung penawaran affiliate dari berbagai sumber:
- `source_type`: `marketplace`, `manual`, `link`.
- `category`: `hosting`, `saas`, `course`, `marketplace`, `other`.

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid pk | default `gen_random_uuid()` |
| user_id | uuid | referensi `auth.users(id)` cascade delete |
| source_type | text | `marketplace`, `manual`, `link` |
| category | text | `hosting`, `saas`, `course`, `marketplace`, `other` |
| name | text | nama penawaran / produk |
| affiliate_url | text | link affiliate tujuan |
| price | text | harga (opsional untuk non-marketplace) |
| features | text | fitur utama / keunggulan (textarea) |
| image_url | text | URL foto produk/penawaran (opsional) |
| marketplace_data | jsonb | data spesifik marketplace (varian, rating, toko, dll.) |
| created_at, updated_at | timestamptz | default `now()` |

RLS: `owner_all` untuk `authenticated` dengan `(select auth.uid()) = user_id`.

