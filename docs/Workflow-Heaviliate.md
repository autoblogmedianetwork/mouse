# Workflow Heaviliate

**Versi:** 0.3
**Acuan:** PRD-Heaviliate.md, UI-Spec-Heaviliate.md, Rencana-Pengembangan-Heaviliate.md, ADR 0001 sampai 0003
**Menggantikan:** Workflow v0.1 dan v0.2

---

## 1. Aktor

| Aktor | Peran |
|---|---|
| User | Affiliate yang membuat dan memeriksa konten |
| Aplikasi | Next.js di Vercel, data di Supabase |
| Provider AI | Chat, visi, TTS, dan transkripsi, dipilih per fungsi (ADR 0002) |
| Provider posting | Manual, Threads API, Buffer, Metricool, Postiz, atau Mixpost (ADR 0002) |
| Tools media | Kompresi, rembg, HyperFrames, VoiceStudio, masing-masing opsional dan default mati (ADR 0003) |
| Google Flow | Pembuat video AI, dijalankan manual oleh user |

---

## 2. Alur Utama (MVP, Threads sebagai platform aktif)

```
[1] Input produk (manual, atau ambil dari link jika scraping aktif)
      ↓
[2] Analisis produk (AI chat, dengan visi jika foto dipakai)
      ↓
[3] Pilih ide konten (AI chat)
      ↓
[4] Pengaturan generate
      ↓
[5] Generate status Threads (AI chat, satu per satu)
      ↓
[6] Preview dan edit
      ↓
[7] Checklist gate
      ↓
[8] Tandai siap posting
      ↓
[9] Pilih provider posting dan kirim
      ↓
[10] Catat klik dan komisi (manual)
```

Setiap tahap punya checkpoint. Tidak ada tahap yang dilewati tanpa persetujuan user.

---

## 3. Detail Tahap

### Tahap 1: Input Produk
- **Input manual selalu tersedia:** nama, varian, harga, deskripsi, link referensi.
- **Scraping (opsional, default mati):** jika `SCRAPING_ENABLED=true`, sistem mencoba membaca link. Jika gagal atau diblokir, otomatis kembali ke input manual.
- **Pembersihan deskripsi:** hapus link, hashtag spam, emoji berlebihan, teks berulang. Potong maksimal 3.000 karakter. Varian yang dipilih dikirim sebagai field terpisah.
- **Foto (opsional):** dikompres di browser ke sisi terpanjang 1080 px, WebP. Disimpan di Supabase Storage. Ditandai referensi seller jika berasal dari listing.
- **Checkpoint:** user klik "Simpan dan analisis".

### Tahap 2: Analisis Produk
- Cek `analysis_cache` berdasarkan hash deskripsi bersih, varian, dan versi prompt.
- Jika tidak ada di cache, panggil provider chat dengan prompt `analisis-produk` (v1). Jika foto dipakai dan provider visi aktif, foto ikut dikirim.
- Validasi JSON dengan Zod. Jika gagal, satu kali retry. Jika tetap gagal, tampilkan pesan dan tombol "Coba lagi". Output mentah tidak ditampilkan.
- Simpan hasil ke cache dan catat di `generations` (model, token, biaya).
- **Checkpoint:** user meninjau ringkasan, bisa mengoreksi, lalu klik "Lanjut ke ide".

### Tahap 3: Pilih Ide Konten
- Panggil provider chat dengan prompt `ide-konten` (v1). Hasil berupa 10 ide.
- User memilih satu atau beberapa ide. Tersedia "Pilih semua" dan "Batalkan semua".
- **Checkpoint:** minimal satu ide dipilih.

### Tahap 4: Pengaturan Generate
User mengatur:
- Jumlah status (pendek, menengah, panjang)
- Panjang per status (singkat, sedang, panjang)
- Instruksi tambahan (opsional)
- Anti AI Slop (on atau off)
- Gaya hook (pertanyaan, masalah, pernyataan)
- Letak link (status terakhir, balasan terpisah, atau tanpa link)
- Aturan kepercayaan: wajib menyebut kekurangan produk (on atau off)
- Platform tujuan (MVP: Threads)

**Checkpoint:** ringkasan pengaturan ditampilkan sebelum generate.

### Tahap 5: Generate Konten
- Aplikasi memproses **satu ide dalam satu waktu** dengan jeda kecil di antaranya. Ini menjaga batas request per menit provider gratis tetap aman dan menghindari batas durasi fungsi Vercel.
- Setiap ide memanggil prompt `generate-status` (v1). Hasil divalidasi:
  - JSON valid, jika tidak, retry satu kali
  - Jumlah status sesuai pengaturan, jika tidak, retry satu kali
  - Setiap status maksimal 500 karakter, jika tidak, retry hanya status itu (maksimal dua kali), lalu tandai untuk edit manual
- Hasil disimpan sebagai konten berstatus `draft`.
- Progres ditampilkan per konten. Satu konten gagal tidak menghentikan yang lain. Tombol "Coba lagi" tersedia per konten.
- **Idempotency:** kunci dari hash user, produk, ide, dan pengaturan. Klik dua kali tidak membuat batch ganda.

### Tahap 6: Preview dan Edit
- Editor status di kiri, preview gaya Threads di kanan, diperbarui real-time.
- Penghitung karakter per status.
- Edit teks, regenerate per status, regenerate per konten, dan ubah letak link tanpa menulis ulang.
- Autosave setiap 10 detik jika ada perubahan.

### Tahap 7: Checklist Gate
Semua item harus tercentang sebelum "Tandai siap posting" aktif:
- [ ] Produk di media sesuai listing
- [ ] Tidak ada klaim yang tidak bisa dibuktikan
- [ ] Ada satu status yang menyebut kekurangan produk (jika aturan aktif)
- [ ] Link sudah diuji
- [ ] Disclosure affiliate sudah ada

### Tahap 8: Tandai Siap Posting
- Status berubah dari `draft` ke `siap_posting`.
- Setiap perubahan setelah itu mengembalikan status ke `draft`.

### Tahap 9: Pilih Provider Posting dan Kirim
User memilih salah satu provider. Pilihan selalu tersedia, dan provider yang belum siap ditandai.

| Provider | Cara kerja | Syarat |
|---|---|---|
| Manual (default) | Salin utas lengkap, user posting sendiri | Tidak ada |
| Threads API | Aplikasi memposting langsung setelah user setujui | Akses Threads API disetujui Meta |
| Buffer atau Metricool | Aplikasi mengirim ke antrian provider, jadwal diatur di sana | Akun dan dukungan Threads sudah dicek |
| Postiz atau Mixpost | Aplikasi mengirim ke instance self-host | Server sendiri (VPS) |

Jika provider gagal, konten kembali ke mode manual dan user bisa menyalin langsung.

### Tahap 10: Catat Klik dan Komisi
- User mengisi `klik_manual` dan `komisi_manual` per konten.
- Ringkasan performa diurutkan berdasarkan klik dan komisi untuk melihat angle terbaik.
- Tidak ada checkpoint khusus.

---

## 4. Tools Media (opsional, ADR 0003)

| Fitur | Pilihan backend | Default | Alur saat aktif |
|---|---|---|---|
| Kompresi foto | browser | browser | Otomatis sebelum upload |
| Hapus background | off, local (rembg), cloud | off | Setelah upload, sebelum analisis visi |
| Render video template | off, local (HyperFrames) | off | Sebagai alternatif Google Flow untuk video teks |
| TTS (VO) | cloud (Gemini TTS, ElevenLabs), local (VoiceStudio), off | cloud | Setelah naskah TikTok atau Reels siap |

Jika tool dipilih tapi tidak tersedia, tombol tampil dengan label "Tidak tersedia" dan user tetap bisa lanjut lewat jalur manual atau cloud.

---

## 5. Foto ke Video (F7.1)

```
Upload foto (F0)
      ↓
Hapus background (jika aktif)
      ↓
Pilih durasi (default 10 detik) dan rasio (default 9:16)
      ↓
Sistem menyusun prompt final dengan template tetap
      ↓
Checkpoint: user konfirmasi prompt
      ↓
Video dibuat manual di Google Flow, atau di render lokal (jika aktif)
      ↓
Checklist cek hasil (bandingkan dengan foto asli)
      ↓
Status: siap_posting
```

---

## 6. Affiliate: Deteksi Marketplace

Tahap MVP hanya Shopee dan input generik. Adapter lain ditambahkan saat fase multi-marketplace.

| Domain | Adapter | Catatan |
|---|---|---|
| shopee.co.id, s.shopee.co.id | Shopee | Scraping opsional, default mati |
| tokopedia.com | Tokopedia | Roadmap |
| tiktok.com (TikTok Shop) | TikTok Shop | Roadmap |
| Lainnya | Generik | Input manual |

Aturan konten per marketplace disimpan di `lib/affiliate/rules.ts` dan diperiksa di checklist.

---

## 7. Error dan Recovery

| Kondisi | Perilaku |
|---|---|
| JSON AI tidak valid | Retry satu kali, lalu pesan dan tombol coba lagi |
| Rate limit provider | Tunggu, lalu coba lagi. Jika terus gagal, user bisa pilih provider cadangan di Pengaturan |
| Status lewat 500 karakter | Retry status itu (maksimal dua kali), lalu tandai untuk edit manual |
| Scraping diblokir | Kembali ke input manual |
| Autosave gagal karena jaringan | Simpan lokal sementara, banner "Offline", sinkron saat online |
| Tool media tidak tersedia | Tombol nonaktif dengan petunjuk, alur tetap lanjut |
| Provider posting gagal | Konten tetap ada, status "gagal", pilihan coba lagi atau salin manual |

---

## 8. State Konten

```
[draft] ──(checklist lolos)──> [siap_posting] ──(provider dipilih)──> [terkirim]
   ↑                                  │                                    │
   └──────── (edit apa pun) ──────────┘                          (gagal) ──┘
                                                                     ↓
                                                                  [gagal]
                                                     (coba lagi / salin manual)
```

Aturan:
- `draft`: bebas diedit.
- `siap_posting`: edit mengembalikan ke `draft`.
- `terjadwal`: hanya jika provider mendukung jadwal. Bisa dibatalkan sebelum waktunya.
- `terkirim`: tidak bisa diedit. Gunakan "Duplikat".
- `gagal`: coba lagi atau salin manual.

---

## 9. Multi-Platform (disiapkan, bertahap aktif)

Arsitektur disiapkan sejak awal, tapi hanya Threads yang aktif di UI pada MVP.

| Fase | Platform aktif |
|---|---|
| MVP (M1 sampai M3) | Threads |
| Setelah M5 | Instagram dan Facebook (satu API Meta) |
| Setelah itu | TikTok, WhatsApp Saluran |

Saat platform diaktifkan, hal berikut ditambahkan:
- Varian konten per platform (`content_variants`, lihat rencana migrasi 0002 di skema).
- Prompt generate per platform di `prompts/`.
- Batas karakter disimpan di tabel `platforms`, bukan di kode.
- Checklist tambahan sesuai aturan platform.

---

## 10. Prinsip Workflow

1. **Draft-first:** semua output AI berstatus draft.
2. **Checkpoint di setiap tahap:** tidak ada lompatan.
3. **Input manual selalu ada:** scraping bukan satu-satunya jalur.
4. **Pilihan provider selalu ada:** untuk AI, posting, dan tools media.
5. **Fitur opsional default mati:** diaktifkan per fitur.
6. **Idempotent:** klik dua kali tidak menggandakan aksi.
7. **Fallback otomatis:** provider gagal kembali ke manual, tool tidak tersedia kembali ke jalur lain.
8. **Serial untuk MVP:** generate satu per satu dengan jeda, paralel ditunda sampai diperlukan.
