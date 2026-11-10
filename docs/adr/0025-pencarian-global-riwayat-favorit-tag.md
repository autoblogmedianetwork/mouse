# ADR 0025: Pencarian Global, Riwayat Riset, Favorit, dan Tag Produk

Status: diterima
Tanggal: 2026-11-11

## Konteks

Empat ide "aman, tanpa API" masih tertunda dan saling terkait: data pengguna
tersebar di beberapa kunci localStorage (konten, produk, bank masalah, riwayat
riset), sehingga mencari satu hal berarti membuka beberapa halaman. Produk
tersimpan juga belum bisa ditandai prioritas atau dikelompokkan.

## Keputusan

1. **Pencarian global** — `lib/cari/cari-global.ts` (`cariGlobal`) mencocokkan
   satu kata kunci ke konten (judul, produk, isi status), produk (nama, varian,
   tag), dan bank masalah (teks, kategori). Halaman `/cari` ada di menu Tools.
   Setiap hasil menautkan ke halaman sumbernya; konten diarahkan ke
   `/antrian?q=` supaya filter antrian langsung terisi.
2. **Riwayat pencarian riset** — `lib/riset/riwayat-pencarian.ts` menyimpan
   maksimal 8 pasangan niche+audiens di `autothreads-riwayat-riset`, dedupe
   berdasarkan pasangan (case-insensitive), terbaru di depan. `PanelRiset`
   menampilkan chip "pakai ulang" dan mencatat riwayat hanya setelah riset
   berhasil.
3. **Favorit/pin produk** — `lib/produk/favorit.ts` menyimpan id produk favorit
   di `autothreads-produk-favorit`. Daftar produk diurutkan favorit lebih dulu;
   tombol ★/☆ di setiap baris menyimpan perubahan seketika.
4. **Tag/label produk** — `lib/produk/tag.ts` menormalkan input koma menjadi
   maksimal 5 tag huruf kecil (≤24 karakter). Tag disimpan sebagai field
   opsional `tag` pada produk, ditampilkan sebagai chip, dan dipakai filter
   (AND) di daftar produk. Data lama tanpa `tag` tetap terbaca.

## Konsekuensi

- Tidak ada dependency baru dan tidak ada API; semua data tetap di browser.
- `lib/produk/store.ts` menjadi satu-satunya pembaca kunci
  `autothreads-products`, sehingga pencarian dan form produk tidak lagi
  mendefinisikan ulang nama kunci.
- Daftar produk kini dimuat setelah mount (sebelumnya hanya muncul setelah
  menyimpan di sesi yang sama), jadi favorit dan tag langsung terlihat.
- Pencarian global hanya mengindeks data lokal; data Supabase belum termasuk
  sampai ada indeks server.
