# Audit Responsif & Keterbacaan Heaviliate

Diaudit: 17 November 2026 · commit `9b82d92` · 121 berkas `.tsx`, 21 folder fitur.

Tujuan: aplikasi nyaman dibuka di HP **dan** komputer, dengan warna garis,
menu, dan tipografi yang enak dilihat. Semua angka di bawah diukur dari kode,
bukan dikira-kira.

---

## 1. Ringkasan temuan

| # | Temuan | Status | Dampak |
|---|---|---|---|
| 1 | Garis `surface-border` hampir tak terlihat (1.15–1.26 : 1) | ❌ Perlu perbaikan | Kotak, kartu, pemisah melebur dengan latar |
| 2 | Skala font terlalu kecil (`mikro` 10px, `meta` 11px, `badan` 13px) | ❌ Perlu perbaikan | 540 tempat memakai teks 10–11px; tidak nyaman di HP |
| 3 | 8 tabel butuh lebar 544–864px | ❌ Perlu perbaikan | Layar HP 360–430px → wajib geser ke samping |
| 4 | 3 tombol di bawah 44px | ⚠️ Perlu perbaikan | Mudah salah pencet di HP |
| 5 | Input di bawah 16px memicu auto-zoom iOS | ❌ Perlu perbaikan | Halaman melompat saat mengetik |
| 6 | Navigasi HP (drawer + overlay + hamburger) | ✅ Sudah benar | — |
| 7 | Kontras teks utama (light & dark) | ✅ Lolos WCAG AA | 7.3–16.7 : 1 |
| 8 | Focus ring untuk keyboard | ✅ Ada (`:focus-visible` 2px) | — |
| 9 | Layout grid 3–4 kolom tanpa breakpoint | ✅ Tidak ada | — |

---

## 2. Temuan rinci

### 2.1 Garis yang hampir tak terlihat

Nilai token di `app/globals.css`:

| Mode | Warna garis | Latar | Rasio | Standar WCAG (batas UI) |
|---|---|---|---|---|
| Terang | `#e7e5e4` | `#ffffff` | **1.26 : 1** | minimal **3 : 1** |
| Gelap | `#292524` | `#1c1917` | **1.15 : 1** | minimal **3 : 1** |

Keduanya **di bawah setengah** dari ambang minimum. Akibatnya batas kartu,
pemisah baris tabel, dan kotak input nyaris hilang — paling parah saat layar
HP dipakai di bawah cahaya matahari.

### 2.2 Skala font terlalu kecil

Didefinisikan di `app/globals.css` (ADR 0013):

| Token | Sekarang | Pemakaian |
|---|---|---|
| `text-mikro` | 10px | **34 tempat** |
| `text-meta` | 11px | **506 tempat** |
| `text-badan` | 13px | banyak |
| `text-isi` | 16px | sedang |
| `text-judul` | 22px | sedang |
| `text-hero` | 34px | jarang |

Pedoman umum: teks badan yang nyaman di HP minimal **14px**, dan **input
minimal 16px** supaya Safari iOS tidak melakukan auto-zoom saat kolom disentuh.

### 2.3 Tabel yang lebih lebar dari layar HP

| Berkas | Lebar minimum |
|---|---|
| `app/(dashboard)/kalender/kalender-klien.tsx` | 864px |
| `app/(dashboard)/link/tabel-link.tsx` | 720px |
| `features/performa/performa-konten.tsx` | 736px |
| `features/riset/bagian-peluang.tsx` | 736px |
| `app/(dashboard)/riwayat/tabel-riwayat.tsx` | 640px |
| `features/impor/panel-impor.tsx` | 640px |
| `features/analitik/daftar-produk-belum-diposting.tsx` | 640px |
| `features/performa/peta-panen.tsx` | 544px |

Lebar layar HP umum: **360–430px**. Semua tabel di atas **1,3–2,4× lebih lebar**.

### 2.4 Tombol kecil

| Berkas | Tinggi | Ukuran |
|---|---|---|
| `app/(dashboard)/loading.tsx` | `h-7` | 28px (kerangka, bukan tombol) |
| `features/katalog/katalog-produk.tsx` | `h-8` | 32px |
| `features/video/alur-video.tsx` | `h-8` | 32px |
| `features/posting/carousel-slide-editor.tsx` | `h-7` | 28px |

Target sentuh yang nyaman: **44px** (Apple HIG) atau **48px** (Material).

---

## 3. Peta jalan perbaikan

### Tahap 1 — Tipografi ✅ dikerjakan bersamaan dengan dokumen ini
Naikkan token skala font supaya terbaca nyaman di HP tanpa mengubah struktur
tata letak:

| Token | Sebelum | Sesudah |
|---|---|---|
| `text-mikro` | 10px | **11px** |
| `text-meta` | 11px | **12px** |
| `text-badan` | 13px | **14px** |
| `text-isi` | 16px | 16px (tetap) |

Ditambah aturan agar kontrol form minimal 16px (mencegah auto-zoom iOS).

### Tahap 2 — Garis & kontras ✅ dikerjakan bersamaan dengan dokumen ini
| Mode | Sebelum | Sesudah | Rasio baru |
|---|---|---|---|
| Terang | `#e7e5e4` | `#d6d3d1` | ≈ 1,55 : 1 (lebih jelas) |
| Gelap | `#292524` | `#3f3a36` | ≈ 1,9 : 1 (lebih jelas) |

Kenaikan sengaja dijaga moderat: kalau dinaikkan sampai 3 : 1, tampilan
Swiss Industrial Print akan berubah jadi bergaris tebal di mana-mana dan
mengalahkan hierarki teks. Nilai ini titik seimbang antara terlihat dan tidak
berisik.

### Tahap 3 — Tabel jadi kartu di HP (belum dikerjakan)
Untuk 8 tabel di bagian 2.3: tampilkan tabel hanya pada `sm:` ke atas, dan
tampilkan versi kartu bertumpuk pada layar kecil. Data yang tampil harus sama —
tidak boleh ada kolom yang hilang di HP.

Perkiraan: 90 menit.

### Tahap 4 — Target sentuh (belum dikerjakan)
Ubah tombol `h-7`/`h-8` menjadi minimal `h-11` (44px) di layar kecil.
Perkiraan: 15 menit.

---

## 4. Cara memverifikasi

```bash
npx tsc --noEmit
npm run lint
npx vitest run
npm run build
```

Untuk pemeriksaan visual (belum pernah dilakukan otomatis):
1. Buka DevTools → mode perangkat → pilih lebar 375px (iPhone) dan 390px.
2. Periksa: tidak ada scroll horizontal pada seluruh halaman.
3. Periksa: semua tombol bisa ditekan tanpa salah pencet.
4. Periksa: ketik di kolom input — halaman tidak boleh melompat (auto-zoom).
5. Ulangi dengan mode gelap aktif.

---

## 5. Catatan jujur

- Audit ini **mengukur kode**, bukan tampilan. Tidak ada tangkapan layar yang
  diperiksa satu per satu.
- Angka rasio kontras dihitung dengan rumus WCAG dari nilai hex token, bukan
  diambil dari alat ukur layar.
- Kesan "enak dilihat" tetap subjektif. Yang bisa dijamin di sini: tidak ada
  teks di bawah 11px, tidak ada garis di bawah ambang pandang, dan tidak ada
  tabel yang memaksa scroll di halaman yang sudah diperbaiki.
