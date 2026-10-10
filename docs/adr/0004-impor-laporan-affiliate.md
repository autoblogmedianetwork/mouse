# ADR 0004: Impor laporan affiliate per marketplace tanpa dependency baru

Status: diterima
Tanggal: 11 Oktober 2026
Terkait: ADR 0002 (provider per fungsi), Workflow bagian 6 (deteksi marketplace), Fase 6 (Analitik)

## Konteks

Pemilik punya penghasilan affiliate dari tiga tempat: Shopee Affiliate, TikTok Shop Affiliate, dan
Tokopedia Affiliate. Setiap program menyediakan ekspor laporan sendiri, dengan nama kolom, bahasa,
pemisah, dan format angka yang berbeda. Selama ini angka performa dicatat manual di halaman Link
Affiliate, sehingga dashboard hanya bisa menampilkan apa yang diingat user.

Ekspor dari ketiga program umumnya berupa `.xlsx`, bukan `.csv`. Membaca `.xlsx` biasanya memerlukan
library pihak ketiga (SheetJS dan sejenisnya), sementara aturan proyek (AGENTS rule 3) melarang
menambah dependency tanpa izin, dan aplikasi harus tetap ringan untuk pemakaian pribadi.

Di sisi lain, Workflow bagian 6 sudah menyiapkan kolom domain marketplace: Shopee aktif, Tokopedia
dan TikTok Shop berstatus roadmap. Fitur ini mempercepat bagian roadmap tersebut.

## Keputusan

Membuat modul impor sendiri di `lib/impor/`, tanpa dependency baru:

| Berkas | Tanggung jawab |
|---|---|
| `csv.ts` | Parser CSV/TSV: deteksi pemisah (`,` `;` tab `|`), kutip ganda, BOM, CRLF, deteksi baris header |
| `normalisasi.ts` | Angka (format Indonesia dan Inggris, negatif/retur), persen, tanggal (ISO, dd/mm/yyyy, nama bulan, serial Excel), pengelompokan status pesanan |
| `xlsx.ts` | Pembaca `.xlsx` minimal: ZIP dibuka sendiri lalu sheet XML diubah menjadi matriks teks, memakai `DecompressionStream('deflate-raw')` yang sudah ada di peramban modern dan Node 18+ |
| `marketplace.ts` | Peta alias kolom per marketplace + deteksi otomatis (skor kolom khas + petunjuk nama berkas) + pemetaan manual |
| `parse.ts` | Orkestrasi: berkas/tempel → tabel → marketplace → peta kolom → baris tervalidasi Zod |
| `skema.ts` | Skema Zod baris performa, sumber impor, dan simpanan, dengan bentuk yang sejajar calon tabel database |
| `performa.ts` | Dedupe (kunci dari `marketplace + id_pesanan`), penggabungan, dan agregasi: komisi cair/tertunda/batal, GMV, per marketplace, produk teratas, tren bulanan |
| `store.ts` | Simpanan localStorage dengan pesan kegagalan kuota yang eksplisit |

Aturan yang dipegang:

1. **Deteksi otomatis, keputusan tetap di user.** Marketplace dideteksi dari header dan nama berkas,
   tetapi user bisa mengganti pilihan dan memetakan kolom sendiri. Jalur tempel teks selalu tersedia
   (prinsip "input manual selalu ada" di PRD F1).
2. **Baris rusak tidak menggagalkan impor.** Baris tanpa komisi atau tanpa produk dilewati dengan
   alasan yang bisa dibaca, bukan membatalkan seluruh berkas.
3. **Dedupe, bukan penumpukan.** Impor ulang berkas yang sama atau laporan yang tumpang tindih
   memperbarui baris lama (status berubah dari menunggu ke selesai), tidak menggandakan komisi.
4. **Semua output divalidasi Zod** sebelum disimpan (AGENTS rule 9).
5. **Data belum masuk Supabase.** Auth belum aktif (K4, P3), jadi baris performa disimpan di
   localStorage dengan bentuk yang sama seperti calon tabel `performa_imports` dan `performa_rows`
   (lihat `skema-database.md` bagian 8). Migrasi nanti hanya memindahkan field.
6. **Menambah marketplace baru** cukup menambah alias di `marketplace.ts`, satu fixture di
   `tests/fixtures/`, dan satu test di `marketplace.test.ts` + `parse.test.ts`.

## Konsekuensi

- Aplikasi bisa membaca `.xlsx` asli dari ketiga program tanpa menambah paket, dan tanpa mengirim
  data ke server mana pun: seluruh pembacaan terjadi di peramban.
- Batasan yang harus diketahui:
  - `.xls` (format lama, bukan ZIP) tidak didukung. Pesannya meminta user menyimpan ulang sebagai
    `.xlsx` atau CSV.
  - Sistem tanggal 1904 (jarang dipakai) tidak ditangani; hanya serial 1899-12-30.
  - Tanggal ambigu `01/02/2026` dianggap dd/mm karena laporan berasal dari marketplace Indonesia.
  - Batas 20.000 baris per impor dan kuota localStorage (sekitar 5 MB) membatasi volume; jika
    terlampaui, user diberi pesan untuk menghapus data lama.
- Dashboard dan halaman Analitik kini memakai satu sumber perhitungan (`performa.ts`), jadi angka di
  kedua halaman tidak bisa berbeda.
- Saat Supabase aktif, `store.ts` diganti pemanggilan database dan bentuk barisnya tetap.
