-- ============================================================
-- AutoThreads: tabel performa affiliate (impor laporan) + kolom sub_id
-- Sumber: docs/skema-database.md bagian 8, ADR 0004, ADR 0005
-- ============================================================
-- Cara pakai sekali jalan: tempel seluruh isi file ini ke Supabase -> SQL Editor -> Run.
-- Dibungkus satu transaksi supaya kegagalan di tengah tidak meninggalkan skema separuh jadi
-- (kalau error, semuanya dibatalkan dan file ini bisa ditempel ulang tanpa bersih-bersih manual).
--
-- Nomor 0003 (bukan 0002) karena docs/skema-database.md bagian 8 sudah memesan 0002 untuk
-- migrasi "provider per fungsi + content_variants" yang belum dibuat.
--
-- Belum ada baris di kedua tabel ini: sampai halaman /impor dan /analitik bicara ke Supabase,
-- datanya masih hidup di localStorage peramban.

begin;

-- Enum
create type marketplace as enum ('shopee', 'tiktok', 'tokopedia', 'lainnya');
create type status_pesanan as enum ('selesai', 'menunggu', 'batal', 'lainnya');

-- ------------------------------------------------------------
-- performa_imports: satu baris per berkas laporan yang diimpor
-- ------------------------------------------------------------
create table performa_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nama_berkas text not null,
  marketplace marketplace not null,
  jumlah_baris integer not null default 0 check (jumlah_baris >= 0),
  jumlah_ditolak integer not null default 0 check (jumlah_ditolak >= 0),
  pemisah text,
  skor_deteksi integer not null default 0,
  -- Total disimpan supaya daftar "Sumber data" di halaman Analitik tidak perlu
  -- menjumlah ulang semua baris hanya untuk menampilkan satu angka.
  komisi_total numeric(14,2) not null default 0,
  gmv_total numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);
create index performa_imports_user_created_idx
  on performa_imports(user_id, created_at desc);

-- ------------------------------------------------------------
-- performa_rows: baris penjualan atau baris klik hasil impor
-- ------------------------------------------------------------
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
  -- Komisi boleh negatif: laporan memuat retur dan pembatalan.
  komisi numeric(14,2) not null default 0,
  tingkat_komisi numeric(6,2),
  status_pesanan text not null default '',
  status_kode status_pesanan not null default 'lainnya',
  sub_id text not null default '',
  -- Baris ekspor analitik hanya membawa klik, tanpa komisi.
  klik integer not null default 0 check (klik >= 0),
  jenis text not null default 'penjualan' check (jenis in ('penjualan', 'klik')),
  updated_at timestamptz not null default now(),
  -- Kunci dedupe, sejajar `kunciBaris()` di lib/impor/performa.ts.
  -- `tanggal` ikut masuk kunci karena laporan ringkasan produk tidak punya ID pesanan:
  -- tanpa tanggal, dua pesanan produk yang sama di hari berbeda akan saling menimpa.
  -- Catatan: `tanggal` boleh null dan null dianggap berbeda di unique index, jadi
  -- aplikasi sebaiknya mengisi tanggal (tanggal impor) untuk baris tanpa tanggal laporan.
  unique (user_id, marketplace, id_pesanan, produk, tanggal)
);
create trigger performa_rows_updated before update on performa_rows
  for each row execute function set_updated_at();

-- Index untuk pemakaian nyata: daftar per periode, ringkasan per marketplace,
-- dan cascade delete saat satu sumber impor dibatalkan.
create index performa_rows_user_tanggal_idx on performa_rows(user_id, tanggal desc);
create index performa_rows_user_marketplace_idx on performa_rows(user_id, marketplace);
create index performa_rows_import_idx on performa_rows(import_id);

-- ------------------------------------------------------------
-- Atribusi: kode pelacak per link affiliate (ADR 0005)
-- ------------------------------------------------------------
-- Kode seperti "at-3f9c21" ditempel di kolom Sub_id/Creator/kanal pada link
-- affiliate, lalu dicocokkan dengan kolom performa_rows.sub_id.
alter table affiliate_links add column sub_id text;
create unique index affiliate_links_user_subid_idx
  on affiliate_links(user_id, lower(sub_id)) where sub_id is not null;

-- ============================================================
-- Row Level Security: setiap user hanya akses datanya sendiri
-- ============================================================
alter table performa_imports enable row level security;
alter table performa_rows enable row level security;

-- auth.uid() dibungkus select agar dievaluasi sekali per query, bukan per baris.
create policy owner_all on performa_imports for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy owner_all on performa_rows for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

commit;
