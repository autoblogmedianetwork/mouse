# Fitur Daftar Produk Belum Diposting

Sumber masalah (feedback Claude #3 — Sedang): user harus mengingat sendiri
produk mana yang sudah lama tidak diangkat. Fitur ini menampilkan daftar
produk dari pustaka konten dengan **filter jarak waktu sejak terkirim
terakhir**, di halaman Analitik.

## Aturan penilaian

| Hal | Aturan |
|---|---|
| Sumber | Pustaka konten (`autothreads-konten`), hasil `kontenSkema.safeParse` |
| Satu produk | Satu nilai unik `produk_nama` (kosong diabaikan) |
| Terkirim terakhir | `updated_at` terbesar di antara konten `status = 'terkirim'`; valid karena `tandaiTerkirim` mencatat waktu kirim di situ |
| Konten arsip | Tetap dihitung untuk riwayat kirim — K3 hanya menyembunyikan dari antrian, bukan menghapus sejarah |
| `updated_at` rusak | Konten tetap dihitung terkirim, tapi tidak menentukan tanggal terakhir (tanpa tanggal palsu) |
| Belum pernah | Tidak ada satu konten pun yang terkirim; urutannya paling atas |
| Urutan | Belum pernah → usia terlama → nama produk |
| Batas bawaan | 7 hari (konsistensi mingguan, sesuai feedback), opsi 7/14/30/90 |

Filter mengambil produk yang **belum pernah** terkirim atau usianya
**lebih tua dari batas** (inklusif): batas 7 = "lebih dari seminggu tidak
diangkat".

## Komposisi kode

| Berkas | Isi |
|---|---|
| `lib/produk/status-posting.ts` | Agregasi + filter (fungsi murni, tanpa storage) |
| `lib/produk/status-posting.test.ts` | 11 test: agregasi, tanggal terakhir, arsip, input rusak, urutan, filter |
| `features/analitik/daftar-produk-belum-diposting.tsx` | Tabel + filter di halaman Analitik |
| `app/(dashboard)/analitik/page.tsx` | Memasang bagian di bawah laporan performa |

## Perilaku penting

1. Bagian ini **tidak bergantung laporan impor**: jika halaman Analitik masih
   kosong dari data komisi, daftar produk tetap tampil dari pustaka konten.
2. Bila pustaka benar-benar kosong, bagian ini tidak dirender sama sekali.
3. Bila semua produk sudah diposting dalam batas, ada kalimat positif bukan
   tabel kosong.
4. Tombol "Buat ulang konten" menuju `/posting/baru` — tidak membuat konten
   otomatis; semua output tetap draft sampai aksi user (PRD F0).

## Batas

Produk dikenali lewat nama (`produk_nama`), jadi salah ketik nama yang sama
dianggap produk berbeda. Nanti setelah contents pindah ke Supabase dan ada
tabel `products` dengan id, saringan berbasis id lebih akurat.
