# ADR 0007: Posting Threads lewat adapter di `lib/posting/`

Status: diterima
Tanggal: 15 Oktober 2026

## Konteks

Fase 7 membutuhkan pengiriman utas ke Threads. ADR 0002 sudah menetapkan bahwa posting punya
antarmuka sendiri di `lib/posting/` dengan `manual` selalu tersedia sebagai cadangan, tapi belum
ada keputusan tentang bentuk antarmuka itu, siapa yang boleh mengirim, dan bagaimana batas platform
ditegakkan. K12 (mode otomatis penuh) belum disetujui, jadi pengiriman tanpa aksi user tidak boleh
dibuat (AGENTS aturan 4).

Fakta platform yang dipakai sebagai dasar (dicek 15 Oktober 2026 dari
`developers.facebook.com/documentation/threads`):

- Endpoint: `POST https://graph.threads.net/v1.0/{threads-user-id}/threads` (bikin container) lalu
  `POST https://graph.threads.net/v1.0/{threads-user-id}/threads_publish` (`creation_id`).
- Utas disambung dengan `reply_to_id` berisi ID postingan induk yang **sudah terbit**, jadi
  pengiriman harus berurutan, tidak boleh paralel.
- Batas: 250 posting dan 1.000 balasan per 24 jam berjalan; teks 500 karakter per status; emoji
  dihitung per byte UTF-8, bukan per karakter.
- OAuth: code berlaku 1 jam, token pendek 1 jam, token panjang 60 hari, dan perpanjangan hanya
  bisa dilakukan selagi token belum kedaluwarsa.
- Untuk akun sendiri, cukup memakai akun berperan app-role / Threads tester; App Review baru perlu
  kalau dipakai orang lain di luar peran itu.

## Keputusan

1. **Satu registry provider** di `lib/posting/provider.ts` dengan `isAvailable()`,
   `alasanTidakTersedia()`, dan `kirim()`. Provider yang tersedia hanya `manual` dan `threads_api`;
   nama lain di `POSTING_PROVIDER` (buffer, metricool, postiz, mixpost) tetap dicatat di
   `dependency.md` tapi belum dibuat.
2. **Fallback otomatis ke manual.** `penyediaEfektif()` mengembalikan provider yang diminta hanya
   kalau `isAvailable()` benar; selain itu manual. Kegagalan provider API mengembalikan
   `jatuh_ke_manual: true` supaya UI menawarkan salin utas.
3. **Gerbang di `lib/posting/antrian.ts`** (fungsi murni): hanya status `siap_posting`, `terjadwal`,
   dan `gagal` yang boleh dikirim; konten `terjadwal` tidak boleh dikirim sebelum `jadwal_at`;
   batas harian dan jeda antar posting diperiksa dari riwayat kirim 24 jam; status yang melebihi
   500 byte ditolak sebelum API dipanggil.
4. **Pengiriman selalu dipicu aksi user** (tombol → ConfirmDialog → `POST /api/posting/kirim`).
   Tidak ada pengirim latar belakang; itu menunggu keputusan K12.
5. **Token hanya di server.** Klien menanyakan ketersediaan lewat `GET /api/posting/ketersediaan`
   dan tidak pernah menerima `THREADS_ACCESS_TOKEN`. Ini juga alasan `usePosting()` mengambil
   ketersediaan dari server, bukan membaca env.
6. **Log satu baris per percobaan** di tabel `posts` (migrasi `0006_posts.sql`), berhasil maupun
   gagal. Kuota 24 jam dibaca dari tabel ini kalau Supabase aktif; kalau belum, dari riwayat
   localStorage yang dikirim klien.
7. **OAuth disiapkan, belum dijalankan.** `lib/posting/threads-oauth.ts` menyediakan URL
   otorisasi, penukaran code, penukaran token panjang, perpanjangan, dan `statusKoneksi()` yang
   nilainya sama dengan enum `threads_accounts.status_koneksi`. Penyimpanan token di
   `threads_accounts` masih menunggu kredensial app asli dan migrasi 0002 dijalankan.

## Konsekuensi

- Mode manual tetap jalur utama; fitur Fase 7 tidak pernah menjadi satu-satunya cara posting.
- Batas 250/1.000 per 24 jam tidak dipaksakan ulang di kode (nilainya bisa berubah), tapi batas
  harian aplikasi default 20 dan bisa diatur, sehingga kuota platform tidak mungkin tersentuh dulu.
- Karena pustaka konten masih di localStorage, rute kirim menerima konten dari klien dan
  memvalidasinya dengan Zod. Setelah `contents` menjadi sumber kebenaran, pemeriksaan status
  dipindah ke pembacaan database di rute yang sama.
- `content_id` di `posts` sengaja `text` tanpa foreign key sampai pustaka pindah ke Supabase.
- Emoji dihitung per byte, jadi konten yang lolos validator 500 karakter bisa ditolak gerbang
  antrian. Pesan errornya menyebut jumlah byte supaya tidak membingungkan.
