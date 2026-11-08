# ADR 0018: Jalur video dengan prompt manual (storyboard ChatGPT, video Google Flow)

Status: diterima
Tanggal: 2026-11-08

## Konteks

Aplikasi sudah punya dua jalur video yang berbeda sifatnya:

1. **Prompt 09 (naskah video tiga bagian)** lewat `/api/naskah-video` — teks
   untuk posting Threads, bukan video.
2. **HyperFrames** (`lib/media/hyperframes.ts`) — render video teks lokal,
   default mati.

Yang dibutuhkan sekarang adalah video AI sungguhan (produk berfoto → klip 9:16),
dan cara paling murah serta paling aman saat ini adalah **ChatGPT untuk
storyboard + Google Flow untuk video**, dijalankan sendiri oleh user.

Ada dua kemungkinan rancangan:

- **A. Aplikasi memanggil AI** untuk membuat storyboard (prompt 04) lalu
  menyusun prompt Flow.
- **B. Aplikasi hanya menyusun teks prompt**, storyboard dibuat ChatGPT di
  luar aplikasi, hasil JSON-nya ditempel balik untuk diperiksa.

Rancangan A menambah biaya per storyboard, bergantung pada `AI_API_KEY` yang
sekarang justru ditolak provider (`401 User not found`), dan menambah satu
rute yang harus dijaga. Rancangan B memakai akun ChatGPT dan kuota Flow yang
sudah dimiliki user, tanpa kunci API sama sekali.

## Keputusan

**Rancangan B.** Halaman `/video` hanya menyusun dan memeriksa teks.

1. **Prompt storyboard disusun di klien** (`lib/video/prompt-storyboard.ts`)
   dari template `prompts/04-storyboard-json.md` v1. Tidak ada panggilan AI.
2. **JSON balasan ChatGPT ditempel balik** dan diperiksa
   (`lib/video/storyboard.ts`). Struktur rusak ditolak; masalah gaya
   (jumlah scene, durasi tidak menjumlah, teks layar > 8 kata, narasi terlalu
   padat) hanya menjadi peringatan agar user tetap bisa lanjut sambil tahu
   risikonya.
3. **Prompt Google Flow disusun per scene** (`lib/video/prompt-flow.ts`) dari
   template `prompts/07-prompt-foto-ke-video.md` v1. Setiap prompt scene memuat
   kunci produk dan larangan harga/klaim/logo, karena Flow paling sering
   mengubah bentuk dan warna produk antar klip.
4. **Dua checkpoint tidak bisa dilewati.** Prompt Flow baru bisa disalin setelah
   user menandai pemeriksaan durasi/teks/klaim (checkpoint 1), dan entri hanya
   bisa disimpan setelah checklist hasil video lengkap (checkpoint 2).
5. **Tidak ada upload.** Aplikasi tidak mengirim foto ke siapa pun dan tidak
   mengunggah video. Yang disimpan di `localStorage`
   (`lib/video/store.ts`) hanya storyboard, link video, dan checklist.

## Konsekuensi

- Jalur video tetap berfungsi walau kunci AI mati atau kuota AI habis.
- Kualitas storyboard bergantung pada model ChatGPT yang dipilih user; aplikasi
  tidak bisa menjaminnya, jadi checkpoint 1 tetap wajib.
- Konsistensi produk antar scene tidak bisa dijamin aplikasi. Mitigasinya
  kunci produk di setiap prompt + checkpoint 2; bila tetap meleset, klip
  digenerate ulang, bukan diperbaiki dengan cara lain.
- Data di `localStorage` hilang bila browser dibersihkan. Pemindahan ke
  Supabase (tabel `videos` atau `contents` + `generations.jenis = 'storyboard'`)
  menunggu sesi dan skema per-user diverifikasi.
- Bila nanti aplikasi perlu membuat storyboard sendiri, itu jalur baru
  (rute `/api/storyboard` + prompt `storyboard.v1.ts` di `lib/ai/prompts/`),
  bukan pengganti halaman ini.
