# UI Spec: AutoThreads Dashboard

**Versi:** 0.1
**Acuan:** `PRD-AutoThreads.md` (F0 sampai F8)
**Referensi visual:** screenshot dashboard "Affiliate Post Manager" dari thread. Yang diambil adalah struktur layout dan alur, bukan branding, ikon, atau teks. Semua elemen visual dibuat ulang sendiri.

---

## 1. Prinsip Desain

1. **Draft-first terlihat.** Setiap konten punya label status yang jelas. Tombol "Posting" tidak pernah muncul sebelum status "siap posting".
2. **Alur berbentuk tahap.** Pembuatan posting berjalan dari atas ke bawah: media, produk, deskripsi, lalu preview. User tidak perlu menebak urutan.
3. **Preview selalu terlihat.** Saat mengedit, preview Threads tampil di sisi kanan dan ikut berubah real time.
4. **Input manual selalu ada.** Setiap field produk punya opsi isi manual. Scraping tidak pernah menjadi satu-satunya jalur.
5. **Tidak menutup pilihan.** Simpan draft, jadwalkan, dan salin selalu tersedia kecuali kondisi tertentu memblokirnya.

---

## 2. Layout Global

```
┌──────────────┬──────────────────────────────────────────────┐
│  Sidebar     │  Topbar: breadcrumb · pencarian · akun       │
│  (kiri)      ├──────────────────────────────────────────────┤
│              │                                              │
│  Logo        │  Konten halaman                              │
│  Workspace   │                                              │
│  Menu utama  │                                              │
│  Menu tools  │                                              │
│  Pengaturan  │                                              │
│  Profil      │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

- **Sidebar:** lebar 240px desktop. Di mobile berubah jadi drawer.
- **Topbar:** breadcrumb (Workspace › Buat posting), pencarian global, dan indikator status sinkronisasi.
- **Workspace:** pilihan ruang kerja, default "Ruang kerja pribadi". Dipertahankan untuk kemungkinan pengembangan ke tim.

### 2.1 Struktur Sidebar

| Grup | Menu | Halaman | Fase |
|---|---|---|---|
| Workspace | Dashboard | `/` | MVP |
| | Buat posting | `/posting/baru` | MVP |
| | Pustaka konten | `/konten` | MVP |
| | Akun sosial | `/akun` | M6 |
| | Kalender | `/kalender` | Level 2 |
| | Riwayat posting | `/riwayat` | MVP (status dasar), M6 (detail) |
| Tools | Analitik | `/analitik` | Setelah M5 |
| | Link affiliate | `/link` | MVP |
| | Template deskripsi | `/template` | MVP |
| | Pengaturan | `/pengaturan` | MVP |

Menu yang belum tersedia tetap tampil dengan label "Segera" dan tidak bisa diklik. Ini menjaga konsistensi navigasi saat fitur bertambah.

---

## 3. Halaman Utama

### 3.1 Dashboard (`/`)

**Tujuan:** melihat ringkasan dan langsung melanjutkan pekerjaan.

Komponen:
- **Kartu ringkasan:** jumlah draft, jumlah siap posting, jumlah terjadwal, jumlah posting minggu ini.
- **Lanjutkan draft:** daftar 3 draft terakhir dengan judul, produk, dan waktu edit terakhir.
- **Aksi cepat:** tombol "Buat posting baru" dan "Analisis produk baru".
- **Konten terbaru:** tabel ringkas 5 konten terakhir dengan status.

State kosong: ilustrasi sederhana dan tombol "Mulai dari produk pertama".

### 3.2 Buat Posting (`/posting/baru`)

Halaman inti. Dibagi menjadi tiga kolom di desktop:

**Kolom kiri (form, 60%)** berisi empat blok bernomor:

1. **Media & link**
   - Unggah foto (carousel, JPG/PNG/WebP, maks 8 MB per file).
   - Unggah video (MP4, maks 100 MB, maks 30 detik untuk Threads).
   - Urutan foto bisa diseret. Foto pertama jadi sampul.
   - Foto diberi label "Referensi internal" jika berasal dari listing seller (sesuai F0).

2. **Produk & link affiliate**
   - Daftar produk. Setiap produk punya: nama internal, link affiliate, dan opsi "Isi manual" atau "Ambil dari link" (scraping, jika diaktifkan).
   - Tombol "Tambah produk dan link" untuk posting multi-produk.
   - Validasi: link harus diawali `https://`, format `s.shopee.co.id` atau `shopee.co.id` dianjurkan.
   - Tombol "Tandai link" untuk memeriksa bahwa link tidak rusak.

3. **Deskripsi**
   - Editor teks dengan penghitung karakter per status (maks 500).
   - Pemisah status otomatis saat teks melebihi 500 karakter.
   - Pilihan template deskripsi dari halaman Template.
   - Kolom tag dan kategori.
   - Pilihan letak link: status terakhir, balasan terpisah, atau tanpa link (F3a).

4. **Mode posting dan jadwal**
   - Pilihan mode: Manual (default) atau Auto (tersedia setelah M6, F8).
   - Jadwal: tanggal dan jam, hanya aktif jika status siap posting.

**Kolom kanan (preview, 40%)**
- Tab platform: Threads (aktif di MVP), Facebook dan X ditampilkan sebagai "Segera".
- Preview mengikuti tampilan Threads: avatar, nama akun, status-status berurutan, dan penghitung karakter.
- Preview memakai data draft terbaru, termasuk perubahan yang belum disimpan.
- Di bawah preview: label status (Draft / Siap posting / Terjadwal / Terkirim / Gagal).

**Bilah aksi (bawah, sticky)**
- "Simpan draft" (selalu aktif, utama di kiri).
- "Tandai siap posting" (aktif hanya jika validasi lolos).
- "Salin utas lengkap" (mode manual).
- "Jadwalkan" (mode auto, setelah M6).
- Tombol "Posting sekarang" tidak ditampilkan di MVP.

**Checkpoint:** sebelum "Tandai siap posting" aktif, sistem menampilkan checklist:
- [ ] Produk di media sesuai listing.
- [ ] Tidak ada klaim yang tidak bisa dibuktikan.
- [ ] Ada satu status yang menyebut kekurangan produk (jika aturan kepercayaan aktif).
- [ ] Link sudah diuji.
- [ ] Disclosure affiliate sudah ada.

### 3.3 Pustaka Konten (`/konten`)

- Tampilan grid atau daftar, dengan filter status, produk, tanggal, dan tag.
- Setiap kartu: thumbnail, judul internal, status, tanggal diubah, dan letak link.
- Aksi per kartu: buka, duplikat, arsipkan, hapus (dengan konfirmasi).
- Pencarian teks di judul dan isi status.

### 3.4 Kalender (`/kalender`), Level 2

- Tampilan bulan dan minggu.
- Konten terjadwal tampil sebagai blok. Klik untuk membuka.
- Drag untuk memindah jadwal, dengan konfirmasi.
- Konten yang belum disetujui tidak bisa dijadwalkan.

### 3.5 Riwayat Posting (`/riwayat`)

- Tabel: waktu, konten, mode (manual atau auto), status akhir, catatan.
- Status gagal menampilkan alasan singkat dan tombol coba lagi.
- Filter berdasarkan rentang tanggal dan status.

### 3.6 Link Affiliate (`/link`)

- Daftar link dengan nama produk, tanggal dibuat, dan jumlah konten yang memakainya.
- Catatan klik dan komisi manual (F5).
- Kolom "Klik" dan "Komisi" bisa diedit langsung.
- Ringkasan: konten dengan klik tertinggi.

### 3.7 Template Deskripsi (`/template`)

- Daftar template dengan nama, kategori, dan jumlah pemakaian.
- Editor template dengan placeholder `{{NAMA_PRODUK}}`, `{{MANFAAT}}`, `{{KEKURANGAN}}`.
- Preview template dengan data contoh.

### 3.8 Pengaturan (`/pengaturan`)

Bagian:
- **Profil dan akun.**
- **AI:** model (Gemini 2.5 Flash-Lite), batas biaya bulanan, dan opsi "Mulai di percakapan baru".
- **Scraping:** toggle default mati, dengan peringatan ToS dan batas harian.
- **Aturan konten:** wajib menyebut kekurangan produk (on/off), anti AI slop, gaya hook default.
- **Data:** periode retensi arsip (F15.4 di PRD).

---

## 4. Komponen Inti

| Komponen | Dipakai di | Catatan |
|---|---|---|
| `AppShell` | Semua halaman | Sidebar, topbar, slot konten |
| `StatCard` | Dashboard | Angka dengan label dan tren opsional |
| `StatusBadge` | Semua daftar | Draft, Siap posting, Terjadwal, Terkirim, Gagal |
| `MediaUploader` | Buat posting | Drag and drop, validasi tipe dan ukuran, preview |
| `ProductLinkRow` | Buat posting | Nama, link, mode manual atau ambil dari link |
| `StatusEditor` | Buat posting | Daftar status dengan penghitung karakter |
| `ThreadsPreview` | Buat posting | Read-only, real time dari state form |
| `ChecklistGate` | Buat posting | Checklist sebelum "Tandai siap posting" |
| `ActionBar` | Buat posting | Sticky di bawah, tombol sesuai mode |
| `DataTable` | Pustaka, Riwayat, Link | Sortir, filter, pilih banyak |
| `EmptyState` | Semua daftar | Ilustrasi, penjelasan, satu tombol aksi |
| `ConfirmDialog` | Hapus, jadwal ulang | Selalu ada untuk aksi yang tidak bisa dibatalkan |
| `Toast` | Global | Notifikasi simpan, salin, dan error |

---

## 5. Status dan Perilaku

### 5.1 Status Konten

| Status | Arti | Tombol yang tampil |
|---|---|---|
| Draft | Sedang diedit | Simpan draft, Tandai siap posting |
| Siap posting | Sudah lolos checklist | Salin utas, Jadwalkan (M6) |
| Terjadwal | Menunggu waktu posting | Batalkan jadwal |
| Terkirim | Sudah diposting | Lihat, Duplikat |
| Gagal | Posting gagal | Coba lagi, Salin utas |

Konten yang sudah terkirim tidak bisa diedit langsung. Pilih "Duplikat" untuk membuat draft baru.

### 5.2 Loading dan Error

- **Analisis produk:** skeleton pada ringkasan, tombol "Batalkan" selama proses.
- **Generate:** progres per konten. Satu konten gagal tidak menghentikan yang lain (sesuai 15.1 di PRD).
- **Error AI:** pesan singkat dengan tombol "Coba lagi". Hasil sebelumnya tetap tersimpan.
- **Jaringan putus:** banner di atas, perubahan disimpan lokal sementara, lalu disinkronkan saat koneksi kembali.

### 5.3 Autosave

- Form posting disimpan otomatis setiap 10 detik jika ada perubahan.
- Indikator "Tersimpan pukul HH:MM" di topbar.
- Tidak ada autosave untuk status "Siap posting". Perubahan pada konten siap posting kembali ke status Draft.

---

## 6. Desain Visual

- **Warna utama:** oranye hangat untuk aksi utama. Netral abu-abu untuk latar. Warna status: abu (draft), hijau (siap), biru (terjadwal), hijau tua (terkirim), merah (gagal).
- **Mode gelap:** didukung sejak awal. Preview Threads selalu ditampilkan dengan latar gelap agar sesuai tampilan asli.
- **Tipografi:** satu font sans-serif (misalnya Inter atau Plus Jakarta Sans). Ukuran dasar 14px, judul halaman 24px.
- **Ruang:** kelipatan 4px. Radius 12px untuk kartu, 8px untuk input.
- **Fokus:** cincin fokus jelas di semua elemen interaktif.

---

## 7. Responsif

| Lebar | Perilaku |
|---|---|
| Desktop (≥1280px) | Sidebar tetap, form dan preview berdampingan |
| Tablet (768 to 1279px) | Sidebar bisa dilipat, preview pindah ke tab |
| Mobile (<768px) | Sidebar jadi drawer, form satu kolom, preview lewat tombol "Lihat preview" |

---

## 8. Aksesibilitas

- Kontras teks minimal WCAG AA.
- Semua tombol bisa diakses dengan keyboard. Urutan fokus mengikuti urutan visual.
- Ikon selalu disertai label atau `aria-label`.
- Status konten tidak hanya diwakili warna. Selalu ada teks.
- Pesan error dikaitkan dengan field lewat `aria-describedby`.

---

## 9. Teknis Frontend

- **Framework:** Next.js (App Router) dengan TypeScript.
- **Styling:** Tailwind CSS dengan token warna dan spacing di satu file konfigurasi.
- **Komponen dasar:** shadcn/ui untuk tombol, dialog, dropdown, dan tabel.
- **State form:** React Hook Form dengan skema validasi Zod. Skema yang sama dipakai di backend.
- **Preview real time:** dipetakan langsung dari state form, tanpa request ke server.
- **Data:** Supabase client untuk query dan realtime. Server action untuk generate AI dan posting.
- **Struktur folder:** `app/` untuk route, `components/` untuk komponen, `features/posting/` untuk logika buat posting, `lib/ai/` untuk layer provider.

---

## 10. Cakupan MVP dan Setelahnya

**MVP (M1 sampai M3):**
- AppShell, Dashboard, Buat posting (manual input, generate, preview, simpan draft), Pustaka konten, Link affiliate, Template, Pengaturan.

**Setelah M3:**
- Kalender, detail Riwayat posting, Analitik.

**M6:**
- Akun sosial, mode auto-posting, jadwal aktif, status terkirim dari API.

---

## 11. Pertanyaan Desain Terbuka

1. Apakah preview perlu menampilkan contoh foto dengan rasio asli Threads, atau cukup thumbnail?
2. Apakah tombol "Simpan draft" dan "Tandai siap posting" cukup dua, atau perlu opsi "Simpan sebagai template"?
3. Berapa lama arsip konten disimpan sebelum dihapus (sesuai F15.4 di PRD)?
