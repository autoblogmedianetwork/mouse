# Jadwal kirim otomatis tanpa paket Pro

## Kenapa deployment gagal

Vercel menolak build dengan pesan:

> Hobby accounts are limited to daily cron jobs. This cron expression (\*/15 \* \* \* \*) would run more than once per day.

Penyebabnya `vercel.json` meminta cron **setiap 15 menit**, sedangkan paket Hobby
hanya mengizinkan **sekali sehari**. Karena cron divalidasi saat build, seluruh
deployment ikut gagal — bukan hanya fitur kirim otomatis.

Yang sudah dilakukan: `vercel.json` sekarang memakai `0 1 * * *` (08:00 WIB),
satu kali sehari. Deployment kembali bisa jalan, tapi pengiriman terjadi
paling cepat sekali sehari lewat Vercel — terlalu kasar untuk "titip kirim".

## Pilihan penjadwal (semua gratis)

| Cara | Frekuensi | Kelebihan | Kekurangan |
|---|---|---|---|
| Vercel Cron (Hobby) | 1× sehari | Tanpa setelan tambahan | Terlalu jarang untuk jadwal posting |
| **Supabase pg_cron** | 1–15 menit | Sudah punya Supabase, gratis, jalan di server | Perlu jalankan SQL sekali |
| GitHub Actions schedule | 5–15 menit | Gratis | Dimatikan GitHub setelah repo tidak aktif 60 hari |
| cron-job.org | 1 menit | Paling fleksibel | Akun pihak ketiga lagi |
| Vercel Pro | 1 menit | Paling rapi | Berbayar bulanan |

Rekomendasi: **Supabase pg_cron**, dengan Vercel Cron harian tetap menyala
sebagai jaring pengaman kalau pg_cron mati.

## Pasang pg_cron (sekali saja)

Buka **Supabase → SQL Editor**, lalu jalankan tiga bagian berikut.

> `alter database postgres set app.cron_secret = ...` **tidak bisa dipakai di
> Supabase**: peran `postgres` bukan pemilik database, jadi muncul
> `42501: permission denied to set parameter`. Rahasianya disimpan di tabel
> tertutup seperti di bawah.

### 0. Aktifkan ekstensinya lewat Dashboard

`create extension pg_cron` sering ikut kena masalah izin. Lebih aman lewat
**Supabase → Database → Extensions**, lalu aktifkan **pg_cron** dan **pg_net**.
Kalau keduanya sudah menyala, lewati langkah ini.

### 1. Simpan rahasia di tabel tertutup

Tabel ini dikunci RLS tanpa aturan akses, jadi `anon` dan `authenticated` tidak
bisa membacanya. `pg_cron` jalan sebagai pemilik tabel, jadi tetap bisa.
Ganti `RAHASIA_CRON` dengan nilai `CRON_SECRET` milikmu.

```sql
create table if not exists cron_rahasia (
  kunci  text primary key,
  nilai  text not null,
  dibuat timestamptz not null default now()
);

alter table cron_rahasia enable row level security;
revoke all on cron_rahasia from anon, authenticated;

insert into cron_rahasia (kunci, nilai)
values ('cron_secret', 'RAHASIA_CRON')
on conflict (kunci) do update set nilai = excluded.nilai;
```

### 2. Jadwalkan panggilan tiap 15 menit

Ganti `https://DOMAIN-KAMU` dengan alamat produksi. `pg_net` yang mengirim
permintaan HTTP, jadi endpoint tetap sama dengan milik Vercel Cron.

```sql
select cron.schedule(
  'heaviliate-proses-jadwal',
  '*/15 * * * *',
  $job$
  select net.http_post(
    url := 'https://DOMAIN-KAMU/api/threads/proses-jadwal',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || coalesce((select nilai from cron_rahasia where kunci = 'cron_secret'), ''),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $job$
);
```

Kalau `cron.schedule` ditolak karena jadwalnya sudah ada, batalkan dulu:

```sql
select cron.unschedule('heaviliate-proses-jadwal');
```

### 3. Periksa

```sql
-- daftar jadwal yang aktif
select jobid, jobname, schedule, active from cron.job;

-- pastikan rahasianya terbaca (harus keluar satu baris)
select kunci, length(nilai) as panjang from cron_rahasia;

-- 5 panggilan terakhir beserta kode balasannya
select id, status_code, created
from net._http_response
order by id desc
limit 5;
```

Kalau `status_code` 200, penjadwal bekerja. Kalau 401, `CRON_SECRET` di Vercel
tidak sama dengan isi `cron_rahasia`. Kalau 500, cek log fungsi Vercel-nya.

### Alternatif: Supabase Vault

Kalau lebih suka rahasianya terenkripsi, Vault bisa dipakai:

```sql
select vault.create_secret('RAHASIA_CRON', 'cron_secret');
```

lalu di dalam job pakai
`(select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')`
menggantikan subquery `cron_rahasia`.

### Membatalkan

```sql
select cron.unschedule('heaviliate-proses-jadwal');
```

## Catatan keamanan

- Endpoint tetap *fail-closed*: tanpa `Authorization: Bearer <CRON_SECRET>` yang
  benar dan tanpa sesi pengguna, tidak ada yang dikirim.
- Rahasia hanya ada di setelan database dan di environment Vercel, tidak pernah
  di file repo.
- Jangan mengganti `CRON_SECRET` tanpa memperbarui `app.cron_secret`; kalau
  tidak, semua panggilan berhenti dengan 401 dan tidak ada yang terkirim.
