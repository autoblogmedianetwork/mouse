# ADR 0016: Login kata sandi sebagai jalur cadangan magic link

Status: diterima
Tanggal: 2026-11-07

## Konteks

Satu-satunya jalan masuk adalah magic link lewat email (K4). Jalur itu
bergantung pada dua hal di luar aplikasi:

1. **Pengiriman email.** Mailer bawaan Supabase hanya mengirim ke alamat yang
   termasuk tim project, dan dibatasi **2 email per jam per project**
   ([docs SMTP](https://supabase.com/docs/guides/auth/auth-smtp),
   [rate limits](https://supabase.com/docs/guides/auth/rate-limits)).
2. **Konfigurasi URL.** Bila `redirect_to` tidak ada di daftar Redirect URLs,
   Supabase mengabaikannya dan memakai Site URL — pada pemasangan ini masih
   `http://localhost:3000`, sehingga tautan mendarat di laptop, bukan di
   produksi.

Akibatnya pemilik produk bisa terkunci di luar dashboard meski aplikasinya
sehat: kuota habis (`email rate limit exceeded`) atau tautan salah alamat.
Memperbaiki SMTP tetap perlu (untuk pemakaian normal), tetapi tidak boleh
menjadi satu-satunya pintu.

## Keputusan

1. **Kata sandi Supabase Auth sebagai jalur kedua.** `signInWithPassword` di
   form baru pada `/masuk`, tanpa email sama sekali. Tidak ada dependency baru;
   `@supabase/supabase-js` sudah dipakai.
2. **Bootstrap lewat skrip lokal.** `npm run akun:kata-sandi -- email@anda.com`
   memakai `SUPABASE_SERVICE_ROLE_KEY` di komputer pemilik untuk
   `admin.createUser({ email_confirm: true, password })`, atau
   `admin.updateUserById` bila akun sudah ada. Ini memutus lingkaran ayam-telur:
   akun dengan kata sandi bisa dibuat tanpa pernah menerima email. Skrip
   membaca kata sandi tanpa echo dan tidak pernah mencetaknya.
3. **Atur/ubah kata sandi dari dalam aplikasi.** Saat sudah punya sesi (mis.
   dari magic link yang berhasil), panel sesi di `/masuk` membuka form
   `updateUser({ password })`. Pemilik yang dulu masuk lewat magic link bisa
   memasang kata sandi sendiri.
4. **Aturan kata sandi di klien.** `lib/auth/kata-sandi.ts`: minimal 8 karakter,
   maksimal 72 (batas bcrypt), wajib huruf dan angka. Skrip memakai aturan yang
   sama; Supabase tetap otoritas akhir.
5. **Pesan galat diterjemahkan.** `Invalid login credentials` dari Supabase
   ditampilkan sebagai "Email atau kata sandi tidak cocok." supaya tidak
   membocorkan apakah email terdaftar.

## Konsekuensi

- Pemilik bisa masuk tanpa email, tanpa kuota, dan tanpa konfigurasi URL.
- Kata sandi menjadi kredensial yang bisa dicuri: tidak ada 2FA. Untuk dashboard
  pribadi ini diterima; bila nanti multi-pengguna, tambahkan 2FA atau batasi
  percobaan login.
- `SUPABASE_SERVICE_ROLE_KEY` tetap hanya di `.env.local` dan hanya dibaca
  skrip lokal. Tidak ada route yang membacanya (AGENTS rule 11).
- Sign-in kata sandi di Supabase harus aktif (provider Email). "Confirm email"
  boleh tetap aktif karena skrip menandai email sudah terkonfirmasi.
- Magic link tetap jalur utama dan tidak dihapus; kata sandi adalah pintu
  cadangan.

## Alternatif yang ditolak

- **Hanya memperbaiki SMTP.** Masih bergantung pada pengiriman email dan
  konfigurasi dashboard; tetap terkunci bila kuota habis.
- **Token pemilik di env (`OWNER_TOKEN`).** Menambah kredensial statis di
  aplikasi yang harus dirotasi manual, dan tidak memberi identitas user untuk
  RLS.
- **Menonaktifkan "Confirm email" lalu sign-up bebas.** Membuka pendaftaran
  publik ke dashboard pribadi.
