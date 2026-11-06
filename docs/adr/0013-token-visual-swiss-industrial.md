# ADR 0013: Token visual Swiss Industrial Print dan penyelarasan UI-Spec

Status: diterima
Tanggal: 2026-11-05

## Konteks

ADR 0009 menetapkan Swiss Industrial Print sebagai satu bahasa visual dan
menerapkannya lewat token global: `border-radius: 0` dan tanpa bayangan
untuk semua elemen. Audit sesi 1 (5 November 2026) menemukan bahwa
keputusan itu sudah menang secara tampilan, tetapi belum ditegakkan di
sumber:

- `app/globals.css` memaksa radius 0 dan `box-shadow: none`, sementara
  54 salinan string kartu di 15 file masih menulis `rounded-xl`,
  `rounded-lg`, `rounded-2xl`, `rounded-full`, `shadow-xl`, dan
  `backdrop-blur`. Kelas itu tidak berefek apa pun, jadi kode berbohong
  tentang bentuk yang dipakai.
- `font-mono` dipakai 72 kali di 17 file tanpa token font. Hasilnya
  bergantung pada monospace bawaan sistem operasi, padahal metadata
  monospace adalah inti arah visual ini.
- Ukuran teks ditulis bebas (`text-[11px]`, `text-[10px]`) dan tracking
  ditulis manual pada tiga nilai berbeda (0.05em, 0.06em, 0.08em).
- Peringatan memakai warna amber langsung dengan dua resep berbeda, dan
  tidak ada token peringatan.
- Bagian 6 `docs/UI-Spec-Heaviliate.md` masih menulis radius 12px/8px dan
  satu font sans, sehingga bertentangan dengan ADR 0009.
- Emoji dipakai sebagai label tombol (lima tombol di editor carousel) dan
  sebagai penanda peringatan di dua tempat.

## Keputusan

1. **Arah visual tetap Swiss Industrial Print.** ADR 0009 tidak diganti;
   yang kurang adalah token dan penegakan. `docs/UI-Spec-Heaviliate.md`
   bagian 2.1 dan 6 diselaraskan dengan ADR ini, bukan sebaliknya.
2. **Radius 0 adalah default untuk seluruh chrome.** Pengecualian yang
   sah hanya tiga, masing-masing wajib diberi komentar di tempatnya:
   avatar (lingkaran), track progress bar, dan kanvas gambar yang diekspor
   carousel (bagian dari desain slide, bukan UI aplikasi). Aturan global
   `border-radius: 0 !important` dipertahankan sebagai jaring pengaman
   sampai kelas `rounded-*` yang mati dibuang pada pass komponen dasar;
   setelah itu aturan itu dihapus dan radius mengikuti token. **Aturan itu
   sudah dihapus** pada pass 4e — lihat butir 9.
3. **Garis:** 2px `foreground` untuk blok, header, dan tabel; 1px
   `surface-border` untuk pemisah di dalam blok. Tidak ada ketebalan lain
   di chrome.
4. **Tipografi dua suara.** Inter (`--font-sans`) untuk teks; satu
   monospace eksplisit, IBM Plex Mono, dimuat lewat `next/font/google`
   sebagai `--font-mono` (bukan dependency baru). Skala ukuran dibakukan
   menjadi token: `--text-mikro` 10px, `--text-meta` 11px, `--text-badan`
   13px, `--text-isi` 16px, `--text-judul` 22px, `--text-hero` 34px.
   Tracking metadata hanya dua nilai: 0.08em dan 0.06em (badge); judul
   display tetap boleh memakai tracking negatif untuk merapatkan huruf
   kapital.
   Token ini **tidak** menimpa `text-xs`, `text-sm`, atau `text-base`
   bawaan Tailwind supaya layout yang ada tidak bergeser.
5. **Warna hanya lewat token.** Token lama (primary oranye, netral, lima
   warna status) tetap. Ditambah `--warning` dan `--warning-foreground`
   untuk banner peringatan. Warna Tailwind langsung (amber, red-400,
   emerald, sky, zinc, slate) dilarang di chrome. Dua pengecualian yang
   didokumentasikan di modulnya: preview Threads (harus menyerupai
   platform) dan palet kanvas carousel (harus sama dengan gambar ekspor).
6. **Tanpa dekorasi.** Tidak ada gradien, glow, bayangan, `backdrop-blur`,
   atau emoji sebagai label di chrome. Emoji hanya boleh menjadi isi
   konten: teks slide yang diekspor dan glyph tiruan Threads (`♡`, `💬`)
   pada preview.
7. **Satu komponen `Card`** menggantikan string kartu yang disalin 54
   kali, dan satu `FeatureToggle` dipakai bersama saat tools media pindah
   ke Pengaturan. Pola yang hanya punya satu pemakai tidak diekstrak.
8. **`PageHeader` berhenti mencetak `HALAMAN ///` di semua halaman.**
   Diganti breadcrumb nyata (Workspace › halaman), dikerjakan pada pass
   AppShell dan navigasi.
9. **Jaring pengaman `!important` dihapus pada pass 4e.** Setelah kelas
   `rounded-*` dan `shadow-*` yang mati dibuang dari `app/`, `components/`,
   dan `features/`, aturan global itu tidak lagi menjaga apa pun dan malah
   merusak pengecualian yang butir 2 sahkan: karena selector `*` berbobot
   specificity 0, `border-radius: 0 !important` mengalahkan kelas maupun
   `style` inline mana pun, sehingga avatar dan track progress bar yang
   seharusnya bulat ikut menjadi kotak. Chrome tetap 90 derajat karena
   tidak ada lagi elemen chrome yang memakai kelas radius, dan kontrol form
   sudah dijaga preflight Tailwind v4 (`button, input, select, textarea {
   border-radius: 0 }` di origin penulis), jadi tidak perlu aturan global
   sendiri. `box-shadow: none !important` ikut dihapus karena bayangan
   chrome tidak ada lagi di sumber (hanya `shadow-none` sisa di AppShell
   yang eksplisit mematikannya); bayangan UA bawaan native `<dialog>`
   diukur `none` di Chromium, sehingga `ConfirmDialog` tidak berubah.

## Alasan

- Membalik arah ke UI-Spec berarti menyentuh setiap halaman, sementara
  masalah yang sebenarnya adalah token yang belum lengkap dan kelas mati
  yang menyesatkan pembaca kode.
- Mono eksplisit diperlukan karena tanpa itu tampilan metadata berbeda
  antara Windows, macOS, dan Android, padahal itu ciri utama arah visual
  yang dipilih.
- Enam langkah skala cukup untuk dashboard operasional dan menghentikan
  penambahan angka baru per halaman.
- Token peringatan menghapus dua resep amber yang berbeda untuk maksud
  yang sama.
- Alat bantu eksternal (skill unslop atau CLI deslop) ditolak pada sesi
  1: setiap temuan bisa ditelusuri ke baris kode, jadi tidak perlu tool
  baru.

## Konsekuensi

- Pass 1 hanya menyentuh `app/globals.css` dan `app/layout.tsx`. Halaman
  tidak berubah pada pass itu.
- Kelas `rounded-*`, `shadow-*`, dan `backdrop-blur` dibuang bertahap
  pada pass komponen dasar; jaring pengaman `!important` sudah dilepas
  pada pass 4e setelah sapuan lintas repo bersih.
- Cakupan pass komponen 4e: `app/(dashboard)/link/tabel-link.tsx`,
  `app/(dashboard)/pengaturan/form-pengaturan.tsx`,
  `app/(dashboard)/template/editor-template.tsx`,
  `features/impor/panel-impor.tsx`, `features/riset/panel-riset.tsx`,
  `features/akun/daftar-akun.tsx`, `features/akun/modal-tambah-akun.tsx`.
  `app/masuk/*` tidak berubah karena sudah bersih dari pass sebelumnya.
- Setelah guard dilepas, kelas `rounded-*` yang tersisa hidup kembali dan
  hanya boleh ada pada tiga pengecualian butir 2. Sisa yang terverifikasi:
  `rounded-full` di track progress (`components/cost-widget.tsx`,
  `features/impor/performa-ringkas.tsx`,
  `features/performa/performa-konten.tsx`) dan `rounded-xl`/`rounded-full`
  di `features/posting/threads-preview.tsx` (glyph platform). Menambah
  `rounded-*` baru di chrome sekarang akan terlihat, bukan lagi diam-diam
  dimatikan — itu memang tujuannya.
- Warna peringatan yang sudah ada harus dipetakan ke `--warning` saat
  pass komponen, bukan dibiarkan sebagai amber langsung.
- Bagian 4 UI-Spec (komponen inti) belum menyebut `Card` dan
  `FeatureToggle`; penambahannya menyusul pada pass 2 agar dokumen tidak
  mendahului kode yang belum ada.
- Test tidak terpengaruh karena tidak ada logika yang berubah. Yang perlu
  dipantau: kontras teks pada skala baru dan konsistensi token di halaman
  baru.
