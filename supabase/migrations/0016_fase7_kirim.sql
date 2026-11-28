-- 0016: Fase 7 — auto-posting dengan persetujuan (ADR 0023).
--
-- Dua tabel:
--   threads_akun  : koneksi OAuth Threads per user; token TERENKRIPSI
--                   (AES-256-GCM, pola ADR 0031). Token tidak pernah
--                   dikembalikan terang ke klien.
--   jadwal_kirim  : konten yang DITITIPKAN user untuk dikirim otomatis
--                   ("titip kirim" — persetujuan ganda: konten sudah lolos
--                   checklist di klien DAN user menekan jadwalkan secara
--                   eksplisit). Server tidak pernah membaca localStorage;
--                   hanya teks yang dititipkan inilah yang boleh terkirim.

create table if not exists public.threads_akun (
  user_id uuid primary key references auth.users(id) on delete cascade,
  threads_user_id text not null,
  username text not null default '',
  token_terenkripsi text not null,
  token_kedaluwarsa timestamptz,
  dibuat_pada timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now()
);

alter table public.threads_akun enable row level security;

create policy "threads_akun milik sendiri"
  on public.threads_akun
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.jadwal_kirim (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  judul text not null default '',
  teks text not null check (char_length(teks) between 1 and 500),
  jadwal_pada timestamptz not null,
  status text not null default 'terjadwal'
    check (status in ('terjadwal', 'terkirim', 'gagal', 'dibatalkan')),
  threads_post_id text,
  pesan_galat text,
  terkirim_pada timestamptz,
  dibuat_pada timestamptz not null default now()
);

alter table public.jadwal_kirim enable row level security;

create policy "jadwal_kirim milik sendiri"
  on public.jadwal_kirim
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Pengirim cron butuh membaca antrean lintas user: query dilakukan dengan
-- klien service-role di route yang dilindungi CRON_SECRET, bukan lewat RLS.
create index if not exists jadwal_kirim_due
  on public.jadwal_kirim (jadwal_pada)
  where status = 'terjadwal';
