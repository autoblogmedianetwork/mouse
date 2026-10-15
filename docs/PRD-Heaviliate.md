# PRD: Heaviliate

**Versi:** 0.1 (draft MVP)
**Tanggal:** 8 Oktober 2026
**Owner:** Slamet

---

## 1. Ringkasan

Heaviliate membantu affiliate Shopee menyusun konten Threads dari link produk. User memasukkan link Shopee, AI menganalisis produk, user memilih ide konten, lalu sistem men-generate status Threads yang siap disalin dan diposting.

## 2. Masalah

Affiliate menghabiskan waktu untuk mencari produk, menentukan angle, menulis hook, dan menyusun cerita untuk tiap posting. Proses ini melelahkan dan sering menghasilkan konten yang kurang menarik, sehingga engagement rendah.

## 3. Target User

- **Primer:** affiliate Shopee yang aktif posting di Threads, dari pemula sampai pro.
- **Sekunder:** admin konten atau tim kecil yang mengelola beberapa akun affiliate.

## 4. Tujuan (Goals)

1. Waktu dari link produk sampai draft siap posting di bawah 2 menit.
2. User bisa menghasilkan minimal 4 konten dalam satu batch.
3. Hasil konten terasa natural (tidak terdengar seperti iklan kaku atau AI generik).
4. Setiap status Threads patuh batas 500 karakter.

## 5. Non-Goals (MVP)

- Posting otomatis ke Threads lewat API di MVP. Mode auto-posting masuk M6 (lihat F8). Mode manual tetap ada di semua fase.
- Scraping berskala besar ke Shopee (berisiko diblokir dan melanggar ToS).
- Analitik performa posting.
- Penggunaan multi-user atau dijual ke affiliate lain. MVP untuk akun affiliate pribadi.
- Akses Shopee Open Platform. Akses belum ada, data produk diisi manual.
- Dukungan platform selain Threads di MVP. Arsitektur sudah disiapkan untuk multi-platform (lihat bagian 16 dan rencana fase). Platform lain masuk roadmap.
- Penjadwalan posting.

## 6. Fitur

### F0. Referensi Foto Produk dan Mode Draft
- **Foto produk sebagai referensi.** User bisa mengunggah foto produk yang diunduh manual dari listing Shopee. Foto dipakai untuk riset visual: memastikan warna, bentuk, dan isi paket sesuai saat menyusun storyboard (F7). Foto tidak otomatis diunduh atau diposting oleh sistem.
- **Penggunaan foto untuk posting.** Foto milik seller biasanya memiliki hak cipta. Untuk konten yang diposting, gunakan foto sendiri, foto dari hasil pemakaian pribadi, atau visual AI yang diberi disclosure. Foto seller hanya dipakai sebagai referensi internal, kecuali sudah ada izin.
- **Mode draft wajib (default).** Semua output AI (ringkasan produk, ide, status Threads, storyboard, JSON) disimpan dengan status `draft`. Tidak ada output yang berstatus "siap posting" sebelum user menandainya sendiri.
- **Checkpoint di tiap tahap.** Alur berhenti di tiap tahap sampai user menyetujui hasilnya: setelah analisis, setelah pilih ide, setelah generate, dan setelah storyboard. User bisa mengulang tahap mana pun tanpa mengulang tahap sebelumnya.
- **Tanda draft terlihat jelas.** Setiap konten menampilkan label Draft dan tanggal terakhir diubah, sampai user menekan "Tandai siap".
- **Tools media opsional.** Hapus background (rembg) dan render video (HyperFrames) tersedia sebagai fitur, default mati. Diaktifkan per fitur di Pengaturan, lihat ADR 0003.

### F1. Analisis Link Produk
- Input: link produk Shopee atau link affiliate (`s.shopee.co.id/...`).
- **Input manual selalu tersedia.** User bisa mengisi nama, varian, harga, dan deskripsi secara manual kapan saja. Mode ini wajib ada dan tidak pernah dihapus.
- **Scraping (opsional, default mati).** Jika diaktifkan, sistem mencoba membaca halaman dari link Shopee. Batasan: maksimal beberapa permintaan per hari, hasil disimpan di cache, dan user diberi peringatan soal risiko ToS. Jika scraping gagal atau diblokir, sistem otomatis kembali ke input manual tanpa menghentikan alur.
- Output: ringkasan produk (nama, varian, deskripsi singkat, harga, kategori), tingkat confidence, dan catatan jika data kurang lengkap.
- Kategori belum diketahui tetap ditampilkan tanpa memblokir alur.

### F2. Ide Konten
- AI menghasilkan 10 ide topik dari hasil analisis.
- Tiap ide punya judul, deskripsi singkat, "jembatan" ke produk, dan label format (Listicle, Checklist, Storytelling, Perbandingan, Problem-Solution, Tutorial).
- User bisa memilih satu atau beberapa ide, serta tombol Pilih Semua dan Batalkan Semua.

### F3. Pengaturan Generate
- Jumlah status per konten: Pendek (3-5), Menengah (6-11), Panjang (12+).
- Panjang per status: Singkat, Sedang, Panjang.
- Instruksi tambahan (opsional, teks bebas).
- Toggle **Anti AI Slop**: wajib ada dialog, panjang antarstatus tidak seragam, bentuk tiap status berbeda.
- Persona dan arah konten (opsional, default "Bawaan").
- Jumlah konten yang dibuat mengikuti jumlah ide yang dipilih.

### F3a. Kepercayaan dan Letak CTA
- Pengaturan hook: user bisa memilih gaya pembuka (pertanyaan, masalah relatable, pernyataan mengejutkan) sebagai bagian pengaturan generate.
- Aturan kepercayaan: setiap batch wajib memuat minimal satu status yang menyebut kekurangan atau batasan produk. Aturan ini bisa dimatikan user.
- Angle "pengalaman" atau "jujur" selalu tersedia di daftar ide.
- Letak link dan CTA: user memilih salah satu dari tiga opsi:
  1. Di status terakhir.
  2. Di balasan terpisah dari utas utama.
  3. Tanpa link (konten saja).
- Pilihan letak link bisa diubah setelah generate tanpa menulis ulang konten.
- Catatan: efektivitas link di status utama versus balasan belum diketahui untuk Threads. Opsi default sebaiknya diuji dengan beberapa konten sebelum ditetapkan.

### F4. Generate Konten Threads
- Output berupa urutan status dalam satu percakapan AI per batch.
- Setiap status divalidasi di kode: maksimal 500 karakter. Jika lebih, sistem minta regenerate khusus status tersebut.
- Preview tampil seperti tampilan Threads, dengan penghitung karakter per status.
- Tombol **Salin Utas Lengkap** dan **Edit** per status.
- Tombol **Regenerate** per konten.

### F5. Bank Konten & Template
- Konten yang sudah dibuat tersimpan dan bisa dibuka ulang.
- Template gaya dan struktur yang bisa dipakai ulang.
- Hasil edit tersimpan sebagai draft.
- Pelacakan per konten: setiap konten punya ID dan link yang dipakai. User mencatat jumlah klik dan komisi secara manual di Bank Konten.
- Ringkasan performa sederhana: daftar konten diurutkan berdasarkan klik dan komisi, untuk melihat angle mana yang paling menghasilkan.
- Antrian review dengan tab status (lihat F10).
- Status `ditolak` ditambahkan ke enum status konten lewat migrasi baru.
- Tracking otomatis dari Shopee tidak masuk MVP karena akses API belum ada.

### F6. Akun & Pengaturan
- Login (email atau Google).
- Provider AI dipilih per fungsi di Pengaturan: chat, visi, TTS, dan transkripsi (ADR 0002). Chat/JSON mengikuti `AI_BASE_URL` dan `AI_MODEL` di server (ADR 0006).
- Opsi "Mulai di percakapan AI baru" (default aktif).
- Paket Free dan Pro dihapus dari MVP. Fokus ke pemakaian pribadi.

### F7. Modul Video Affiliate (Produk Global)
- Mode input: user memilih produk dari daftar produk yang sudah dianalisis (F1), bukan dari link. Ini memungkinkan satu template dipakai untuk produk apa pun.
- Alur: ide angle, hook, storyboard, JSON scene, lalu panduan generate di Google Flow. Mengikuti `Template-Video-Affiliate.md`.
- Output: storyboard dan JSON bisa diunduh atau disalin. Video tidak dibuat oleh Heaviliate. User generate sendiri di Google Flow lalu upload.
- Validasi di kode: JSON harus valid dan memiliki semua field skema. Durasi total scene harus sama dengan durasi video.
- Larangan wajib: tidak ada harga atau klaim yang tidak ada di listing. Checklist akurasi produk ditampilkan sebelum export.
- Disclosure otomatis: teks "link affiliate" atau "#iklan" bisa ditambahkan ke caption dengan satu klik. User bisa mengedit.
- Dimulai setelah M2. Tidak masuk MVP awal.

#### F7.1 Mode Cepat: Foto ke Video
- Alur: user upload foto produk (dari F0), memilih durasi (default 10 detik) dan rasio (default 9:16), lalu sistem menyusun prompt final untuk Google Flow. User tidak perlu melewati tahap ChatGPT.
- Prompt final disusun dari template tetap yang berisi: kunci produk (bentuk, warna, desain tidak boleh berubah), gaya UGC problem-solution atau hook produk, batas narasi VO Bahasa Indonesia (default maksimal 25 kata), dan larangan harga, klaim berlebihan, serta logo yang tidak ada di foto.
- Perintah shortcut seperti `/ugcproblemsolution` hanya dipakai jika sudah dipastikan berfungsi di Google Flow. Sebelum itu, sistem menyimpan instruksi lengkap sebagai teks, bukan bergantung pada shortcut.
- Output: prompt final dan checklist cek hasil. Video tetap digenerate dan diupload sendiri oleh user.
- Checkpoint wajib: user mengonfirmasi prompt final sebelum disalin. Hasil video dibandingkan dengan foto asli sebelum status berubah menjadi "siap posting".
- Semua output tetap berstatus draft (lihat F0).
- Batasan: mode ini tidak dipakai untuk produk yang fotonya diambil dari visual promosi seller, kecuali user sudah punya izin atau hanya untuk referensi internal.
- Voice-over (VO) memakai provider TTS yang dipilih di Pengaturan: cloud (Gemini TTS, ElevenLabs) atau lokal (VoiceStudio, jika aktif). Suara yang di-clone harus suara yang punya hak untuk dipakai.
- Foto produk bisa dihapus background dengan rembg jika fitur aktif. Hasil disimpan sebagai referensi internal dan tidak diposting tanpa izin seller.
- Hubungan dengan mode storyboard: mode cepat untuk konten singkat dan uji cepat. Mode storyboard (Template-Video-Affiliate.md) untuk konten yang butuh alur lebih panjang atau banyak scene.

### F8. Mode Posting: Manual atau Auto
- **Mode manual (default, wajib ada).** User menyalin utas dengan "Salin Utas Lengkap" dan posting sendiri di Threads. Mode ini tidak pernah dihapus.
- **Mode auto-posting (opsional, M6).** Sistem memposting utas ke Threads lewat Threads API setelah user menyetujui.
- **Draft-first tetap berlaku.** Auto-posting hanya bisa dijalankan pada konten yang sudah berstatus "siap posting" dan sudah disetujui user. Tidak ada posting langsung dari hasil generate.
- **Jadwal posting.** User memilih waktu posting untuk konten yang sudah disetujui. Sistem hanya mengirim saat jadwal tiba, dan user bisa membatalkan sebelum waktunya.
- **Batas platform.** Sistem menerapkan jeda antar posting dan batas harian sesuai dokumentasi resmi Threads. Angka pasti dicek di dokumentasi Meta sebelum M6, tidak diambil dari sumber pihak ketiga.
- **Status posting.** Setiap konten punya status: draft, siap posting, dijadwalkan, terkirim, atau gagal. Status gagal menampilkan alasan dan tombol coba lagi.
- **Fallback.** Jika API gagal, konten kembali ke mode manual dan user bisa menyalin langsung.
- **Pilihan mode per konten.** User bisa memilih manual atau auto untuk setiap konten. Default mengikuti pengaturan akun.
- **Menu provider posting.** Setiap konten bisa dikirim lewat salah satu provider berikut. Mode manual selalu tersedia.
  1. Manual (salin utas). Default, tidak butuh akun.
  2. Threads API. Aktif setelah review Meta disetujui.
  3. Buffer atau Metricool. Hosted, dicek dukungan Threads sebelum dipakai.
  4. Postiz atau Mixpost. Self-host, hanya di VPS atau server terpisah.
- Jika provider gagal, konten kembali ke mode manual. Provider yang dipilih disimpan per konten (`posting_provider`).
- Aturan lengkap dan alasan ada di ADR 0002.

### F9. Carousel Konten
- Carousel 3 sampai 10 slide dibuat dari ide terpilih, dengan cover, isi, dan CTA.
- Template tetap, rasio 4:5 default, dan caption serta hashtag dari prompt 08.
- Renderer default `off`: user merender sendiri atau memakai Canva. Renderer `local` atau `cloud` diaktifkan kemudian (ADR 0003).
- Checklist khusus carousel dan aturan disclosure berlaku.
- Detail lengkap di `docs/fitur-carousel.md`. Keputusan renderer di K13.

### F10. Mode Kerja dan Antrian Review
- Mode kerja per akun: manual (default), semi-otomatis (Fase 5), dan otomatis penuh (Fase 7, opsional, menunggu K12).
- Mode semi hanya membuat draft pada jam aktif, dengan batas draft per hari dan ambang skor ide.
- Antrian review dengan tab: perlu review, disetujui, terjadwal, gagal posting, sudah posting, dan ditolak.
- Widget biaya AI di header dengan peringatan pada 80 persen dan penghentian pada 100 persen dari batas bulanan.
- Detail lengkap di `docs/fitur-mode-kerja.md`.

## 7. User Flow Utama

1. User membuka tab **Produk**, tempel link, klik **Analisis Produk**.
2. Sistem menampilkan ringkasan produk.
3. User pindah ke tab **Ide Konten**, memilih ide.
4. User pindah ke tab **Generate**, mengatur panjang utas, kepadatan, instruksi, dan Anti AI Slop.
5. User klik **Generate N konten**.
6. Sistem menampilkan hasil per konten. User mengedit bila perlu.
7. User klik **Salin Utas Lengkap** dan posting manual di Threads.

Detail alur ada di `Workflow-Heaviliate.md`.

## 8. Requirement Non-Fungsional

- **Kecepatan:** analisis produk selesai kurang dari 15 detik untuk link yang berhasil dibaca. Generate satu batch 4 konten kurang dari 90 detik.
- **Keandalan:** jika AI gagal, state tiap tab tetap tersimpan dan user bisa mencoba ulang tanpa mengulang tahap sebelumnya.
- **Batas karakter:** semua status Threads dipastikan maksimal 500 karakter sebelum ditampilkan.
- **Bahasa:** output default Bahasa Indonesia kasual, sesuai gaya Threads.
- **Keamanan:** API key AI disimpan di server, tidak pernah di sisi klien. Data user hanya bisa diakses pemiliknya.
- **Kepatuhan:** tidak ada akses otomatis ke akun Shopee atau Threads user.
- **Draft-first:** semua output AI masuk sebagai draft. Tidak ada status "siap posting" tanpa tindakan eksplisit dari user. Berlaku untuk teks, storyboard, dan JSON.

## 9. Model Data (Draft)

- `users`: id, email, paket, kuota_tersisa, created_at
- `products`: id, user_id, url, nama, varian (json), deskripsi, harga, kategori, confidence, sumber (scrape/manual)
- `idea_batches`: id, product_id, created_at
- `ideas`: id, batch_id, judul, deskripsi, jembatan, format_label, dipilih (bool)
- `generations`: id, idea_id, pengaturan (json: jumlah_status, panjang, instruksi, anti_ai_slop, persona), status (pending/done/failed), created_at
- `contents`: id, generation_id, judul, status_list (json), versi, is_draft, letak_link (status_terakhir | balasan | tanpa_link), link_produk, klik_manual, komisi_manual, posting_provider (manual | threads_api | buffer | metricool | postiz | mixpost)
- `threads_statuses`: id, content_id, urutan, teks, jumlah_karakter, edited_at
- `templates`: id, user_id, nama, pengaturan (json)

## 10. Strategi AI

### 10.1 Pembersihan Deskripsi
Deskripsi yang disalin dari Shopee dibersihkan sebelum masuk prompt:
- Hapus link, hashtag spam, dan emoji berlebihan.
- Hapus teks yang berulang.
- Potong maksimal 3.000 karakter.
- Field varian yang dipilih user dikirim terpisah agar AI tidak menggabungkan semua varian.

### 10.2 Prompt Analisis Produk (Prompt 1)
Input: deskripsi bersih, nama, varian, harga (opsional). Output: JSON.

```
Kamu adalah analis produk untuk affiliate Shopee yang membuat konten Threads
berbahasa Indonesia kasual.

Berikut deskripsi produk yang disalin dari halaman Shopee:
<deskripsi>
{{DESKRIPSI_PRODUK}}
</deskripsi>

Data tambahan dari user (boleh kosong):
- Nama: {{NAMA}}
- Varian: {{VARIAN}}
- Harga: {{HARGA}}

Tugasmu:
1. Ringkas produk dalam 2-3 kalimat.
2. Daftar 3-5 fitur utama yang benar-benar disebut di deskripsi.
3. Tentukan 2-3 target audiens yang paling cocok.
4. Usulkan 3 angle konten (masalah, manfaat, perbandingan, pengalaman).
5. Tandai klaim yang tidak bisa diverifikasi dari deskripsi (misalnya "terbaik", "paling awet", "100% aman").

Aturan:
- Hanya pakai informasi dari deskripsi dan data tambahan. Jangan mengarang spesifikasi.
- Jika deskripsi tidak jelas atau kosong, isi field dengan null dan beri catatan.
- Balas HANYA dalam JSON valid, tanpa teks lain dan tanpa markdown.

Format JSON:
{
  "ringkasan": "string",
  "fitur": ["string"],
  "target_audiens": ["string"],
  "angle": [{"judul": "string", "alasan": "string"}],
  "klaim_perlu_cek": ["string"],
  "confidence": "tinggi | sedang | rendah",
  "catatan": "string | null"
}
```

### 10.3 Validasi Output
- Parse JSON. Jika gagal, retry sekali.
- Jika tetap gagal, tampilkan pesan dan tombol coba lagi. Output mentah tidak ditampilkan ke user.
- Hasil JSON ditampilkan sebagai ringkasan yang bisa dikoreksi user sebelum lanjut ke ide konten.

### 10.4 Prompt Lainnya
- **Prompt 1 (analisis):** lihat 10.2.
- **Prompt 2 (ide):** output JSON 10 ide dengan format label.
- **Prompt 3 (generate):** output status per status dengan format yang ditentukan. Parameter panjang, kepadatan, dan Anti AI Slop masuk ke prompt.
- **Validasi:** parse JSON, cek jumlah status, cek 500 karakter, retry otomatis maksimal 2 kali sebelum menandai gagal.

## 11. Integrasi

| Layanan | Kegunaan | Catatan |
|---|---|---|
| API provider chat OpenAI-compatible (mis. OpenRouter) | Analisis, ide, generate | Bawaan `nvidia/nemotron-3-super-120b-a12b:free`, API key disimpan di server (ADR 0006) |
| Shopee Open Platform | Tidak dipakai di MVP | Akses belum ada, input manual |
| Playwright (opsional) | Baca halaman produk | Dipakai terbatas, ada risiko blokir |
| Supabase | Database, auth, storage | Free tier cukup untuk MVP |

## 12. Metrik Sukses

- Median waktu dari link sampai draft jadi: di bawah 2 menit.
- Rasio konten yang lolos validasi 500 karakter tanpa regenerate manual: di atas 95%.
- Rasio user yang menyalin hasil setelah generate (proxy kepuasan): di atas 60%.
- Retensi user yang kembali generate di minggu kedua: target 30%.

## 13. Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Scraping Shopee diblokir | Analisis gagal | Fallback input manual, pertimbangkan Open Platform API |
| Konten terdengar seperti AI generik | User tidak pakai hasil | Anti AI Slop, template gaya, banyak contoh few-shot |
| Biaya API membengkak | Margin negatif | Batasi kuota Free, cache hasil analisis produk |
| Klaim produk tidak akurat | Risiko kepercayaan dan hukum | Tampilkan confidence, user wajib review sebelum posting |
| Otomasi tab ChatGPT rapuh | Alur putus | Prioritaskan API, tab browser hanya opsi lanjutan |
| Auto-posting melanggar batas platform | Akun dibatasi atau diblokir | Jeda antar posting, batas harian sesuai dokumentasi, draft-first wajib, mode manual sebagai cadangan |
| Scraping Shopee diblokir atau melanggar ToS | Data produk gagal dibaca | Scraping opsional default mati, batas frekuensi, cache, fallback input manual |

## 14. Milestone

- **M1 (1-2 minggu):** F1 dan F2 dengan input manual, output JSON valid.
- **M2 (1 minggu):** F3 dan F4, validasi 500 karakter, preview, salin.
- **M3 (1 minggu):** Login, bank konten, kuota Free.
- **M4:** Beta tertutup, ambil feedback 10-20 affiliate.
- **M5:** Paket Pro dan Template.
- **M6 (opsional):** Auto-posting ke Threads (F8). Dimulai setelah review Meta dan akses Threads API tersedia. Mode manual tetap berjalan selama fase ini.

## 15. Masukan Lanjutan

### 15.1 Arsitektur
- **Abstraksi provider AI.** Bungkus pemanggilan model di satu layer (`generateJSON(prompt, schema)`). Jika harga atau kualitas provider berubah, ganti provider tanpa menyentuh fitur lain.
- **Antrian job untuk batch.** Generate 4 konten dijalankan sebagai job terpisah dengan status per konten. Satu konten gagal tidak menggagalkan yang lain, dan user bisa coba ulang per konten.
- **Idempotency.** Klik "Generate" dua kali tidak membuat dua batch. Pakai kunci unik per request.
- **Cache hasil analisis.** Simpan hasil analisis dengan hash deskripsi. Deskripsi yang sama tidak diproses ulang, sehingga biaya API turun.

### 15.2 Kualitas Output
- **Golden set.** Kumpulkan 10 hingga 20 produk uji dengan output yang dinilai manual. Setiap perubahan prompt dibandingkan dengan golden set sebelum dipakai. Ini mencegah perubahan prompt yang memperbaiki satu kasus tapi merusak yang lain.
- **Feedback per status.** Tambahkan jempol naik dan turun di tiap status. Data ini dipakai untuk menyetel Anti AI Slop dan gaya hook, bukan dilatih ulang secara otomatis.
- **Versi prompt.** Setiap prompt punya nomor versi. Konten menyimpan versi prompt yang dipakai, supaya hasil yang bagus bisa direproduksi.
- **Daftar klaim terlarang.** Simpan daftar kata seperti "terbaik", "100% aman", dan "paling murah" sebagai filter di kode, bukan hanya di prompt.

### 15.3 Pengukuran
- **A/B hook dan letak link.** Tandai setiap konten dengan gaya hook dan letak link. Dengan data klik manual, pola performa bisa dibaca per variabel.
- **Dashboard biaya.** Catat token dan biaya per batch. Tampilkan total biaya per bulan dan per konten.
- **Log terstruktur.** Simpan input yang sudah dibersihkan, output mentah, dan hasil validasi. Ini membantu saat debugging tanpa harus menyimpan data pribadi user.

### 15.4 Keamanan dan Kepatuhan
- **Batas laju dan kuota harian.** Walau MVP untuk pemakaian pribadi, batas ini mencegah loop yang menghabiskan kredit API.
- **Retensi data.** Deskripsi produk dan hasil konten dihapus atau diarsipkan setelah periode tertentu. Tentukan periodenya sebelum M3.
- **Pembatasan tool video.** Modul video (F7) hanya menghasilkan storyboard dan JSON. Tidak ada upload otomatis ke Google Flow, sehingga risiko kesalahan atau pelanggaran kebijakan tetap di tangan user.

### 15.5 Urutan Prioritas Tambahan
1. Abstraksi provider dan cache hasil analisis (hemat biaya, mudah diubah).
2. Golden set dan versi prompt (mencegah regresi kualitas).
3. Feedback per status dan A/B hook (mulai belajar dari data).
4. Modul video F7 (setelah teks stabil).

## 16. Pertanyaan Terbuka

1. Endpoint dan format request provider chat (kompatibel OpenAI atau format sendiri)? Perlu dicek dari dokumentasi provider sebelum M1. Sudah dijawab ADR 0006: OpenAI-compatible.
2. Batas token dan biaya per 1 juta token untuk model yang dipakai, untuk menghitung biaya per batch 4 konten.
3. Apakah data produk manual cukup, atau perlu foto produk ikut dianalisis?
