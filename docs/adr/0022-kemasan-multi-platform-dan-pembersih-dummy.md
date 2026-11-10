# ADR 0022: Kemasan Multi-Platform dan Pembersih Data Contoh

Status: diterima
Tanggal: 2026-11-11

## Konteks

Gelombang 2 meminta dua hal yang masih manual:
1. Satu konten yang sudah jadi harus diketik ulang untuk Threads, TikTok, dan
   WhatsApp Status — padahal isinya sama, hanya batas karakternya berbeda
   (`lib/platforms/batas.ts`: Threads 500, TikTok 2200, WA 700).
2. Data contoh dari onboarding ("Contoh: …") harus bisa dibersihkan sekali klik
   saat pengguna mulai memakai data nyata (AGENTS aturan 4).

## Keputusan

1. **Kemasan multi-platform** — `lib/konten/kemasan-multi-platform.ts`:
   - Fungsi murni `kemasanMultiPlatform(konten)` menghasilkan `threads`, `tiktok`,
     `whatsapp`, dan `teks` (paket berlabel untuk satu kali salin).
   - Threads memakai seluruh status apa adanya (tiap status sudah ≤ 500 karakter).
   - TikTok dan WhatsApp memakai status pembuka + link produk (kecuali
     `letak_link = "tanpa_link"`), dipotong `potongAman()` di batas kata sesuai
     batas platform — tidak memotong di tengah kata.
   - Tombol "Kemasan 3 platform" ditambahkan pada setiap kartu di `/antrian`.

2. **Pembersih data contoh** — `lib/konten/pembersih-dummy.ts`:
   - Deteksi berbasis penanda: id berawalan `contoh-`, teks mengandung
     "SAMPEL DUMMY" atau "Contoh:".
   - `hitungDataContoh()` hanya membaca; `bersihkanDataContoh()` menghapus entri
     contoh dari `autothreads-konten` dan draft contoh dari
     `autothreads-draft-posting`, lalu komponen memuat ulang halaman.
   - Tombol ada di Pengaturan → bagian Data; tidak aktif bila tidak ada data contoh.

3. **Statistik dashboard**: kartu "Konten total" kini menampilkan jumlah konten
   yang dibuat bulan berjalan. Produk paling menghasilkan tetap berasal dari
   `ringkasPerforma().teratas` (data impor komisi), bukan angka karangan.

## Konsekuensi

- Satu konten cukup dibuat sekali; tiga platform didapat dari satu klik.
- Data contoh bisa hilang tanpa menyentuh konten sungguhan.
- Tidak ada dependency baru dan tidak ada panggilan API; semuanya lokal.
- Batas karakter tetap dijaga kode, sesuai aturan 10 AGENTS.md.
