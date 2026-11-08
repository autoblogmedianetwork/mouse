# ADR 0017: Aturan anti-terjemahan pada prompt generate status

Status: diterima
Tanggal: 2026-11-08

## Konteks

Draf status dari `/api/generate` (prompt `generate-status.v6`) kadang keluar
seperti iklan Inggris yang diterjemahkan kata per kata:

> Pernah nyesel kalau nasi hangat hilang cepat di warung? Di tengah keramaian,
> pelanggan rasa dingin bikin kecewa. Karyawan juga ribet cari air dingin
> sambil buka. Hidup di warung itu kan penuh tantangan. Ada solusi yang bisa
> bikin semua lebih nyaman.

Penyebabnya dua lapis:

1. **Model.** `AI_MODEL` saat ini `nvidia/nemotron-3.5-lightning:free` lewat
   OpenRouter. Model sekecil ini fasih menyusun kalimat benar secara tata
   bahasa, tetapi menerjemahkan pola iklan Inggris dan memakai partikel
   ("kan") sebagai pengisi.
2. **Prompt.** Blok `ATURAN_BAHASA` di `lib/ai/gaya-bahasa.ts` hanya melarang
   kata formal (`merupakan`, `disarankan`, …) dan meminta kalimat pendek.
   Tidak ada larangan terhadap pola terjemahan, tidak ada contoh benar-vs-salah,
   dan tidak ada kewajiban menyebut detail nyata. Kalimat pendek tanpa isi
   konkret berubah menjadi deretan klise.

## Keputusan

Naikkan prompt ke **`generate-status.v7`** (v6 dan sebelumnya tidak diubah,
AGENTS rule 13). v7 membungkus v6 lalu menambahkan blok
`ATURAN_ANTI_TERJEMAHAN` di posisi paling akhir:

1. Larangan pembuka pertanyaan retoris ("Pernah …?", "Siapa yang …?").
2. Daftar frasa klise terjemahan yang dilarang ("di tengah keramaian",
   "penuh tantangan", "ada solusi yang", "bikin semua lebih nyaman", …).
3. Larangan partikel pengisi ("kan", "loh", "nih").
4. Kewajiban satu detail konkret dari data produk; bila data tidak ada, situasi
   spesifik — dilarang mengarang angka.
5. Batas 2–4 kalimat, target di bawah 300 karakter.
6. Uji mandiri: bila tidak ada satu detail yang bisa diingat, ulang.
7. Tiga pasang contoh **sebelum → sesudah**.

Blok diletakkan paling akhir karena model memberi bobot lebih pada instruksi
terakhir, dan contoh konkret lebih dipatuhi model kecil daripada larangan.

`gaya-bahasa.ts` **tidak** diubah: blok itu dipakai semua prompt (analisis,
ide, carousel, naskah video), sehingga menyuntingnya menggeser perilaku di luar
scope task ini.

## Konsekuensi

- Route `/api/generate` dan runner golden kini memakai v7.
- Draf yang dihasilkan ulang untuk produk lama bisa berbeda panjang dan gaya;
  ini disengaja (status tetap draft, user yang memutuskan).
- Perbaikan ini tidak menghapus keterbatasan model. Bila hasil masih terasa
  kaku, langkah berikutnya adalah mengganti `AI_MODEL` ke model yang lebih
  fasih Indonesia — perubahan env, bukan kode.
- Karena daftar larangan bisa bertambah, versi berikutnya dibuat sebagai v8,
  bukan dengan menimpa v7.
