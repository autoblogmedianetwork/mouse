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

Buka **Supabase → SQL Editor**, lalu jalankan dua bagian berikut.

### 1. Simpan rahasia di level database

Rahasia tidak masuk repo, jadi nilainya disimpan sebagai setelan database.
Ganti `RAHASIA_CRON` dengan nilai `CRON_SECRET` milikmu.

```sql
alter database postgres set app.cron_secret = 'RAHASIA_CRON';
```

### 2. Jadwalkan panggilan tiap 15 menit

Ganti `https://DOMAIN-KAMU` dengan alamat produksi. `pg_net` yang mengirim
permintaan HTTP, jadi endpoint tetap yang sama dengan milik Vercel Cron.

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'heaviliate-proses-jadwal',
  '*/15 * * * *',
  $job$
  select net.http_post(
    url := 'https://DOMAIN-KAMU/api/threads/proses-jadwal',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.cron_secret', true),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $job$
);
```

### 3. Periksa

```sql
-- daftar jadwal yang aktif
select jobid, jobname, schedule, active from cron.job;

-- 5 panggilan terakhir beserta kode balasannya
select id, status_code, created
from net._http_response
order by id desc
limit 5;
```

Kalau `status_code` 200, penjadwal bekerja. Kalau 401, `CRON_SECRET` tidak cocok.
Kalau 500, cek log fungsi Vercel-nya.

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
