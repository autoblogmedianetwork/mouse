# Provider Posting (Fase 7)

Acuan: `adr/0002-provider-per-fungsi.md`, `adr/0007-threads-api-posting.md`.
Status tiap provider dicek ulang 15 Oktober 2026.

## Ringkasan

| Provider | Status di kode | Butuh | Kapan dipakai |
|---|---|---|---|
| `manual` | Aktif, selalu tersedia | Tidak ada | Default. User menyalin utas lalu menempel sendiri di Threads |
| `threads_api` | Aktif, hanya kalau kredensial terisi | `THREADS_USER_ID`, `THREADS_ACCESS_TOKEN` | Kirim langsung dari Antrian review atau Kalender |
| `buffer`, `metricool`, `postiz`, `mixpost` | Belum dibuat | Akun/instalasi sendiri | Backlog; masih bisa dipilih di env, hasilnya fallback ke manual |

Provider dipilih default lewat `POSTING_PROVIDER`. Kalau provider itu tidak siap, aplikasi otomatis
memakai `manual` (ADR 0002), jadi mode manual tidak pernah hilang.

## Cara mengaktifkan Threads API

1. Buat app Threads di `developers.facebook.com`, tambahkan use case Threads, dan tetapkan URL
   callback ke `{APP_URL}/auth/callback` (mis. `http://localhost:3000/auth/callback`).
2. Scope yang diminta: `threads_basic` dan `threads_content_publish`.
3. Dapatkan token lewat alur OAuth di `lib/posting/threads-oauth.ts`:
   - Buka `urlOtorisasi()` → Threads mengembalikan `code` (berlaku 1 jam).
   - `tukarKodeJadiToken(code, { appId, appSecret, redirectUri })` → token pendek (1 jam).
   - `jadikanTokenPanjang(token, { appSecret })` → token panjang (60 hari).
   - `segarkanToken(token)` sebelum kedaluwarsa; token minimal berumur 24 jam.
4. Isi di server (`.env.local` saat pengembangan, Environment Variables di Vercel):
   `POSTING_PROVIDER=threads_api`, `THREADS_USER_ID`, `THREADS_ACCESS_TOKEN`.
   Jangan pernah menaruh token di variabel `NEXT_PUBLIC_*`.
5. Buka `/antrian`; baris status provider posting harus menulis "Threads API siap dipakai".

Untuk akun sendiri, akun berperan app-role atau Threads tester sudah cukup; App Review baru perlu
kalau app dipakai orang di luar peran itu.

## Batas platform (15 Oktober 2026)

| Batas | Nilai | Ditegakkan di aplikasi |
|---|---|---|
| Posting per 24 jam | 250 | Tidak di-hardcode; batas aplikasi default 20 (`Pengaturan`) |
| Balasan per 24 jam | 1.000 | Jeda antar posting + batas harian |
| Panjang teks per status | 500 karakter, emoji dihitung per byte | Validator 500 karakter + cek byte di `lib/posting/antrian.ts` |
| Panjang utas | Tidak ada batas resmi | Jumlah status per konten dibatasi pengaturan generate (3 sampai 12+) |

Kuota berjalan 24 jam, bukan per hari kalender. `GET /{threads-user-id}/threads_publishing_limit`
menyediakan `quota_usage` dan `reply_quota_usage`; aplikasi belum memanggilnya karena batas sendiri
(default 20) selalu jauh di bawah kuota platform.

## Alur kirim

```
Tombol "Kirim sekarang"
   -> ConfirmDialog
   -> POST /api/posting/kirim  { konten, pengaturan, riwayat }
        -> gerbang: status disetujui? jadwal tiba? jeda & batas harian lolos?
        -> provider.kirim(statuses)      (manual tidak memanggil API)
        -> catat ke tabel posts (best-effort)
   -> ok   : konten jadi `terkirim`, riwayat dicatat
   -> gagal: konten jadi `gagal`, utas tetap utuh, user diarahkan salin manual
```

Urutan panggilan ke Threads untuk satu utas (lihat `lib/posting/threads.ts`):

1. `POST /v1.0/{user-id}/threads` → `{ id: container }`
2. `POST /v1.0/{user-id}/threads_publish` dengan `creation_id=container` → `{ id: posting }`
3. Status berikutnya memakai `reply_to_id=<posting sebelumnya>`, lalu diulang.

Kalau gagal di tengah, hasilnya menyebut status ke berapa yang gagal dan berapa yang sudah terbit,
supaya user tahu apa yang perlu dibersihkan di Threads. Kontennya tidak dihapus dari pustaka.

## Pengaturan dan variabel

| Variabel | Default | Keterangan |
|---|---|---|
| `POSTING_PROVIDER` | `manual` | Pilihan default; jatuh ke manual kalau tidak siap |
| `THREADS_USER_ID` | kosong | Threads user id (angka) |
| `THREADS_ACCESS_TOKEN` | kosong | Token panjang (60 hari), server-only |
| `THREADS_CONTAINER_WAIT_MS` | `0` | Jeda sebelum publish; media butuh tunggu (Meta menyarankan ±30 detik) |
| `THREADS_API_BASE` | `https://graph.threads.net/v1.0` | Override host, dipakai pengujian |

Pengaturan per user (jeda dan batas harian) disimpan di localStorage
`autothreads-pengaturan-posting`; bentuknya sama dengan tabel `posts` dan pengaturan server.

## Batasan yang masih terbuka

- Kredensial app asli belum ada, jadi kirim nyata ke akun uji belum bisa diverifikasi dari repo ini.
  Uji yang sudah ada memakai fetch tiruan (`lib/posting/threads.test.ts`).
- Alur callback OAuth belum berupa rute; `threads-oauth.ts` baru menyediakan fungsi murni dan
  pemanggil HTTP-nya. Penyimpanan token di `threads_accounts` menunggu migrasi 0002 dijalankan.
- Rute kirim mempercayai konten dari klien karena pustaka masih di localStorage; validasinya Zod
  plus gerbang status. Setelah `contents` jadi sumber kebenaran, status diperiksa dari database.
