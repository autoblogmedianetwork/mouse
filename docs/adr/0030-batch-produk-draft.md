# ADR 0030: Batch produk sebagai draft dengan antrean review satu per satu

Status: diterima
Tanggal: 2026-11-10

## Konteks

Ide "Batch generate 3–5 produk" (docs/status-ide.md bagian 3.1) membutuhkan
antrean job. Generate teks otomatis untuk banyak produk sekaligus akan
melanggar AGENTS aturan 4 (tidak ada `siap_posting` tanpa aksi user) dan
memerlukan kunci AI yang tidak selalu tersedia. Jalur aman: batch pembuatan
draft (satu draft per produk) yang wajib ditinjau satu per satu di tab Perlu
review sebelum bisa ditandai siap posting. Tidak ada posting otomatis.

## Keputusan

1. **Penyimpanan lokal.** Batch disimpan di `localStorage` dengan kunci
   `autothreads-batch-produk`. Draft konten disimpan di `autothreads-konten`
   bersama konten lain. Tidak ada tabel Supabase baru.
2. **Ukuran batch 3–5 produk.** Sesuai judul ide. Validasi murni di
   `validasiBatch()` (minimum, maksimum, duplikat, keberadaan produk).
3. **Draft placeholder.** Setiap produk menjadi satu `Konten` status `draft`
   dengan satu status placeholder yang valid (≤ 500 karakter). Pengguna wajib
   menggantinya di Buat posting sebelum bisa ditandai siap.
4. **Antrean review satu per satu.** Status batch: `antri` → `proses` →
   `selesai`. Hanya satu item direview pada satu waktu (`indeks_review`).
   `tandaiDireview()` maju ke item berikutnya atau menyelesaikan batch.
   Batch yang belum dimulai tidak bisa ditandai selesai.
5. **Tidak menambah kolom ke `contents`.** Hubungan batch–konten dilacak lewat
   `konten_ids` di objek batch, bukan kolom baru, supaya skema database tetap
   stabil.
6. **Tidak ada generate AI.** Batch hanya membuat draft; generate teks tetap
   dilakukan per konten di Buat posting (satu produk, satu ide). Aturan 6
   (antarmuka sendiri) tetap: posting di `lib/posting/`, generate di
   `lib/ai/`.
7. **Halaman `/batch`** dengan tab di menu Konten, plus panel pemilihan produk,
   statistik batch, dan daftar batch dengan status.

## Konsekuensi

- Pengguna tetap harus meninjau dan melengkapi checklist tiap draft sebelum
  siap posting; tidak ada jalan pintas otomatis.
- Draft placeholder yang tidak diganti akan gagal gate `bisaTandaiSiap`.
- Batch lama tetap terbaca karena skema divalidasi dengan Zod (entry invalid
  dibuang, bukan crash).
