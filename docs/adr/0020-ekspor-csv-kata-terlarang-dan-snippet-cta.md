# ADR 0020: Ekspor CSV, Kamus Kata Terlarang Lokal, dan Snippet CTA

Status: diterima
Tanggal: 2026-11-10

## Konteks

Pengguna Heaviliate membutuhkan peningkatan efisiensi kerja harian tanpa biaya API dan tanpa risiko pelanggaran akun affiliate:
1. **Spreadsheet workflow:** Pengguna mengelola antrean konten di Excel / Google Sheets, namun sebelumnya hanya tersedia ekspor JSON dan TXT.
2. **Keamanan akun (Klaim berlebihan & UI platform):** Konten affiliate sering terkena shadowban atau penalti bila memuat kata klaim absolut ("terbaik", "100% ampuh", "dijamin") atau frasa UI terlarang ("klik keranjang kuning").
3. **Penyisipan penutup/CTA berulang:** Penulis konten affiliate sering mengetik ulang kalimat ajakan beli (link di bio, balasan komentar, ajak diskusi).

## Keputusan

1. **Ekspor CSV standar RFC 4180 dengan BOM UTF-8** (`lib/konten/ekspor.ts`):
   - Menambahkan fungsi `eksporCSV(list: Konten[])`.
   - Mengikutsertakan header lengkap: ID, Judul, Status, Format, Produk, Link Produk, Letak Link, Jadwal Tayang, Hook, dan Gabungan Status.
   - Menggunakan UTF-8 BOM (`\uFEFF`) agar langsung terbaca rapi di Microsoft Excel tanpa rusak huruf aksen atau pemisah koma.
   - Menambahkan tombol "Ekspor CSV" di `/antrian`.

2. **Kamus Kata Terlarang Lokal** (`lib/konten/kata-terlarang.ts`):
   - Murni berbasis regex lokal (zero latency, tanpa AI).
   - Mendeteksi 3 kategori: `klaim_berlebihan` ("terbaik", "termurah", "100%", "dijamin"), `pelanggaran_platform` ("klik keranjang kuning", "check out sekarang"), dan `urgensi_palsu` ("sebelum kehabisan", "hanya hari ini").
   - Menampilkan peringatan visual di `StatusEditor` lengkap dengan alasan dan saran pengganti kata yang lebih aman.

3. **Snippet CTA Pribadi** (`lib/konten/snippet-cta.ts`):
   - Menyediakan 4 template bawaan favorit affiliate ("Link di Bio", "Komentar / Balasan", "Ajak Diskusi", "Minta Link DM").
   - Disimpan di `localStorage` peramban.
   - Satu-klik menyisipkan teks CTA ke status terakhir pada `StatusEditor`.

## Konsekuensi

- Pengguna dapat langsung membuka data konten di Google Sheets atau Excel.
- Risiko konten terkena penalti platform berkurang karena kata berisiko ditandai sebelum konten disalin/diposting.
- Penulisan konten lebih cepat tanpa perlu copas manual kalimat CTA dari catatan terpisah.
- Tidak ada penambahan dependency baru dan tidak ada pemanggilan API berbayar.
