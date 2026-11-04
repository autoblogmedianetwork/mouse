# ADR 0012: Kerangka penulisan sebagai parameter terpisah dari gaya hook

Tanggal: 5 November 2026. Status: diterima.

## Konteks

Prompt 03 (`generate-status`) sudah punya `gaya_hook`: pertanyaan, masalah
relatif, pernyataan mengejutkan, before-after, contrarian, curiosity gap.
Semua itu menjawab satu pertanyaan saja — **bagaimana status pertama dibuka**.

Yang belum ada adalah kendali atas **urutan isi** setelah pembuka. Praktik yang
dipakai di konten affiliate (PSC, AIDA, PAS, BAB, HBSC, dan alur mengobrol
Masalah–Situasi–Solusi–Pertimbangan–CTA) semuanya soal urutan bagian, bukan
soal kalimat pembuka. Menaruhnya di `gaya_hook` akan mencampur dua keputusan
yang berbeda dan membuat daftar hook membengkak tanpa arah.

## Keputusan

1. **Parameter baru `kerangka`, bukan nilai baru di `gaya_hook`.**
   Daftar di `lib/ai/kerangka.ts`: `bebas`, `psc`, `aida`, `pas`, `bab`,
   `hbsc`, `msspc`. Default `bebas` supaya draf lama dan perilaku sebelumnya
   tidak berubah.
2. **Prompt 03 naik ke versi baru `generate-status.v6`.** Isinya wrapper di
   atas v5; dengan `kerangka: "bebas"` teks prompt identik dengan v5, dan
   diuji begitu. v5 dan versi sebelumnya tidak disentuh (AGENTS rule 13).
3. **Daftar kerangka adalah data, bukan cabang if-else.** Label UI, keterangan
   singkat, dan blok prompt dibaca dari satu modul; menambah kerangka baru
   tidak menyentuh route maupun form.
4. **Kerangka hanya mengatur urutan, bukan fakta.** Semua blok kerangka
   memuat aturan yang sama: fakta hanya dari data penawaran, bagian yang
   datanya tidak ada dilewati, dan pancingan interaksi kosong ("beda banget
   kan?") dilarang jadi pola.
5. **HBSC tidak mengarang social proof.** Belum ada field ulasan atau jumlah
   terjual di aplikasi, jadi bloknya menyuruh model memakai bukti yang memang
   ada di data penawaran dan **melewati** bagian social proof bila kosong.
   Menambah kolom bukti adalah pekerjaan terpisah.
6. **Nilai kerangka disimpan per konten.** `contents.pengaturan.kerangka`
   (jsonb, tanpa migrasi baru) dan `Konten.kerangka` di skema lokal, sehingga
   klik dan komisi bisa dibandingkan per kerangka di kemudian hari.

## Alternatif yang ditolak

- **Menambah `psc`, `aida`, dan seterusnya sebagai nilai `gaya_hook`.**
  Menggandakan makna hook dan membuat kombinasi hook × kerangka mustahil
  dibedakan saat analisis.
- **Membuat kolom `contents.kerangka` sekarang.** Belum ada query yang
  memfilternya; jsonb `pengaturan` sudah cukup sampai analitik per kerangka
  benar-benar dibangun (dan sampai itu terjadi, bentuknya masih bisa berubah).
- **Memaksa setiap bagian kerangka jadi satu status.** Panjang utas berbeda
  per preset; memaksa satu bagian satu status akan melanggar batas 500
  karakter atau menghasilkan utas kosong.
- **Mengisi social proof dari asumsi.** Melanggar aturan kepercayaan dan
  aturan AI: tidak boleh mengarang rating, jumlah terjual, atau testimoni.

## Konsekuensi

- Form Pengaturan generate mendapat satu dropdown "Kerangka penulisan" dengan
  keterangan singkat per pilihan.
- Pilihan ini tersimpan otomatis bersama draf Buat posting (localStorage) dan
  ikut tercatat saat konten disalin ke `contents`.
- Mode carousel dan naskah video belum memakai `kerangka`; keduanya punya
  struktur sendiri, dan perubahan itu butuh versi prompt masing-masing.
