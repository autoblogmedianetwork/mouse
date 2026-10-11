# golden/

Set uji kualitas prompt. Dipakai setiap kali `prompts/` berubah, saat model diganti, dan sebelum
rilis tiap fase (`docs/rencana-testing.md` bagian 5).

## Status sekarang

Sepuluh berkas `produk-01.json` sampai `produk-10.json` masih **placeholder**: semuanya berisi
`"status": "belum_diisi"` dan kolom `input` masih null. Prasyarat **P5** (golden set 10 produk
ditulis manual dari listing nyata) belum selesai, jadi skrip golden hanya bisa memverifikasi
struktur berkas, belum kualitas output AI.

## Struktur berkas

| Bagian | Isi |
|---|---|
| `id`, `status` | `belum_diisi` sampai diisi, lalu `siap` |
| `kategori` | Kategori produk, dipakai melihat sebaran set |
| `input.nama`, `varian`, `harga` | Data dari listing, disalin manual |
| `input.deskripsi_bersih` | Hasil pembersih deskripsi, bukan deskripsi mentah |
| `input.foto` | Array path foto produk yang ikut dikirim ke visi (boleh kosong di P7) |
| `harapan.analisis` | Fitur yang wajib muncul, dan hal yang tidak boleh muncul |
| `harapan.ide` | Jumlah ide (10) dan format yang wajib ada (minimal satu "Pengalaman") |
| `harapan.status` | Batas 500 karakter, wajib menyebut kekurangan, tidak boleh ada harga |
| `penilaian` | Skor manual 1 sampai 5 per kriteria, plus catatan |

## Cara mengisi (P5)

1. Pilih produk yang pernah kamu promosikan, bukan produk karangan, supaya faktanya bisa dicek.
2. Salin nama, varian, harga, dan deskripsi dari listing, lalu jalankan pembersih deskripsi.
3. Isi `harapan.analisis.wajib_ada_fitur` dengan 3 sampai 5 fitur nyata dari deskripsi.
4. Ganti `status` menjadi `siap`. Jangan ubah `harapan` setelah set pertama dijalankan, karena
   rubrik jadi tidak bisa dibandingkan antar versi prompt.

## Cara menjalankan

| Perintah | Fungsi |
|---|---|
| `npm run test:golden` | Jalankan prompt ke semua produk (tersedia mulai Fase 2) |
| `npm test` | Tes unit dan fixture; tidak memanggil API |

Tahap 1 (validasi otomatis, wajib lulus): JSON valid, jumlah ide tepat 10, label format sesuai
daftar, tidak ada status di atas 500 karakter, tidak ada harga, jumlah status sesuai pengaturan uji.

Tahap 2 (manual): skor 1 sampai 5 per kriteria memakai `rubrik.md`. Skor di bawah 3 wajib diberi
alasan. Penilaian dilakukan tanpa melihat versi prompt, supaya tidak bias.

## Aturan penerimaan prompt baru

- Semua produk lulus validasi otomatis, atau kegagalannya dijelaskan.
- Rata-rata skor tidak turun, dan tidak ada produk yang turun lebih dari 1 poin.
- Hasil dicatat di `docs/eval-log.md` bersama versi prompt dan tanggal.

Prompt lama tidak pernah diubah atau dihapus; versi baru dibuat dengan nama baru, misalnya
`prompts/02-ide-konten.v2.md`.
