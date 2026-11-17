# Laporan Dogfood — Heaviliate

- **Tanggal:** 17 November 2026 (sesi malam)
- **Target:** `https://mouse-vert.vercel.app` (produksi, commit 1fc9395)
- **Sesi:** `hv` · login via admin action link · state tersimpan `auth-state.json`
- **Metode:** agent-browser dogfood — eksplorasi seperti pengguna, bukan audit kode
- **Cakupan:** login, onboarding, 16 menu desktop, alur AI penuh, Tempel Cepat, 19 halaman mobile 360px

---

## Ringkasan

| Keparahan | Jumlah |
|---|---|
| Kritis | 1 |
| Sedang | 2 |
| Ringan | 3 |

| ID | Keparahan | Ringkasan |
|---|---|---|
| [ISSUE-001](#issue-001) | Kritis | Tombol login tanpa umpan balik; klik ulang dibalas 429 |
| [ISSUE-002](#issue-002) | Sedang | Menu "Dashboard" mendarat di judul "HARI INI" + nama lama di deskripsi |
| [ISSUE-003](#issue-003) | Sedang | Nama aplikasi dobel di pembaca layar ("Heaviliate · Heaviliate") |
| [ISSUE-004](#issue-004) | Ringan | "Confidence: sedang" — istilah Inggris menyisip |
| [ISSUE-005](#issue-005) | Ringan | Hari 1 Branding: Salin aktif padahal [detail_hidup] belum diisi |
| [ISSUE-006](#issue-006) | Ringan | Tanpa indikator posisi di grup penerbitan (keputusan desain) |

---

## ISSUE-001 — Tombol login tanpa umpan balik; klik ulang dibalas 429

**Keparahan:** Kritis · **Jenis:** UX feedback / error handling · **Video:** N/A (ffmpeg tidak ada; bukti screenshot + log jaringan)

### Reproduksi

1. Buka `/masuk`, isi email, klik **KIRIM TAUTAN LOGIN >>>**.
   ![Sebelum klik](screenshots/issue-001-step-1.png)
2. Form tidak berubah apa pun — tidak ada "tautan terkirim", tidak ada spinner.
   ![Setelah klik — diam saja](screenshots/issue-001-result.png)
3. Klik lagi → alert bahasa Inggris: `! GALAT: FOR SECURITY PURPOSES, YOU CAN ONLY REQUEST THIS AFTER 13 SECONDS.`
4. Log jaringan:

```
POST .../auth/v1/otp  200   ← klik 1 (email TERKIRIM, UI diam)
POST .../auth/v1/otp  429   ← klik 2 (rate limit)
POST .../auth/v1/otp  200   ← klik 3
POST .../auth/v1/otp  429   ← klik 4
POST .../auth/v1/otp  429   ← klik 5+ ("EMAIL RATE LIMIT EXCEEDED")
```

### Dampak
Pengguna baru pasti klik ulang → 429 → bingung. Pesan galat bahasa Inggris di aplikasi berbahasa Indonesia.

### Saran
1. Setelah OTP sukses: tombol nonaktif 60 detik berlabel "Tautan terkirim — cek email".
2. Tangani 429 dengan pesan Indonesia: "Terlalu sering. Tunggu ±1 menit."
3. Jangan bocorkan teks mentah Supabase.

- [x] Diperbaiki (commit 54627d0, terverifikasi di produksi)

---

## ISSUE-002 — Menu "Dashboard" mendarat di judul "HARI INI"

**Keparahan:** Sedang · **Jenis:** Konsistensi label · **Video:** N/A

### Reproduksi
1. Klik menu **Dashboard**. ![Dashboard](screenshots/dashboard.png)
2. Judul tampil **"HARI INI"**; deskripsi: "Riset → **Bikin Konten** → Terbit" — nama menu lama yang sudah tidak ada.

### Saran
Judul `PageHeader` di `app/(dashboard)/page.tsx` → "Dashboard"; deskripsi pakai nama baru. Tambah test anti-nama-lama.

- [x] Diperbaiki (commit 54627d0, terverifikasi di produksi)

---

## ISSUE-003 — Nama aplikasi dobel di pembaca layar

**Keparahan:** Sedang · **Jenis:** Aksesibilitas · **Video:** N/A

### Bukti
Snapshot accessibility di `/katalog`, `/batch`, `/analitik`: elemen `alert` berisi "Katalog Produk — Heaviliate · Heaviliate".

### Saran
Cek template `metadata.title` — kemungkinan `%s — Heaviliate` ditumpuk dengan judul yang sudah memuat akhiran.

- [x] Diperbaiki (commit 54627d0, terverifikasi di produksi)

---

## ISSUE-004 — "Confidence: sedang" (istilah Inggris)

**Keparahan:** Ringan · **Jenis:** Bahasa · **Video:** N/A

### Bukti
Tahap 2 Buat Posting: "Confidence: sedang" ([screenshot](screenshots/buat-posting.png)). Seksi tahap 1: "[ 1. SUMBER PENAWARAN ]".

### Saran
"Confidence: sedang" → "Perkiraan AI: sedang".

- [x] Diperbaiki (commit 54627d0, terverifikasi di produksi)

---

## ISSUE-005 — Salin aktif padahal [detail_hidup] belum diisi (Hari 1)

**Keparahan:** Ringan · **Jenis:** Logika gerbang · **Video:** N/A

### Bukti
Hari 1: teks memuat `...kesehariannya sibuk kerja dan urus [detail_hidup].` dan tombol **Salin AKTIF** (`button "Salin"` tanpa disabled). Hari 2/3 terkunci benar. ![Hari 1](screenshots/branding.png)

### Dampak
Pemula bisa memposting manifesto dengan kurung siku mentah ke Threads publik.

### Saran
Gerbang Salin menolak placeholder TERSISA APA PUN (semua hari), dengan pesan beda: "Isi bagian [...] dengan datamu dulu." + peringatan kuning di atas textarea.

- [x] Diperbaiki (commit 54627d0, terverifikasi di produksi)

---

## ISSUE-006 — Tanpa indikator posisi di grup penerbitan

**Keparahan:** Ringan · **Video:** N/A

### Bukti
`/antrian` tanpa tab strip (`main nav` = 0). Jalan pulang tetap ada lewat sidebar (3 link terverifikasi) — bug asli TIDAK terulang. Ini konsekuensi menu datar yang dipilih.

### Status
- [x] Tidak perlu tindakan (keputusan desain). Opsional: breadcrumb mini di 4 halaman terbit.

---

## Verifikasi regresi perbaikan sebelumnya

| Perbaikan | Status di produksi |
|---|---|
| Bug Antrian "tidak bisa kembali" (2c234f4) | ✅ TIDAK terulang |
| Tombol Branding nabrak di HP (1fc9395) | ✅ Ditumpuk vertikal, 292×44px, 0 overflow ([bukti](screenshots/m-branding.png)) |
| Gerbang Salin hari pengalaman | ✅ Hari 2/3 terkunci dengan pesan benar |
| Kartu alur kerja Dashboard (1fc9395) | ✅ 4 langkah + "← LANJUTKAN DI SINI" |
| Sidebar tanpa nomor (aee9394) | ✅ 16 menu datar |
| Overflow horizontal 19 halaman @360px | ✅ 0 halaman |
| Alur AI "Buat Semuanya" | ✅ Selesai, 2 status baru, 0 console error |
| Tempel Cepat ekstraksi | ✅ Nama+harga+link terekstrak |

## Yang diuji
Login (magic link + admin action link) · onboarding 4 langkah · 16 menu desktop · alur AI penuh · Tempel Cepat · 19 halaman mobile 360px · Branding Kit 7 hari.
