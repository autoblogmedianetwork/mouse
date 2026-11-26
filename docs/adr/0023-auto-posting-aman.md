# ADR 0023: Auto-posting yang aman (K12 / Fase 7) — DESAIN, MENUNGGU KEPUTUSAN

Status: **diusulkan** (menunggu keputusan user; belum diimplementasi)
Tanggal: 2026-11-17

## Konteks

Fase 7 (auto-posting) sudah lama dirancang sebagai opsional dengan default
mati. Riset 17 Nov menemukan fakta yang mengubah kalkulasinya:

- **Threads API resmi Meta sekarang gratis** — tidak ada biaya per call.
- **Posting ke akun sendiri TIDAK butuh App Review** — cukup membuat Meta
  app dan mendaftarkan diri sebagai Threads tester (sumber: Meta docs,
  dibaca 4 Nov 2026 via blog.lots.social).
- Batas wajar: 250 post + 1.000 balasan per 24 jam per profil — jauh di
  atas kebutuhan 1 konten + 3 balasan per hari.
- Persyaratan teknis: Meta app (ID + secret), token akses dari OAuth
  `threads.com/oauth/authorize`, media harus bisa diakses publik via URL.
- Pertanyaan user: "apakah ada cara yang aman?"

## Jawaban: aman bila memenuhi 4 syarat

Auto-posting berisiko ban **hanya bila** dilakukan di luar jalur resmi
(browser automation, scraping, akun palsu, volume tidak manusiawi). Jalur
resmi Meta adalah jalur yang disetujui platform itu sendiri. Syarat aman:

1. **Hanya API resmi** (`graph.threads.com`) — nol scraping, nol browser
   automation, nol akun ketiga.
2. **Persetujuan ganda** — konten harus sudah lolos checklist dan user
   menyetujui jadwalnya secara eksplisit. Tidak ada yang terkirim tanpa
   dua tindakan sadar: (a) menandai "siap posting" + (b) mengaktifkan
   jadwal untuk konten itu.
3. **Kill switch satu klik** — tombol "Hentikan semua jadwal" yang
   mematikan seluruh pengiriman otomatis seketika, di halaman Antrian.
4. **Transparan** — log setiap kiriman (waktu, konten, mode manual/auto)
   di Arsip Terbit, dan disclosure paid partnership tetap wajib.

## Desain yang diusulkan: "Terkirim Terjadwal dengan Persetujuan"

Bukan "bot yang posting sendiri", melainkan **kurator dengan tangan
terleasing**:

- Konten yang sudah disetujui + dijadwalkan masuk antrean pengiriman.
- Saat waktunya tiba, aplikasi mengirim via Threads API **persis isi yang
  sudah disetujui** — tidak ada rewording, tidak ada konten baru.
- Sebelum waktunya, user bisa membatalkan/menggeser kapan pun.
- Gagal kirim (rate limit, token kedaluwarsa) ditandai merah di Antrian
  dengan pesan Indonesia + jalan pulang manual (web intent tetap ada).
- Token disimpan terenkripsi (pola ADR 0031 provider terenkripsi) dan
  kedaluwarsa 60 hari — aplikasi mengingatkan sebelum kedaluwarsa.

## Yang TETAP tidak dilakukan (walau API memungkinkan)

- Membalas otomatis, like otomatis, follow otomatis — engagement palsu
  melanggar ketentuan Meta dan membunuh persona "bapak yang cerita".
- Mengirim konten yang belum lolos checklist kejujuran.
- Membaca/mengambil data pengguna lain (scraping).

## Konsekuensi bila disetujui

- Butuh: Meta app + OAuth flow + penyimpanan token terenkripsi + pekerjaan
  penjadwal (cron Vercel atau verifikasi saat halaman dibuka).
- Media (foto/video) harus di-hosting publik untuk dikirim via API —
  berbeda dengan teks murni.
- Semua fitur manual (web intent, salin) TETAP ADA sebagai jalur utama;
  auto-posting adalah lapisan opsional di atasnya.

## Keputusan yang diminta dari user

- [ ] Setuju menjalankan Fase 7 dengan desain di atas (ya/tidak)
- [ ] Bila ya: buat Meta app + daftarkan diri sebagai Threads tester
- [ ] Bila tidak: ADR ini ditutup sebagai "ditunda tanpa batas waktu";
      jalur manual + web intent tetap jalur utama
