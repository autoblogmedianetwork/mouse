-- 0017_landing_pages — tabel untuk menyimpan metadata halaman landing statis.
--
-- Digunakan oleh wizard Landing Page (Lab Iklan): pengguna mengisi judul,
-- subjudul, deskripsi, dll → sistem menulis HTML ke public/landing/<slug>.html.
-- Baris ini hanya sebagai index agar user bisa melihat daftar halaman yang
-- pernah dibuat tanpa menelusuri filesystem.

CREATE TABLE IF NOT EXISTS landing_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  judul text NOT NULL,
  subjudul text DEFAULT '',
  cta text DEFAULT 'Cek Produknya',
  deskripsi text DEFAULT '',
  hero_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE landing_pages IS 'Metadata halaman landing statis dari Lab Iklan.';
