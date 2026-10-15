# Rencana Testing: Heaviliate

Dokumen ini merinci strategi testing dari bagian 6 dan 7 di `Rencana-Pengembangan-Heaviliate.md`. Tidak mengubah rencana utama.

## 1. Tujuan

1. Output AI selalu tervalidasi sebelum tampil.
2. Tidak ada status Threads di atas 500 karakter.
3. Tidak ada konten yang menjadi `siap_posting` tanpa checklist.
4. User tidak bisa membaca data user lain.
5. Perubahan prompt tidak menurunkan kualitas tanpa terdeteksi.
6. Tools opsional tidak merusak alur saat mati atau tidak tersedia.

## 2. Lapisan testing

| Lapisan | Alat | Yang diuji | Kapan dijalankan | Target waktu |
|---|---|---|---|---|
| Unit | Vitest | Validator 500 karakter, parser JSON, pembersih deskripsi, hash cache, `detect.ts`, `rules.ts`, hook `useCharCount` | Setiap perubahan logika | Di bawah 30 detik |
| Skema | Zod | Setiap output AI divalidasi | Setiap panggilan AI | Runtime |
| Fixture | Vitest + `tests/fixtures/` | Respons JSON valid dan tidak valid dari provider (tanpa panggil API) | Setiap perubahan parser | Di bawah 30 detik |
| Golden set | Skrip `npm run test:golden` | 10 produk, validasi otomatis dan rubrik manual | Setiap perubahan prompt | 10 sampai 20 menit (manual) |
| Integrasi | Vitest dengan Supabase lokal | Alur produk, analisis, ide, generate, simpan, dan status | Akhir setiap fase | Beberapa menit |
| Keamanan (RLS) | Skrip dengan dua akun uji | User A tidak bisa baca atau tulis data B di setiap tabel dan bucket | Setiap perubahan skema | Beberapa menit |
| E2E | Playwright (Fase 5) | Alur utama dari input sampai salin | Sebelum rilis pribadi | Beberapa menit |
| Manual | Checklist | UI desktop dan mobile, clipboard di HP, responsif | Akhir setiap fase | Tergantung fase |
| Perangkat | Checklist | Tools media di perangkat tujuan (P10) | Sebelum mengaktifkan tool | Sekali per perangkat |

## 3. Tes unit: daftar wajib

**Validator 500 karakter**
- Status 499 dan 500 karakter lolos
- Status 501 karakter ditolak
- Teks kosong ditolak
- Emoji dihitung sesuai `char_length` di database, dan konsisten dengan hitung di klien

**Parser JSON**
- JSON valid lolos
- JSON dengan markdown fence (```json) ditolak atau dibersihkan sesuai aturan
- JSON terpotong ditolak
- Field wajib hilang ditolak
- Tipe data salah ditolak

**Pembersih deskripsi**
- Link dihapus
- Hashtag spam dihapus
- Emoji berlebihan dikurangi
- Teks berulang dihapus
- Panjang dipotong 3.000 karakter
- Teks kosong menghasilkan null

**Hash cache**
- Input sama menghasilkan hash sama
- Varian berbeda menghasilkan hash berbeda
- Versi prompt berbeda menghasilkan hash berbeda

**`detect.ts`**
- Domain Shopee, termasuk `s.shopee.co.id`
- Domain tidak dikenal menghasilkan generik
- Input tanpa protokol ditangani

**`rules.ts`**
- Aturan Shopee: disclosure wajib
- Aturan generik: tidak ada aturan tambahan

**Retry**
- Satu retry untuk JSON invalid
- Dua retry maksimal untuk status karakter
- Setelah batas, status ditandai untuk edit manual

## 4. Tes skema dan RLS

Dijalankan setelah setiap migrasi.

| Skenario | Harapan |
|---|---|
| User A membaca `products` milik B | Tidak ada baris |
| User A mengubah `contents` milik B | Ditolak |
| User A membaca `product_media` milik B | Tidak ada baris |
| User A membaca file di bucket `product-media` folder B | Ditolak |
| User A membuat `threads_statuses` dengan `content_id` milik B | Ditolak |
| Insert `threads_statuses` dengan teks 501 karakter | Ditolak constraint |
| Insert `contents` dengan `status = 'siap_posting'` tanpa checklist | Ditangani aplikasi, bukan database. Tes di tingkat server |
| View analitik dibaca user A | Hanya baris milik A |

## 5. Golden set

Lihat `golden/README.md` dan `golden/rubrik.md`.

**Tahap 1: validasi otomatis (wajib lulus sebelum penilaian manual)**
- JSON valid untuk semua produk
- Jumlah ide tepat 10
- Format label ide sesuai daftar
- Tidak ada status lebih dari 500 karakter
- Tidak ada harga di status
- Jumlah status sesuai pengaturan uji

**Tahap 2: penilaian manual**
- Lima kriteria dengan rubrik
- Skor di bawah 3 wajib diberi alasan

**Aturan penerimaan prompt baru**
- Semua produk lulus validasi otomatis, atau kegagalan dijelaskan
- Rata-rata skor tidak turun
- Tidak ada produk yang turun lebih dari 1 poin
- Perubahan dicatat di `docs/eval-log.md` dengan versi prompt

**Kapan dijalankan**
- Setiap perubahan `prompts/`
- Setiap ganti model
- Sebelum rilis tiap fase

## 6. Tes per fase

| Fase | Tes wajib | Exit criteria |
|---|---|---|
| 0 | Satu panggilan API provider chat (P2), satu panggilan dengan gambar (P7) | JSON valid dari keduanya |
| 1 | Unit (dasar), RLS (tabel awal), login dua akun | Akun B tidak melihat data A |
| 2 | Unit (cleaning, parser, cache), fixture, golden tahap 1 | Minimal 9 dari 10 produk JSON valid |
| 3 | Unit (500 karakter, retry), integrasi generate, E2E manual salin | Tidak ada status di atas 500. Salin menghasilkan urutan benar |
| 4 | Integrasi pustaka dan tracking, ekspor dan impor cadangan | Data cadangan sama dengan data asli |
| 4.5 | Unit (`lib/media/` dengan mock), uji tool di perangkat (P10), golden untuk prompt 04 sampai 06 | Tool mati tidak merusak alur. Prompt 04 lulus validasi durasi |
| 5 | E2E utama, 15 konten nyata, biaya tercatat | 10 konten diposting, biaya sesuai estimasi |
| 6 | Integrasi kalender dan view analitik, RLS view | Kalender menampilkan jadwal benar. View hanya baris milik user |
| 7 | OAuth Meta di akun uji, posting ke akun uji, kegagalan API | Konten yang belum disetujui tidak pernah terkirim |

## 7. Tes tools media

Setiap tool diuji dengan dua mode: aktif dan mati.

| Tool | Tes saat mati | Tes saat aktif |
|---|---|---|
| rembg | Tombol tampil "Tidak tersedia", alur lanjut manual | Foto diproses, hasil disimpan sebagai referensi internal |
| HyperFrames | Tombol tampil "Tidak tersedia", jalur A tetap berjalan | Render 10 detik, durasi sesuai storyboard |
| VoiceStudio | Fallback ke Gemini TTS | VO per scene, durasi terukur |
| Kompresi browser | Foto asli tetap bisa diunggah | Ukuran di bawah target 300 KB |

Syarat sebelum tool diaktifkan: P10 sudah diuji di perangkat tujuan, dan hasilnya dicatat.

## 8. Tes kegagalan (chaos)

| Skenario | Perilaku yang diharapkan |
|---|---|
| Provider chat mengembalikan 429 | Tunggu, retry sesuai backoff, lalu tampilkan pesan dan pilihan provider cadangan |
| Provider mengembalikan JSON rusak | Retry satu kali, lalu pesan error. Output mentah tidak tampil |
| Jaringan putus saat autosave | Banner offline, perubahan disimpan lokal, sinkron saat online |
| Clipboard ditolak browser | Pesan untuk salin manual, teks tetap tersedia di layar |
| Storage penuh saat upload | Pesan error, foto tidak tersimpan setengah |
| Tool lokal mati saat dipanggil | Fallback sesuai pengaturan, konten tidak hilang |
| Batas biaya bulanan tercapai | Panggilan AI berhenti, pesan jelas, data tetap bisa diedit |

## 9. Tes performa

| Metrik | Target |
|---|---|
| Analisis produk | Di bawah 15 detik untuk satu produk |
| Generate satu konten (4 status) | Di bawah 30 detik |
| Generate batch 4 konten (serial) | Di bawah 90 detik |
| Load halaman Buat posting | Di bawah 2 detik di koneksi normal |
| Kompresi foto di browser | Di bawah 2 detik per foto pada laptop jadul |

Pengukuran dilakukan di laptop low-end, karena itu perangkat utama.

## 10. Otomatisasi

Urutan jalan di CI atau pre-commit:
1. `npm run lint`
2. `npm test` (unit dan fixture)
3. Pemeriksaan kebocoran key (gitleaks)
4. Pemeriksaan bahwa `SUPABASE_SERVICE_ROLE_KEY` tidak muncul di folder komponen klien
5. Tes RLS (saat skema berubah)
6. Golden set (saat prompt berubah, manual dipicu)

## 11. Log dan bukti

- `docs/eval-log.md`: hasil golden set per versi prompt
- `docs/test-log.md`: hasil tes per fase dan tanggal
- `docs/adr/`: keputusan saat tes mengubah arah

## 12. Definisi selesai untuk testing

Sebuah fase dianggap teruji jika:
- Semua tes wajib fase itu lulus
- Tidak ada kegagalan RLS
- Golden set dijalankan jika prompt berubah
- Hasil dicatat di `docs/test-log.md`
- Tes manual di laptop low-end sudah dilakukan
