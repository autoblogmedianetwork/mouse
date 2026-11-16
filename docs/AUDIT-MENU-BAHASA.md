# Audit Menu & Bahasa Heaviliate

Diaudit: 17 November 2026 · commit `202f857`
Metode: skill `ui-taste` (playbook **distill**) + `ux-flow`.
Sumber data: `components/nav-config.ts`, `PageHeader` di 22 halaman, label tombol di
`features/lab/`.

Status: **laporan saja — belum ada yang diubah.**

---

## 1. Ringkasan

Menu Heaviliate secara struktur **sudah cukup baik**: ada alur 4 langkah yang jelas.
Yang membuatnya terasa tidak rapi ada di tiga lapis:

| Lapis | Masalah | Keparahan |
|---|---|---|
| Bahasa | 5 label menu memakai istilah campur/teknis yang tidak dipakai pemula | Tinggi |
| Konsistensi | Label menu berbeda dengan judul halaman yang dituju | Tinggi |
| Struktur | Lab (10 alat) disembunyikan sebagai tab, penomoran `3c`–`3m` bocor ke UI | Tinggi |
| Kepadatan | 22 halaman, 5 menu utama, 12 sub-tab | Sedang |
| Duplikasi | "Katalog" dan "Riset" berbagi satu tugas; "Batch" dan "Antrian" mirip | Sedang |

---

## 2. Temuan bahasa (paling terasa "aneh")

### 2.1 Lima label menu memakai istilah yang tidak dipakai pemula

| Label sekarang | Kenapa aneh | Calon pengganti |
|---|---|---|
| **Siap copas** | "copas" = bahasa gaul internet. Orang yang baru mulai mungkin paham, tapi tidak enak dilihat di produk | **Siap posting** |
| **Batch** | Istilah teknis. Isinya buat banyak konten sekaligus | **Buat sekaligus** |
| **Aset** | Kata keuangan/desain. Isinya sebenarnya link affiliate + template | **Link & template** |
| **Branding Kit** | Setengah Inggris. Isinya 7 hari postingan pembuka | **7 Hari Pertama** |
| **Lab konten** | "Lab" = laboratorium, terdengar eksperimen. Isinya alat bantu tulis | **Alat bantu tulis** |

### 2.2 Label menu tidak cocok dengan judul halaman

Orang klik menu "Riset", lalu mendarat di halaman berjudul "Riset audiens". Klik
"Aset", mendarat di "Link affiliate". Ini membuat user ragu apakah dia di tempat benar.

| Label menu | Judul halaman sebenarnya | Cocok? |
|---|---|---|
| Hari Ini | Hari Ini | ✅ |
| Riset | **Riset audiens** | ❌ |
| Bikin Konten → Buat posting | Buat posting | ✅ |
| Terbit → Siap copas | **Salin utas Threads + caption TikTok + status WhatsApp** | ❌ (judul terlalu panjang, bukan judul) |
| Aset | **Link affiliate** | ❌ |
| Fokus harian | **Fokus hari ini** | ❌ (harian vs hari ini) |

### 2.3 Judul yang terlalu panjang untuk jadi judul

`Salin utas Threads + caption TikTok + status WhatsApp` — 52 karakter. Di HP ini
akan membungkus jadi 3 baris dan mendorong isi halaman ke bawah. Itu **deskripsi**,
bukan judul.

---

## 3. Temuan struktur

### 3.1 Penomoran lama bocor ke layar Lab

Nama alat di halaman Lab masih memakai awalan sisa struktur menu lama:

```
3c. Rapikan curhatan jadi status     3g. Time capsule
3d. Adu dua produk                   3h. Ubah jadi lirik
3e. Versi lebih jujur                3i. Gamifikasi (poin & level)
3f. Versi genre lain                 3j. Dialog dua bot berdebat
                                     3l. Konten dari foto
                                     3m. Tiru pola gaya kompetitor
```

Huruf `3c`–`3m` tidak punya arti bagi user. Nomornya juga **melompat** (tidak ada
3a, 3b, 3k), yang menunjukkan sisa penghapusan menu lama. Ini kesan "tidak dirawat"
paling kuat di seluruh aplikasi.

### 3.2 Lab terlalu besar untuk jadi tab

10 alat, masing-masing dengan input dan hasil sendiri, ada di dalam satu tab
"Lab konten" yang hanya bisa dicapai lewat menu "Bikin Konten". User yang mencari
alat tertentu harus: klik Bikin Konten → klik tab Lab → scroll mencari alatnya.

Padahal Lab dipakai **jarang** (bukan bagian alur harian). Menyembunyikannya dalam
tab membuatnya sulit ditemukan saat dibutuhkan.

### 3.3 Kepadatan navigasi

| Ukuran | Jumlah |
|---|---|
| Halaman | 22 |
| Menu sidebar | 12 |
| Sub-tab | 25 |
| Menu dengan 4 tab | 2 ("Terbit", "Alat & Pengaturan") |

### 3.4 Tumpang tindih yang nyata

| Pasangan | Tumpang tindih |
|---|---|
| **Riset vs Katalog** | Riset mencari produk yang layak; Katalog menyimpan produk. Dua-duanya soal produk, dipisah jadi dua menu |
| **Antrian vs Batch** | Antrian = daftar konten menunggu terbit. Batch = bikin konten banyak sekaligus. Namanya mirip, gunanya beda jauh |
| **Terbit vs Kalender** | Terbit = salin & tandai. Kalender = lihat jadwal. Keduanya soal "kapan posting" |
| **Hari Ini vs Fokus harian** | Dua-duanya bilang "kerjakan ini hari ini" |
| **Branding Kit** | Hanya dipakai 7 hari sekali di awal, tapi duduk setara dengan menu harian |

---

## 4. Usulan — tiga pilihan arah

### Opsi A — Ganti nama saja (paling aman, 40 menit)

Struktur tidak berubah, hanya label dan judul yang dibuat konsisten dan jelas.

| Sekarang | Menjadi |
|---|---|
| Siap copas | Siap posting |
| Batch | Buat sekaligus |
| Aset | Link & template |
| Branding Kit | 7 Hari Pertama |
| Lab konten | Alat bantu tulis |
| Riset audiens (judul) | Riset |
| Salin utas Threads + caption... (judul) | Siap posting |
| Fokus harian / Fokus hari ini | Pilih satu: **Fokus hari ini** |

Nomor `3c`–`3m` di Lab dihapus.

- **Kelebihan:** risiko hampir nol, tidak ada navigasi yang pindah, cepat.
- **Kekurangan:** tab "Terbit" tetap 4, Lab tetap tersembunyi, tumpang tindih tetap.

### Opsi B — Nama + rapikan tab (1,5 jam)

Opsi A, ditambah:

- **Terbit** dipangkas jadi 3 tab: `Siap posting` · `Antrian` · `Riwayat`.
  `Batch` dipindah ke dalam **Bikin Konten** (karena Batch itu cara membuat, bukan cara menerbitkan).
- **Alat & Pengaturan** dipangkas: `Pengaturan` · `Pencarian` · `Biaya AI` · `Link & template`.
- **Alat bantu tulis** naik jadi menu sendiri di grup "Alat", tidak lagi disembunyikan dalam tab.

- **Kelebihan:** struktur jauh lebih logis, Lab mudah ditemukan.
- **Kekurangan:** satu menu pindah grup, perlu 1–2 bookmark lama diperbarui.

### Opsi C — Rombak penuh (2,5 jam)

Opsi B, ditambah penggabungan yang tumpang tindih:

- **Riset + Katalog** jadi satu menu **Produk**, dengan 2 tab: `Cari ide` dan `Katalog saya`.
- **Kalender** masuk ke **Terbit** sebagai tab ke-4 (semua soal kapan terbit).
- **Branding Kit** diturunkan dari grup "Alur kerja" ke "Alat" (karena hanya dipakai 7 hari pertama).
- Menu jadi **4 grup, 9 menu**, setiap menu maksimal 3 tab.

- **Kelebihan:** paling bersih, paling sedikit klik.
- **Kekurangan:** paling banyak berubah, ada rute lama yang harus diarahkan ulang.

---

## 5. Rekomendasi

**Opsi B.** Alasannya:
- Opsi A tidak menyelesaikan keluhan "kurang rapi" karena tab yang menumpuk tetap ada.
- Opsi C memindahkan terlalu banyak hal sekaligus, padahal aplikasi ini baru akan
  dipakai untuk beta. Risiko user bingung karena menu berubah total lebih besar
  daripada manfaatnya sekarang.
- Opsi B mengenai tepat dua keluhan yang paling terasa (bahasa aneh dan Lab
  tersembunyi) tanpa mengacak yang sudah jalan.

Kalau nanti beta sudah jalan dan menu terasa masih padat, Opsi C bisa dikerjakan
sebagai langkah kedua.

---

## 6. Batas laporan ini

- Semua temuan dari membaca kode, bukan dari melihat tampilan di browser.
- "Terasa aneh" adalah penilaian bahasa, bukan pengukuran. Kalau kamu justru suka
  istilah "copas" atau "batch", itu bisa dipertahankan.
- Belum ada berkas yang diubah. Semua perubahan menunggu pilihan arah.
