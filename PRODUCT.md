# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Tertutup (perlu konfirmasi).** Bukti repo menyebut "dashboard pribadi"
(README) dan kode menyiapkan multi-pengguna (auth Supabase, RLS per pemilik di
setiap tabel). Kesimpulan kerja: **satu pengguna — pemilik akun sendiri**,
seorang afiliator pemula di Indonesia yang mengelola konten Threads untuk
produk Shopee Affiliate, bekerja dari browser di laptop atau HP, tanpa tim dan
tanpa editor.

Konsekuensi yang dipakai sampai ada koreksi: tidak ada onboarding untuk orang
asing, tidak ada billing, tidak ada dukungan multi-akun. Auth ada untuk
melindungi data, bukan untuk melayani banyak pelanggan.

## Product Purpose

Mengubah satu produk menjadi konten Threads siap tempel, lalu mengukur konten
mana yang benar-benar menghasilkan komisi. Tujuannya bukan menambah konten
sebanyak mungkin, melainkan **komisi pertama** — dan sesudah itu tahu konten
jenis apa yang layak diulang.

Keberhasilan berarti: pengguna membuka aplikasi, mendapat satu langkah jelas
hari ini, menempel satu utas ke Threads, dan pada akhirnya melihat komisi cair
yang bisa dilacak kembali ke konten tertentu.

## Positioning

Tiga pagar yang tidak diambil aplikasi affiliate lain, dan mahal untuk ditiru
tanpa membongkar arsitektur:

1. **Tempel manual, tanpa scraping.** Aplikasi tidak pernah menyentuh akun
   Threads untuk membaca atau menyukai; tidak ada otomasi engagement.
2. **AI hanya menghasilkan draft.** Tidak ada status "siap posting" yang
   tercapai tanpa checklist dan tindakan eksplisit pengguna.
3. **Data tinggal di perangkat sampai pengguna memilih menyimpan.** Inti
   bekerja di localStorage; server dipakai untuk auth, sinkron, dan kirim.

Pagar ini bukan batesan teknis yang menunggu dilepas — ketiganya adalah alasan
pengguna mempercayai alat ini dengan akun dan komisinya.

## Operating Context

- Alur nyata: Riset → Katalog → Buat Posting (4 tahap) → Antrian → Siap Salin →
  tempel di Threads → Arsip Terbit → impor laporan → Analitik.
- Pelacakan memakai `sub_id` Shopee Affiliate. Kode dibuat aplikasi, ditempel
  pengguna di pembuat link Shopee, lalu dicocokkan saat laporan CSV diimpor.
- Persona menulis bernama **Pak Slem**: bapak-bapak Indonesia, santai, mengaku
  kekurangan dulu, tidak menggurui.
- Pekerjaan berjalan di sela pekerjaan lain, sering di HP, kadang tanpa sinyal —
  karena itu ada mode offline (service worker + `offline.html`).
- Biaya AI dibatasi per bulan (`AI_MONTHLY_BUDGET_USD`); saat batas tercapai
  panggilan berhenti dan data tetap bisa diedit.

## Capabilities and Constraints

**Ada:** riset audiens & bank masalah; katalog produk; pembuatan status, utas
panjang, carousel; naskah video + storyboard; bank balasan pribadi + varian AI;
simulasi pembeli; uji psikologi konten (skor prinsip persuasi); periksa
kepatuhan (aturan T&C Shopee); Lab Iklan (kalkulator break-even, generator iklan
Meta, wizard landing page); analitik performa; atribusi per sudut/hook/posisi
link; rangking sudut konten; PWA offline; titip kirim terjadwal ke Threads.

**Batasan yang mengikat:**

- Tanpa dependency baru tanpa alasan kuat; tanpa API Meta Marketing; tanpa pixel
  pihak ketiga.
- Aturan kepatuhan Shopee Affiliate berlaku pada keluaran: kreatif tidak
  menyebut merek marketplace, tanpa clickbait, tanpa pemendek tautan
  (pasal 2.6 & 6.3o), wajib tanda `#publi`.
- Prompt berversi: versi lama tidak ditimpa (AGENTS rule 13).
- Bahasa keluaran: Indonesia kasual, tanpa pola tulisan khas AI.
- Akun Vercel memakai paket Hobby → cron maksimum sekali sehari; pengiriman
  terjadwal dipicu saat aplikasi dibuka atau lewat tombol manual.

**Belum diputuskan:** apakah produk akan dibuka untuk afiliator lain; apakah
kepatuhan diperiksa juga untuk platform selain Threads.

## Brand Commitments

- Nama: **Heaviliate**.
- Suara: Indonesia kasual khas media sosial, jujur soal kekurangan produk.
- Persona konten: **Pak Slem** (wajib dijaga konsisten lintas prompt).
- Identitas visual yang sudah berlaku di kode: sudut siku, border tegas, label
  monospace huruf kapital, tanpa bayangan lembut (ADR 0013). Ini keputusan yang
  sudah diambil, bukan usulan baru.
- Larangan bahasa yang mengikat: tidak ada pembuka generik AI, tidak ada kontras
  "bukan sekadar X melainkan Y", tidak ada klaim absolut atau atribusi tanpa
  sumber.

## Evidence on Hand

- `docs/adr/` — 32 keputusan teknis, termasuk verifikasi T&C Shopee (ADR 0032).
- `docs/` — PRD, UI-Spec, Workflow, skema database, audit responsif, bahasa.
- `golden/produk-01..10.json` — **placeholder**, belum berisi produk nyata.
- Rekaman sesi di `docs/lanjutan-sesi-*.md`.

**Yang tidak ada dan tidak boleh dikarang:** belum ada satu pun komisi nyata,
belum ada testimoni, belum ada angka performa historis, belum ada studi kasus.
Semua materi promosi harus dibuat dari nol ketika data itu ada.

## Product Principles

1. **Satu langkah jelas hari ini** mengalahkan daftar fitur panjang. Kalau
   pengguna bingung harus mulai dari mana, desainnya yang salah.
2. **Kejujuran adalah fitur.** Alat yang membantu menipu pembaca akan
   menghanguskan komisi dan kepercayaan; kepatuhan diperiksa, bukan diingatkan.
3. **Draft, bukan keputusan.** AI mengusulkan; pengguna memutuskan. Tidak ada
   jalur yang melewati tindakan manusia.
4. **Bukti mengalahkan tebakan.** Skor tanpa data harus bilang "data tipis",
   bukan menyimpulkan.
5. **Bertahan di sinyal jelek.** Aplikasi harus tetap berguna saat offline,
   karena pekerjaannya dilakukan sambil lalu.

## Accessibility & Inclusion

Belum ada standar khusus yang ditetapkan. Yang sudah berlaku di kode: target
sentuh ≥44px pada tombol utama, teks status tidak bergantung pada warna saja,
dan tabel lebar berubah menjadi kartu di layar sempit (`TabelResponsif`).
