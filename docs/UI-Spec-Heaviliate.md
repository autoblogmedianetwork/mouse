# UI Spec: Heaviliate Dashboard

**Versi:** 0.2
**Acuan:** `PRD-Heaviliate.md` (F0 sampai F8), ADR 0009 (Swiss Industrial Print), ADR 0013 (token visual)
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

Sembilan item, dua grup (ADR 0013).

| Grup | Menu | Halaman | Fase |
|---|---|---|---|
| Workspace | Dashboard | `/` | MVP |
| | Riset audiens | `/riset` | MVP |
| | Buat posting | `/posting/baru` | MVP |
| | Antrian review | `/antrian` | MVP |
| | Riwayat posting | `/riwayat` | MVP (status dasar), M6 (detail) |
| Tools | Kalender | `/kalender` | Level 2 |
| | Analitik | `/analitik` | Setelah M5 |
| | Aset | `/aset` | MVP |
| | Pengaturan | `/pengaturan` | MVP |

- **Analitik** memuat tab "Impor performa" (`/impor`), karena laporan komisi adalah masukan untuk analisis, bukan halaman terpisah.
- **Aset** memuat tab "Link affiliate" (`/link`) dan "Template deskripsi" (`/template`). Kedua route lama tetap hidup sebagai tab aktif, bukan redirect.
- **Akun sosial** tidak lagi menjadi item sidebar. Halaman `/akun` tetap hidup dan ditautkan dari Pengaturan, bagian Profil dan akun (fase M6).
- **Pustaka konten** kini tampil sebagai Antrian review (3.9). Route `/konten` hanya mengalihkan ke `/antrian` untuk bookmark lama.

Setiap item membawa flag fase di `nav-config.ts`, bukan `available: true` permanen. Label "Segera" hanya tampil kalau route-nya memang belum ada; menandai fitur yang sudah berjalan sebagai "Segera" membuat label itu tidak pernah jujur.

Pencocokan rute aktif memakai awalan dengan batas segmen: `/posting/baru/[id]` menandai "Buat posting", sedangkan `/` hanya cocok persis.

---

## 3. Halaman Utama

### 3.1 Dashboard (`/`)

**Tujuan:** melihat ringkasan dan langsung melanjutkan pekerjaan.

Komponen:
- **Kartu ringkasan:** jumlah draft, jumlah siap posting, jumlah terjadwal, jumlah posting minggu ini.
- **Lanjutkan draft:** daftar 3 draft terakhir dengan judul, produk, dan waktu edit terakhir.
- **Aksi cepat:** tombol "Buat posting baru" dan "Analisis produk baru".
- **Konten terbaru:** tabel ringkas 5 konten terakhir dengan status.
- **Pengingat:** panel di atas kartu ringkasan, memakai aturan di `docs/fitur-pengingat.md`. Item jadwal lewat > hari ini > minggu ini > draft terbengkalai; tiap item punya tutup (kembali besok) dan tombol aksi ke halaman tujuan. Panel hanya tampil saat ada isian.

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
   - Pilihan provider posting: Manual (default), Threads API, Buffer atau Metricool, Postiz atau Mixpost. Pilihan yang belum tersedia tampil dengan label "Segera" atau "Perlu setup".
   - Jadwal: tanggal dan jam, hanya aktif jika provider mendukung jadwal dan status siap posting.
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
- **Provider AI per fungsi:** chat, visi, TTS, dan transkripsi. Setiap pilihan menampilkan status ketersediaan dan kuota (jika ada).
- **Provider posting:** pilihan default untuk konten baru. Setiap konten tetap bisa diubah di halaman Buat posting.
- **Tools media:** toggle per fitur (hapus background, render video, TTS lokal). Setiap fitur menampilkan status "Tersedia", "Tidak tersedia", atau "Nonaktif" dan petunjuk setup.
- **Batas biaya AI per bulan** (K6).
- **Scraping:** toggle default mati, dengan peringatan ToS dan batas harian.
- **Aturan konten:** wajib menyebut kekurangan produk (on/off), anti AI slop, gaya hook default.
- **Data:** periode retensi arsip (F15.4 di PRD).

---

### 3.9 Antrian Review (`/antrian`)

- Header berisi judul, widget biaya AI (hari ini dan bulan ini, dengan progres terhadap batas), dan tombol "Jeda semua" (muncul hanya jika mode semi atau penuh aktif).
- Tab status: Perlu review, Disetujui, Terjadwal, Gagal posting, Sudah posting, dan Ditolak. Setiap tab menampilkan jumlahnya.
- Kartu konten menampilkan thumbnail (foto atau slide pertama), judul, skor ide, produk, tanggal, dan label "Otomatis" bila dibuat oleh mode semi atau penuh.
- Aksi massal: pilih beberapa lalu tandai siap, tolak, atau hapus. Aksi massal tetap memeriksa checklist per konten.
- Tampilan mobile memakai satu kolom dengan tab yang bisa digulir.

## 4. Komponen Inti

| Komponen | Dipakai di | Catatan |
|---|---|---|
| `AppShell` | Semua halaman | Sidebar, topbar dengan breadcrumb, slot konten |
| `MenuTabs` | Analitik, Aset | Tab antar halaman dalam satu item menu; daftar tab dibaca dari `nav-config.ts` |
| `Card` | Semua halaman | Satu wadah blok: garis 2px, padding 4/6; prop `padat` untuk blok berisi tabel penuh. Menggantikan string kartu yang dulu disalin per halaman |
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
| `ProviderSelector` | Pengaturan, Buat posting | Pilihan provider per fungsi dengan status ketersediaan |
| `MediaToolToggle` | Pengaturan, Buat posting | Toggle fitur media dengan status dan petunjuk setup |
| `ReviewTabs` | Antrian review | Tab status dengan jumlah per tab |
| `CostWidget` | Header | Biaya AI hari ini dan bulan ini, dengan progres terhadap batas |
| `ModeKerjaSelector` | Pengaturan | Pilihan manual, semi, atau penuh, dengan penjelasan singkat |
| `CarouselSlideEditor` | Buat posting | Edit teks per slide dengan penghitung kata dan preview |

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

Acuan: ADR 0009 (Swiss Industrial Print) dan ADR 0013 (token). Semua nilai diambil dari token di `app/globals.css`; angka yang ditulis langsung di komponen dianggap utang.

- **Warna:** oranye hangat (`--primary`) hanya untuk aksi utama, netral abu untuk latar dan permukaan. Warna status tetap lima: abu (draft), hijau (siap), biru (terjadwal), hijau tua (terkirim), merah (gagal). Peringatan memakai `--warning` dan `--warning-foreground`. Chrome tidak memakai warna Tailwind langsung; pengecualian hanya preview Threads dan palet kanvas carousel, masing-masing dikomentari di modulnya.
- **Bentuk:** radius 0 untuk seluruh chrome. Tiga pengecualian sah: avatar (lingkaran), track progress bar, dan kanvas gambar yang diekspor carousel.
- **Garis:** 2px `foreground` untuk blok, header, dan tabel; 1px `surface-border` untuk pemisah di dalam blok.
- **Tipografi:** Inter (`--font-sans`) untuk teks, IBM Plex Mono (`--font-mono`) untuk metadata uppercase. Skala token: mikro 10px, meta 11px, badan 13px, isi 16px, judul 22px, hero 34px. Tracking hanya 0.08em (metadata) dan 0.06em (badge).
- **Ruang:** kelipatan 4px. Nilai 6px, 10px, dan 14px hanya untuk kontrol kecil yang sudah ada, tidak dipakai di blok baru.
- **Dekorasi:** tanpa gradien, glow, bayangan lembut, `backdrop-blur`, atau emoji sebagai label. Emoji hanya boleh menjadi isi konten (teks slide, glyph tiruan Threads).
- **Mode gelap:** didukung sejak awal. Preview Threads selalu ditampilkan dengan latar gelap agar sesuai tampilan asli.
- **Fokus:** outline 2px `--ring` dengan offset 2px di semua elemen interaktif.

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
- Kalender, detail Riwayat posting, Analitik. Halaman Analitik berisi ringkasan laporan yang diimpor **plus daftar produk yang lama tidak diposting** dengan filter jarak waktu sejak terkirim terakhir (aturan di `docs/daftar-produk-belum-diposting.md`).

**M6:**
- Akun sosial, mode auto-posting, jadwal aktif, status terkirim dari API.

---

## 11. Pertanyaan Desain Terbuka

1. Apakah preview perlu menampilkan contoh foto dengan rasio asli Threads, atau cukup thumbnail?
2. Apakah tombol "Simpan draft" dan "Tandai siap posting" cukup dua, atau perlu opsi "Simpan sebagai template"?
3. Berapa lama arsip konten disimpan sebelum dihapus (sesuai F15.4 di PRD)?

## Tur awal untuk pemula (Fase 1)

- Komponen `features/onboarding/tur-awal.tsx` menampilkan dialog 3 langkah saat
  pertama membuka dashboard. Flag `autothreads-onboarding-selesai` di
  localStorage; setiap cara keluar (termasuk Esc) menandai selesai.
- Langkah 3 punya tiga pilihan: "Coba dengan produk contoh" (menulis draft
  berisi produk contoh lalu membuka `/posting/baru` dengan langkah Produk
  terisi), "Isi produk saya sendiri", dan "Jelajahi dulu".
- Produk contoh didefinisikan di `features/onboarding/produk-contoh.ts`,
  nama internal diawali "Contoh:" supaya mudah dikenali dan dihapus.
- Pengaturan generate memilah: mode output, panjang thread, jumlah status,
  dan panjang status selalu terlihat; sisanya (gaya pembuka, kerangka,
  gaya bahasa, posisi link, instruksi, filter bahasa AI, wajib sebut
  kekurangan, disclosure) berada di balik tombol "Pengaturan lanjutan".
- Label istilah memakai bahasa awam: "Filter bahasa AI" (dulu Anti AI Slop),
  "Wajib sebut kekurangan" (dulu Aturan kepercayaan), "Posisi link affiliate"
  (dulu Letak link), "Gaya pembuka status" (dulu Gaya hook). Tooltip `?`
  (`components/info-hint.tsx`) menjelaskan istilah di tempat.
