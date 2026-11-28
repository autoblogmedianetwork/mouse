# Jadwal kirim otomatis tanpa paket Pro

## Kenapa deployment gagal

Vercel menolak build dengan pesan:

> Hobby accounts are limited to daily cron jobs. This cron expression (\*/15 \* \* \* \*) would run more than once per day.

Penyebabnya `vercel.json` meminta cron **setiap 15 menit**, sedangkan paket Hobby
hanya mengizinkan **sekali sehari**. Cron divalidasi saat build, jadi seluruh
deployment ikut gagal — bukan hanya fitur kirim otomatis.

Sekarang `vercel.json` memakai `0 1 * * *` (08:00 WIB) sebagai jaring pengaman.

## Cara paling simpel (sudah terpasang)

**Kiriman tertunda dipicu saat kamu membuka aplikasi.**

`components/pengirim-tertunda.tsx` memanggil `/api/threads/proses-jadwal` sekali
saat dashboard dibuka. Endpoint yang sama sudah mendukung mode sesi dan hanya
memproses konten milikmu.

- Tidak perlu pg_cron, SQL, akun baru, atau langganan
- Jeda 5 menit lewat localStorage: pindah halaman tidak memicu permintaan
  berulang, dan dua tab tidak berebut baris yang sama
- Gagal = diam. Tanpa sesi atau tanpa akun Threads, tidak ada yang dikirim dan
  tidak ada pesan galat yang mengganggu
- Kalau ada yang terkirim, muncul satu baris: "2 kiriman terjadwal terkirim."

**Batasnya jujur:** kiriman terkirim saat kamu membuka aplikasi, bukan tepat
pada menit yang dijadwalkan. Untuk kebiasaan harian (buka Fokus Hari Ini tiap
pagi), ini biasanya cukup — dan tidak ada yang perlu dipasang.

Butuh tombol untuk memaksa proses tanpa menunggu? Pakai **"Proses sekarang"** di
halaman Antrian.

## Kalau butuh presisi 15 menit

Hanya perlu kalau kamu menjadwalkan kiriman pada jam tertentu dan tidak membuka
aplikasi pada jam itu. Pilih salah satu:

| Cara | Frekuensi | Kelebihan | Kekurangan |
|---|---|---|---|
| Aplikasi dibuka (terpasang) | saat dipakai | Nol setelan | Tidak presisi |
| Supabase pg_cron | 1–15 menit | Gratis, sudah punya Supabase | Perlu jalankan SQL sekali |
| GitHub Actions schedule | 5–15 menit | Gratis | Dimatikan setelah repo 60 hari tidak aktif |
| cron-job.org | 1 menit | Paling fleksibel | Akun pihak ketiga lagi |
| Vercel Pro | 1 menit | Paling rapi | Berbayar bulanan |

### Supabase pg_cron

> `alter database postgres set app.cron_secret = ...` **tidak bisa dipakai di
> Supabase**: peran `postgres` bukan pemilik database, jadi muncul
> `42501: permission denied to set parameter`. Rahasianya disimpan di tabel
> tertutup seperti di bawah.

**1. Aktifkan ekstensi lewat Dashboard** (bukan SQL — `create extension` sering
kena masalah izin): Supabase → **Database → Extensions** → nyalakan **pg_cron**
dan **pg_net**.

**2. Simpan rahasia.** Tabel ini dikunci RLS tanpa aturan akses, jadi `anon` dan
`authenticated` tidak bisa membacanya. `pg_cron` jalan sebagai pemilik tabel,
jadi tetap bisa.

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

**3. Jadwalkan.**

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

**4. Periksa.**

```sql
select jobid, jobname, schedule, active from cron.job;
select id, status_code, created from net._http_response order by id desc limit 5;
```

`200` jalan; `401` artinya `CRON_SECRET` di Vercel beda dengan isi
`cron_rahasia`; `500` artinya lihat log fungsi Vercel.

**Membatalkan:**

```sql
select cron.unschedule('heaviliate-proses-jadwal');
```

### Alternatif: Supabase Vault

Kalau mau rahasianya terenkripsi:

```sql
select vault.create_secret('RAHASIA_CRON', 'cron_secret');
```

lalu di dalam job pakai
`(select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')`
menggantikan subquery `cron_rahasia`.

## Catatan keamanan

- Endpoint tetap *fail-closed*: tanpa `Authorization: Bearer <CRON_SECRET>` yang
  benar dan tanpa sesi pengguna, tidak ada yang dikirim.
- Rahasia tidak pernah masuk repo.
- Mengganti `CRON_SECRET` menuntut memperbarui isi `cron_rahasia`; kalau tidak,
  semua panggilan berhenti dengan 401 dan tidak ada yang terkirim.
