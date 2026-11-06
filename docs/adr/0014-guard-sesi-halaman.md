# ADR 0014: Guard sesi di layout dan di setiap halaman dashboard

Status: diterima
Tanggal: 2026-11-06

## Konteks

Seluruh halaman dashboard dapat dibuka tanpa login: `app/(dashboard)/layout.tsx`
hanya merender `AppShell`, sehingga dua belas rute menjawab 200 tanpa cookie
sesi. Pengguna baru ditolak saat menekan tombol yang memanggil API
(`wajibSesi()` → 401 "Sesi tidak ditemukan"), setelah mengisi formulir penuh.
Tidak ada indikator status login maupun tombol keluar di shell, jadi pengguna
tidak punya cara mengetahui keadaannya.

Dokumentasi Next.js (`authentication.md` §"Layouts and auth checks")
memperingatkan bahwa pemeriksaan di layout saja tidak sah: layout tidak
dirender ulang saat navigasi (partial rendering) dan tidak mengontrol apakah
segmen rute ikut dirender. Pemeriksaan harus berada dekat data atau komponen
yang dirender bersyarat.

## Keputusan

1. **Guard di setiap halaman, bukan hanya layout.**
   `wajibSesiHalaman(tujuan)` di `lib/supabase/server.ts` memverifikasi token
   lewat `getClaims()` lalu `redirect()` ke `/masuk?tujuan=<path>`. Setiap
   `page.tsx` di `app/(dashboard)/` memanggilnya dengan path sendiri.
2. **Layout tetap memanggil guard yang sama** sebagai lapis optimistik supaya
   shell tidak dirender bagi pengunjung tanpa sesi, sesuai permintaan pemilik
   produk. Layout tidak bisa membaca URL dari Server Component, jadi
   `proxy.ts` meneruskan `x-pathname` sebagai request header.
3. **Halaman yang seluruhnya komponen klien dipecah.** `/kalender` menjadi
   `page.tsx` (server, guard) + `kalender-klien.tsx` (badan interaktif).
   `/konten` tetap rute redirect, guard dijalankan sebelum `redirect()`.
4. **Tujuan login dipertahankan.** `?tujuan=` diteruskan ke
   `emailRedirectTo` sebagai `?next=` pada `/auth/callback`, dan callback
   memakai validator yang sama, `tujuanAman()` di `lib/auth/tujuan.ts`.
   Hanya path internal yang diterima; `//host` dan `/\host` ditolak.
5. **Indikator sesi di sidebar.** `components/shell-pengguna.tsx` menerima
   email dari layout (hasil `getClaims()`, bukan objek user yang belum
   diverifikasi) dan menyediakan tombol Keluar. Setelah `signOut()`, ia
   `router.replace("/masuk")` lalu `router.refresh()` supaya guard server
   berjalan ulang.
6. **`wajibSesi()` untuk Route Handler tidak berubah.** Ia tetap mengembalikan
   401 JSON karena API harus memberi jawaban mesin, bukan redirect HTML.

## Alasan

- Menutup akses di halaman adalah satu-satunya cara yang diakui dokumentasi
  Next.js; layout saja hanya menyembunyikan, tidak menghentikan render.
- Redirect di layout tanpa path akan kehilangan tujuan karena dua guard
  berjalan pada request yang sama; `x-pathname` membuat keduanya sepakat.
- `getClaims()` memverifikasi tanda tangan token dan menyegarkannya, tanpa
  panggilan jaringan ke Auth server seperti `getUser()`. Penyegaran cookie
  ditulis oleh `proxy.ts` karena Server Component tidak boleh menulis cookie.
- Satu validator tujuan dipakai form masuk dan callback, jadi aturan
  keamanannya tidak bisa berbeda di dua tempat.

## Konsekuensi

- Setiap halaman dashboard baru wajib memanggil `wajibSesiHalaman(path)`.
  Halaman yang lupa akan tetap tertutup oleh layout, tetapi kehilangan
  parameter tujuan setelah login.
- Satu request halaman memanggil `getClaims()` dua kali (layout + page).
  Keduanya verifikasi lokal, jadi biayanya kecil; tidak di-cache karena
  argumen tujuan berbeda.
- `/kalender` bertambah satu file; `kalender-klien.tsx` tidak lagi mengekspor
  `metadata` (dipindah ke `page.tsx`).
- `proxy.ts` kini menyetel `x-pathname` pada setiap request. Header ini hanya
  dipakai layout dashboard dan tidak berisi data sensitif.
- Pengguna tanpa sesi yang membuka halaman apa pun mendarat di `/masuk` dengan
  tujuan yang benar, lalu kembali ke halaman itu setelah tautan email dipakai.
- Audit P1 butir 9 (guard sesi halaman) selesai; `docs/AUDIT-REPORT.md` perlu
  diperbarui pada sesi dokumentasi berikutnya.
