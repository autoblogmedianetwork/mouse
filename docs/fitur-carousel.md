# Fitur: Carousel Konten

**Versi:** 0.1
**Acuan:** PRD F4 dan F7.1, UI Spec 3.2, ADR 0003 (tools media)
**Status keputusan:** menunggu K13 di `docs/keputusan.md`

Carousel adalah rangkaian gambar (slide) dengan teks, dibuat dari ide konten. Fitur ini memakai alur yang sama dengan utas Threads: ide, generate, review, lalu salin atau posting. Bedanya, hasil akhirnya berupa gambar.

---

## 1. Tujuan

- Mengubah satu ide menjadi carousel 3 sampai 10 slide, siap diunggah ke Instagram, Threads, atau platform lain yang mendukung gambar berurutan.
- Mengurangi kerja manual membuat desain untuk setiap slide.
- Tetap mengikuti aturan draft-first, checklist, dan kontrol klaim.

---

## 2. Struktur carousel

| Slide | Peran | Isi | Batas |
|---|---|---|---|
| 1 (cover) | Hook | Kicker (label kecil), headline | Headline maksimal 8 kata |
| 2 sampai n-1 | Isi | Satu poin per slide: judul kecil dan penjelasan | Penjelasan maksimal 25 kata |
| n (CTA) | Ajakan | Ajakan halus, misalnya "Cek link di bio" | Maksimal 12 kata |

Jumlah slide: 3 sampai 10. Default 5.

Setiap slide juga memuat footer berisi handle akun dan sumber (jika ide berasal dari artikel media).

---

## 3. Pilihan format

| Pengaturan | Pilihan | Default |
|---|---|---|
| Rasio | 4:5 (1080 x 1350), 1:1 (1080 x 1080) | 4:5 |
| Jumlah slide | 3 sampai 10 | 5 |
| Template | Template tetap (lihat bagian 4) | Template 1 |
| Sumber visual | Foto produk (F0), tanpa gambar, atau gambar AI (opsional, belum diputuskan) | Foto produk jika ada |
| Gaya kicker | Teks kecil di atas headline | Aktif |
| Format | Carousel penuh atau slide tunggal | Carousel penuh |

Catatan:
- Rasio 4:5 umumnya cocok untuk feed Instagram. Dukungan rasio untuk Threads dan platform lain perlu dicek sebelum diaktifkan.
- Gambar AI tidak dimasukkan ke MVP, karena provider gambar belum diverifikasi (P1 dan P8 hanya mencakup teks dan visi).

---

## 4. Template tetap

Template disimpan sebagai file HTML dengan placeholder, di `lib/carousel/templates/`. Setiap template punya palet, font, dan posisi teks sendiri.

| Template | Gaya | Cocok untuk |
|---|---|---|
| 1 | Latar gelap, headline besar, aksen satu warna | Teknologi, ulasan produk |
| 2 | Latar terang, headline serif | Edukasi, tips |
| 3 | Latar penuh warna, teks tebal | Promosi, tawaran |

Aturan template:
- Ukuran teks minimal 48 piksel untuk headline dan 32 piksel untuk isi.
- Tidak ada script atau font dari CDN luar (sesuai prompt 06 dan ADR 0003).
- Foto produk ditampilkan tanpa diubah bentuk atau warnanya.

---

## 5. Alur

```
Ide terpilih (dari Tahap 3)
      ↓
Pengaturan carousel (jumlah slide, template, rasio)
      ↓
AI membuat slide (prompt 08)  ← checkpoint 1: review teks slide
      ↓
Isi HTML dari template (kode, bukan AI)
      ↓
Render ke PNG per slide (renderer, lihat bagian 6)  ← checkpoint 2: review visual
      ↓
AI membuat caption dan hashtag (prompt 08, bagian kedua)
      ↓
Checklist carousel  ← checkpoint 3
      ↓
Status siap_posting, lalu salin atau kirim lewat provider posting
```

Setiap checkpoint menunggu aksi user, sesuai draft-first.

---

## 6. Renderer

Renderer mengubah HTML slide menjadi gambar PNG. Mengikuti pola adapter di ADR 0003.

| Backend | Cara kerja | Kapan dipakai |
|---|---|---|
| `off` | Tidak ada render. User mengunduh HTML dan merender sendiri, atau membuat di Canva | Default untuk laptop jadul |
| `local` | Chromium headless (Playwright) sebagai sidecar di PC atau VPS | Jika perangkat memadai |
| `cloud` | Layanan render HTML ke gambar, dengan kunci API | Jika tersedia dan biayanya jelas |

Konfigurasi:
- Variabel: `MEDIA_CAROUSEL_RENDER=off|local|cloud`
- Variabel tambahan untuk `local`: `CAROUSEL_RENDER_URL`

Catatan:
- HyperFrames dirancang untuk video. Untuk PNG per slide, perlu dicek apakah bisa dipakai atau lebih cocok memakai Chromium langsung.
- Render Chromium berat di laptop jadul. Gunakan `off` sampai ada VPS atau PC yang cukup.

---

## 7. Caption dan hashtag

Caption dan hashtag dibuat oleh prompt 08 (bagian kedua), dengan aturan:
- Caption maksimal 2.200 karakter (batas Instagram), dengan batas per platform dari tabel `platforms` jika sudah ada.
- Hashtag maksimal 5, relevan dengan produk dan topik.
- Disclosure affiliate wajib ada jika konten berisi link.
- Jika ide berasal dari artikel media, sumbernya disebut.

---

## 8. Checklist carousel

Ditambahkan ke checklist umum (Workflow tahap 7):

- [ ] Jumlah slide sesuai pengaturan (3 sampai 10)
- [ ] Setiap slide terbaca di layar HP (ukuran teks sesuai bagian 4)
- [ ] Foto produk di slide sesuai listing
- [ ] Tidak ada klaim tanpa dasar di headline atau isi
- [ ] Slide CTA ada dan tidak memaksa
- [ ] Footer berisi handle dan sumber (jika ada)
- [ ] Caption memuat disclosure affiliate (jika ada link)
- [ ] Hashtag tidak lebih dari 5

Pemeriksaan jumlah slide, panjang teks, dan keberadaan disclosure dilakukan otomatis di kode. Sisanya manual.

---

## 9. Data

Rencana tabel (migrasi 0002, belum dijalankan):

```
carousel_slides
  id uuid pk
  user_id uuid (RLS)
  content_id uuid (cascade)
  urutan integer
  peran text            -- cover | isi | cta
  kicker text
  headline text         -- maksimal 8 kata, dicek di kode
  isi text              -- maksimal 25 kata, dicek di kode
  template text
  rasio text            -- 4:5 | 1:1
  path_render text      -- kosong jika renderer off
  unique (content_id, urutan)
```

Hasil render disimpan di Supabase Storage, di folder `{user_id}/carousel/{content_id}/`, dengan aturan retensi yang sama seperti foto (K3).

---

## 10. Urutan implementasi

| Fase | Isi |
|---|---|
| Fase 3 | Carousel tanpa render: AI membuat teks slide dan caption, user menyalin ke Canva atau alat lain |
| Fase 4.5 | Template HTML dan renderer `off`, ekspor HTML dan teks per slide |
| Fase 4.5 atau setelahnya | Renderer `local` atau `cloud`, setelah perangkat atau layanan diuji (P10) |
| Fase 6 | Analitik per format (carousel dibanding video dibanding teks) |

---

## 11. Yang belum diputuskan

1. K13: renderer mana yang dipakai, dan apakah gambar AI masuk.
2. Apakah Threads mendukung carousel gambar dan rasio apa yang diterima.
3. Apakah template 1 sampai 3 cukup, atau perlu template tambahan.
