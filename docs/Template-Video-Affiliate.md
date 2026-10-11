# Template Video Affiliate (Produk Global)

Template ini berlaku untuk produk apa pun. Ganti semua bagian dalam `{{ }}` dengan data produk kamu. Pemakaian: ChatGPT untuk ide dan storyboard, lalu JSON untuk Google Flow.

---

## Tahap 1: Riset Produk dan Angle (ChatGPT)

Prompt:

```
Kamu adalah content strategist untuk affiliate Shopee yang membuat video pendek
berbahasa Indonesia kasual untuk Threads dan platform video vertikal.

Produk:
- Nama: {{NAMA_PRODUK}}
- Kategori: {{KATEGORI}}
- Deskripsi dari listing (sudah disalin manual):
<deskripsi>
{{DESKRIPSI_PRODUK}}
</deskripsi>
- Target audiens: {{TARGET_AUDIENS}}
- Masalah yang diselesaikan produk: {{MASALAH}}

Tugasmu:
1. Usulkan 3 angle video (masalah, manfaat, perbandingan, atau pengalaman).
2. Untuk tiap angle, tulis hook 3 detik pertama.
3. Tandai klaim yang tidak bisa dibuktikan dari deskripsi.
4. Sebutkan 2 kekurangan atau batasan produk yang wajar disebut di video.

Aturan:
- Jangan mengarang spesifikasi, bahan, atau hasil yang tidak ada di deskripsi.
- Jangan menggambarkan produk melakukan sesuatu yang tidak bisa dilakukan produk.
- Tulis dalam Bahasa Indonesia kasual.
```

---

## Tahap 2: Storyboard (ChatGPT)

Prompt:

```
Dari angle terpilih berikut:
{{ANGLE_TERPILIH}}

Buat storyboard video {{DURASI}} detik, rasio 9:16, dengan {{JUMLAH_SCENE}} scene.
Untuk setiap scene, tulis:
- Nomor dan durasi (detik)
- Deskripsi visual (apa yang terlihat)
- Gerakan kamera
- Teks di layar (maksimal 8 kata)
- Narasi atau dialog (opsional, maksimal 15 kata)
- Suara latar

Aturan:
- Scene 1 harus berisi hook yang menahan penonton dalam 3 detik pertama.
- Scene terakhir berisi ajakan halus, tanpa "beli sekarang" yang keras.
- Sertakan 1 scene yang menampilkan kekurangan atau batasan produk.
- Produk harus tampil sesuai referensi visual di bawah, jangan mengubah warna, bentuk, atau isi paket.

Referensi visual produk (dari listing):
{{DESKRIPSI_VISUAL}}
```

---

## Tahap 3: Ubah Storyboard ke JSON (ChatGPT)

Prompt:

```
Ubah storyboard berikut menjadi JSON dengan skema di bawah.
Balas HANYA JSON valid, tanpa teks lain dan tanpa markdown.

Storyboard:
{{STORYBOARD}}

Skema:
{
  "video": {
    "durasi_detik": number,
    "rasio": "9:16",
    "gaya_visual": "string",
    "bahasa_narasi": "id"
  },
  "produk": {
    "nama": "string",
    "referensi_visual": "string"
  },
  "scenes": [
    {
      "id": number,
      "durasi_detik": number,
      "deskripsi_visual": "string",
      "kamera": "string",
      "teks_layar": "string",
      "narasi": "string | null",
      "suara": "string"
    }
  ],
  "larangan": ["string"]
}

Isi "larangan" dengan: produk tidak boleh berubah bentuk atau warna,
tidak boleh ada teks harga atau klaim yang tidak ada di listing,
dan tidak boleh ada wajah orang yang menyerupai tokoh nyata.
```

---

## Tahap 4: Generate di Google Flow

1. Buka Google Flow dan buat proyek baru.
2. Masukkan JSON per scene, atau satu prompt ringkas yang diambil dari `deskripsi_visual` dan `kamera` tiap scene.
3. Generate scene satu per satu. Cek hasil sebelum lanjut ke scene berikutnya.
4. Gabungkan scene dan tambahkan teks layar di editor video.
5. Untuk tiap scene yang produknya terlihat, bandingkan dengan foto produk asli. Jika berbeda, generate ulang atau pakai foto asli di scene itu.

Catatan: format input Google Flow bisa berubah. Sesuaikan langkah 2 dengan cara input yang berlaku saat kamu memakai.

---

## Checklist Sebelum Upload

- [ ] Produk di video sesuai foto dan listing (warna, bentuk, isi paket).
- [ ] Tidak ada klaim yang tidak bisa dibuktikan (misalnya "terbaik", "100% aman").
- [ ] Ada satu scene yang menyebut kekurangan atau batasan produk.
- [ ] Hook muncul dalam 3 detik pertama.
- [ ] Teks layar bisa dibaca di layar HP.
- [ ] Ada disclosure affiliate, misalnya "#iklan" atau "link affiliate".
- [ ] Tidak ada pengakuan pengalaman pakai yang tidak benar. Jika belum memakai produk, jangan tulis seolah sudah.
- [ ] Link affiliate sudah diuji dan mengarah ke produk yang benar.

---

## Catatan Hukum dan Etika

- Video AI yang menampilkan produk seolah-olah hasil pemakaian nyata bisa menyesatkan audiens. Beri tahu audiens bahwa visualnya dibuat AI jika menampilkan hasil yang tidak nyata.
- Ikuti kebijakan affiliate Shopee dan aturan Threads yang berlaku saat posting.

---

## Catatan tools media (ADR 0003)

- Hapus background foto produk (rembg) bersifat opsional dan default mati. Jika aktif, foto yang dikirim ke Google Flow sudah tanpa background.
- Render template (HyperFrames) juga opsional. Jika aktif, storyboard bisa dirender lokal sebagai alternatif Google Flow untuk video teks sederhana.
- Narasi VO bisa memakai provider TTS cloud atau VoiceStudio lokal, sesuai pengaturan. Suara yang di-clone harus suara yang punya hak untuk dipakai.
