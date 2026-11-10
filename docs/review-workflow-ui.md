# Review Workflow, Frontend, dan UI — November 2026

Catatan reviewed berdasarkan `docs/PRD-Heaviliate.md`,
`docs/UI-Spec-Heaviliate.md`, `components/`, `features/`, `app/(dashboard)/`,
dan alur data yang benar-benar dipakai. Bukan daftar bug; ini urutan prioritas
perbaikan pengalaman.

## 1. Workflow

### 1.1 Satu sumber kebenaran untuk konten

**Kondisi:** `RingkasanDashboard` dan `AntrianReview` membaca
`autothreads-konten` dari localStorage, sedangkan `RiwayatSupabase` membaca
tabel `contents`. Keduanya bisa menampilkan angka dan status berbeda untuk
konten yang sama.

**Risiko:** user melihat "3 draft" di dashboard tetapi 5 baris di Riwayat,
lalu tidak percaya pada datanya. Ini utang terbesar sebelum fitur bertambah.

**Saran:** jadikan Supabase sumber utama; localStorage hanya cache/antrean
offline dengan penanda "belum tersinkron". Tampilkan status sinkronisasi di
topbar (sudah ada di spec, belum terlihat di AppShell).

### 1.2 Buat posting terlalu panjang untuk sekali duduk

**Kondisi:** satu halaman memuat media, produk/link, deskripsi, pengaturan
generate, mode posting, checklist, dan preview. Untuk pengguna baru, langkah
pertama sudah terasa seperti mengisi formulir panjang.

**Saran:** pertahankan wizard bertahap (spesifikasi sudah menyebut "alur
berbentuk tahap"), tetapi tambahkan:
- tombol "Mulai cepat" yang hanya meminta produk + satu ide, lalu membuka
  editor;
- progres langkah yang terlihat dan bisa diklik;
- draft otomatis per langkah, bukan hanya per form.

### 1.3 Biaya AI tidak terlihat saat mengambil keputusan

**Kondisi:** widget biaya hanya ada di header Antrian; batas 80%/100% baru
terlihat di sana. Halaman Pengaturan tidak menampilkan sisa anggaran.

**Saran:** tampilkan sisa anggaran di topbar atau dashboard, dan sebelum
generate yang mahal (serial 30 hari, carousel) tampilkan perkiraan biaya.
Halaman `/biaya` sekarang bisa menjadi rujukan, tetapi belum mencegah kejutan.

### 1.4 Konfigurasi provider dan kegagalannya tersembunyi

**Kondisi:** provider AI diatur di Pengaturan; ketika provider database gagal,
sebelumnya tidak ada tanda apa pun kecuali hasil AI melambat/gagal.

**Saran yang sudah diterapkan:** log `env-fallback` + peringatan di widget dan
halaman biaya. Langkah berikutnya: tampilkan status provider aktif di topbar
(hijau/kuning/merah) agar tidak perlu membuka Pengaturan.

### 1.5 Alur persetujuan belum punya "alasan"

**Kondisi:** tombol Tolak langsung memindahkan konten ke tab Ditolak tanpa
catatan. Untuk evaluasi kualitas AI, alasan penolakan adalah data berharga.

**Saran:** dialog tolak dengan pilihan alasan singkat (hook lemah, klaim
berlebihan, link salah, gaya tidak cocok) yang disimpan bersama konten.

## 2. Frontend

### 2.1 Fetch dan error handling tidak seragam

**Kondisi:** beberapa komponen memeriksa `res.ok`, beberapa tidak
(`hapus`/`aktifkan` di `ai-provider-manager.tsx` mengabaikan status), sebagian
menelan error tanpa pesan (fetch biaya di Antrian). Tipe payload juga ditulis
ulang manual di klien.

**Saran:** satu helper `lib/api/klien.ts`:
- mengembalikan `{ ok, data, error }` bertipe;
- menangani 401 dengan mengarahkan ke `/masuk`;
- mencatat `requestId` untuk log.
Lalu pakai `StatistikBiaya` yang sama di server dan klien, bukan mendefinisikan
ulang bentuk respons.

### 2.2 Loading dan error global belum ada

**Kondisi:** tidak ada `app/(dashboard)/loading.tsx` atau `error.tsx`; setiap
halaman mengatur loading sendiri. Navigasi lambat bisa terasa "macet".

**Saran:** tambahkan `loading.tsx` dengan skeleton sesuai token visual dan
`error.tsx` yang menawarkan "Coba lagi" + tautan ke dashboard.

### 2.3 Komponen berat dimuat di awal

**Kondisi:** editor carousel, preview video, dan kalkulator dimuat sebagai
komponen klien biasa.

**Saran:** `next/dynamic` untuk editor carousel/video dan grafik analitik,
dengan placeholder yang menjaga layout.

### 2.4 Modal jadwal memakai `div`, bukan `dialog`

**Kondisi:** dialog jadwal di `antrian-review.tsx` adalah `div` fixed dengan
`role="dialog"`, tanpa focus trap dan tanpa Esc. `ConfirmDialog` sudah benar
memakai `<dialog>` native.

**Saran:** pindahkan dialog jadwal ke komponen berbasis `<dialog>` yang sama.

## 3. UI

### 3.1 Navigasi tumbuh melewati spesifikasi

**Kondisi:** spec menyebut sembilan item; sidebar sekarang berisi lebih dari
dua belas (Fokus harian, Riset, Buat video, Lab konten, Biaya AI, dan
seterusnya). Di laptop 768–1280 px daftar ini mulai sesak.

**Saran:** kelompokkan menjadi tiga grup: **Produksi** (Fokus, Riset, Buat
posting, Buat video, Lab), **Konten** (Antrian, Riwayat, Kalender), **Lainnya**
(Analitik, Aset, Biaya AI, Pengaturan). Atau biarkan sidebar ringkas dan pindah
item sekunder ke menu "Lainnya".

### 3.2 Widget biaya sekarang terlalu padat

**Kondisi:** setelah provider dan peringatan fallback ditambahkan, `CostWidget`
memuat total, progres, provider teratas, peringatan, dan tautan dalam kartu
selebar 224 px. Di mobile ini berisiko meluber.

**Saran:** kembalikan widget ke total + indikator status (titik kuning/merah);
rincian dan peringatan panjang pindah ke `/biaya`, dengan tautan "Rincian".

### 3.3 Istilah bercampur

**Kondisi:** "Antrian", "Pustaka konten", "Konten", "Riwayat", dan "Aset"
dipakai bergantian; "provider posting" dan "platform" juga kadang tertukar.

**Saran:** kunci istilah di `docs/glosarium.md` lalu samakan label menu, judul
halaman, dan pesan kosong. Contoh: satu nama untuk daftar konten, satu nama
untuk status "siap posting".

### 3.4 Umpan balik aksi belum konsisten

**Kondisi:** sebagian aksi memakai pesan inline di atas halaman, sebagian
dialog, sebagian tanpa konfirmasi; tidak ada toast global.

**Saran:** pola tetap: aksi reversibel → toast singkat + undo; aksi permanen →
`ConfirmDialog`; error → pesan di dekat kontrol yang gagal.

### 3.5 Aksesibilitas

**Yang sudah baik:** label `aria-label` pada tombol ikon, status memakai teks
(bukan warna saja), tabel memakai header, `ConfirmDialog` native.

**Yang perlu ditutup:** dialog jadwal (focus trap/Esc), tombol hapus/aktifkan
provider tanpa status proses, dan tabel baru `/biaya` perlu caption/`sr-only`
saat dibaca pembaca layar.

## Urutan yang disarankan

1. Satukan sumber data konten (localStorage vs Supabase).
2. Helper fetch + error/loading global.
3. Rapikan navigasi dan istilah.
4. Widget biaya kembali ringkas; detail di `/biaya`.
5. Alasan penolakan konten dan status provider di topbar.
