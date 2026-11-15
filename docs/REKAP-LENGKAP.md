# Heaviliate — Rekap Lengkap Aplikasi & Fitur

> **Untuk siapa dokumen ini:** siapa pun (manusia atau AI) yang perlu tahu
> aplikasi ini apa, untuk siapa, fiturnya apa saja, dan bagaimana alurnya
> bekerja — tanpa harus membaca seluruh kode.
>
> Terakhir diperbarui: sesi Branding Kit (commit `4530c5a`).
> Aturan produk tetap: `AGENTS.md` di akar repo.

---

## 1. Apa itu Heaviliate

Heaviliate adalah **alat bantu konten affiliate berbahasa Indonesia** untuk
membantu pemilik akun baru — terutama yang belum pernah menghasilkan komisi —
menjalankan siklus lengkap: **riset → ide → tulis → jadwalkan → posting
manual → ukur hasil → putuskan ulang.**

**Bukan alat scraping.** Semua pengambilan data eksternal dilakukan manual
oleh user (tempel, salin).

**Auto-posting: ada tapi opsional dan mati secara default.** Lihat bagian
"Auto-posting & Fase 7" di bawah — jangan disimpulkan sebagai "tidak ada".

**Target pengguna:** affiliate pemula di Indonesia yang jualan lewat Threads
(utama), X, WhatsApp Status, dan caption TikTok — dengan produk dari Shopee,
Tokopedia, TikTok Shop, atau program affiliate lain (hosting, kursus, SaaS).

**Brand contoh yang dipakai user saat ini:** "Pak Slem" — persona bapak dua
anak, gaya cerita jujur.

---

## 2. Prinsip produk yang tidak boleh dilanggar

| Prinsip | Artinya |
|---|---|
| **Fase 4: manual penuh** | Tidak ada scraping marketplace, tidak ada API marketplace. Data masuk lewat tempel manual atau bookmarklet og:image. Auto-posting ada sebagai fitur OPSIONAL Fase 7 yang mati secara default — lihat bagian khusus di bawah. |
| **AI = draf, bukan kebenaran** | Setiap keluaran AI diberi label sumber ("sumber: analisis AI", "saran awal"), dan user wajib menyunting sebelum posting. |
| **Anti mengarang** | Prompt dilarang mengarang spesifikasi, harga, rating, testimoni, atau klaim "terbaik". Bagian tanpa data dilewati, bukan dikarang. |
| **Prompt versioned** | File prompt lama tidak boleh diedit. Perubahan = file versi baru (`v2`, `v3`, …). Berlaku juga untuk menghindari regresi tak terukur. |
| **Tanpa dependensi berat** | Tidak ada Prisma, tidak ada cheerio, tidak ada library video. Semua penyimpanan client memakai localStorage (+ Supabase untuk sinkron sebagian). |
| **Kejujuran dijual sebagai fitur** | Konten wajib boleh menyebut kekurangan; "aturan kepercayaan" aktif secara bawaan. |

---

## 3. Teknologi

| Lapisan | Pilihan |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Gaya | Tailwind CSS 4, token warna di `app/globals.css` |
| Validasi | Zod (semua request API & skema output AI) |
| AI | Provider berlapis: Sumopod deepseek-flash → OpenRouter nemotron → env Vercel. Bisa diganti user sendiri (per akun, terenkripsi AES-256-GCM). |
| Database | Supabase (Postgres + RLS) untuk Bank Konten, performa, peluang, provider AI |
| Penyimpanan lokal | localStorage, semua kunci berawalan `autothreads-` |
| Test | Vitest — **960 test, 117 file** |
| Deploy | Vercel (Hobby, `maxDuration = 300` untuk route AI) |

---

## 4. Mode kerja (5 tahap inti)

Alur utama aplikasi di `/posting/baru`, lima tahap berurutan dengan checkpoint:

1. **Produk** — isi produk manual (nama, deskripsi, fitur, harga, gambar, link) atau impor dari bookmarklet/prefill.
2. **Analisis ide** — AI membaca produk lalu menghasilkan 10 ide konten (listicle, checklist, storytelling, perbandingan, problem-solution, tutorial). User pilih satu.
3. **Generate** — AI menulis status/utas sesuai pengaturan (persona, hook, kerangka, jumlah, panjang, letak link, anti-AI-slop).
4. **Preview** — user menyunting tiap status, cek batas karakter platform, aturan disclosure.
5. **Selesai** — konten masuk antrian/siap-copas, lalu disalin ke platform dan ditandai terbit.

Draf tersimpan otomatis (`autothreads-draft-v2`) dan bisa disinkronkan ke Supabase.

---

## 5. Daftar menu & fitur (lengkap)

### Kelompok: Alur utama

#### 5.1 Hari Ini (`/`, `/fokus`, `/rencana`)
- **Ringkasan** — apa yang harus dikerjakan hari ini; status langkah.
- **Fokus harian** — satu tugas konkret untuk hari berjalan.
- **Rencana Perdana** — rencana 21 hari menuju komisi pertama, dibagi 3 fase:
  **Tanam (Hari 1–7, tanpa link)**, **Tembak (8–14, mulai produk)**, **Panen
  (15–21, evaluasi data)**. Beban harian: 1 konten + 3 balasan berkualitas.

#### 5.2 Branding Kit (`/branding`) — baru
Membangun akun dari nol sebelum jualan.
- Form sekali isi: **nama persona**, **satu keseharian nyata**, **topik/niche** (tersimpan otomatis).
- **7 kartu hari**: 1 Perkenalan/Manifesto (satu-satunya yang menyebut nama), 2 Cerita keseharian, 3 Cerita gagal belanja, 4 Tips kecil, 5 Hari balas thread (tidak posting), 6 Belajar kecil yang baru, 7 Evaluasi minggu pertama.
- Tiap hari dua jalan: **Manual** (template dengan `[nama]`/`[detail_hidup]`/`[niche]` terisi otomatis, bebas disunting) atau **AI** (memakai ulang `/api/generate`: persona bernama + kerangka `cerita` + tanpa link + 1 status).
- Tombol **Salin** per hari, penghitung 500 karakter, tombol "Kembalikan ke template".

#### 5.3 Riset (`/riset`)
Mencari produk yang layak dipromosikan (sekali per produk).
- Input audiens dalam 4 fieldset: **Demografi, Minat, Kebutuhan, Perilaku belanja** (chip 44px, penghitung pilihan).
- **Persona siap pakai** mengisi chip otomatis + indikator "Dimodifikasi dari persona X"; deskripsi audiens tersusun otomatis dari chip (manual edit memutus tautan).
- **Tempel Cepat** — tempel halaman produk, ekstrak otomatis.
- **Review Pasar** — tempel ulasan pembeli, AI menyimpulkan keluhan nyata (diberi label "Masalah dari ulasanmu").
- **Bank Masalah** — kumpulan keluhan tersimpan.
- **Riwayat riset** + ekspor CSV.
- **Penilaian peluang** (skor permintaan/kompetisi/kemudahan konten) dengan keterangan tegas: *saran awal AI, bukan data penjualan*.
- **Banding niche** — bandingkan dua niche.

#### 5.4 Katalog (`/katalog`)
Daftar produk tersimpan: pencarian, thumbnail, badge marketplace, format rupiah, tombol **Buat konten** (bawa prefill), **Duplikat**, **Hapus**, sembunyikan/tayangkan massal, arsip.

#### 5.5 Bikin Konten (grup)
- **Buat posting** (`/posting/baru`) — mode kerja 5 tahap di atas.
- **Buat video** (`/video`) — jalur prompt manual: data produk → prompt storyboard (untuk ChatGPT) → tempel JSON → prompt Google Flow per scene → checklist + arsip draf. Tanpa panggilan AI dari aplikasi.
- **Lab konten** (`/lab`) — alat eksperimen:

| Alat | Fungsi |
|---|---|
| Uji Ide | Menilai ide sebelum ditulis |
| Serial 7/30 hari | Merancang konten berseri |
| Kreator | Meniru pola kreator sukses |
| Alat lain | Battle ide, Kembaran Jujur, Mirror, Ghostwriter, Lawan Bots, Nyanyian, Paralel, Analisis penawaran, Audience, AB hook |

#### 5.6 Terbit (grup)
- **Siap copas** (`/siap-copas`) — konten siap salin + link affiliate + tag Shopee.
- **Antrian** (`/antrian`) — jadwal tayang, kartu konten, dialog jadwal.
- **Batch** (`/batch`) — kelola banyak konten sekaligus.
- **Riwayat** (`/riwayat`) — arsip konten terbit.

### Kelompok: Pantau

#### 5.7 Kalender (`/kalender`)
Jadwal posting sebulan sekaligus.

#### 5.8 Analitik (`/analitik`, `/impor`)
- Ringkasan klik/komisi, insight atribusi.
- Impor laporan performa (CSV) → analisis hook mana yang bekerja.
- **Kalkulator Cuan** — hitung komisi nyata dari klik/persetujuan/komisi.

### Kelompok: Alat & Pengaturan

#### 5.9 Pengaturan (`/pengaturan`)
- Persona (termasuk **persona bernama**: nama + gaya bicara, tersimpan otomatis).
- Preset gaya, pengaturan generate.
- **Provider AI** per user: tambah/aktifkan/uji koneksi, kunci tersimpan terenkripsi.
- **Analisa Gaya** — tempel postingan akun lain, AI menyimpulkan gaya, bisa dipakai sebagai persona.
- **Hapus data** (per kategori, termasuk data branding).
- **Cadangkan data** (ekspor JSON).

#### 5.10 Pencarian (`/cari`)
Cari konten/produk/riwayat lintas bank.

#### 5.11 Biaya AI (`/biaya`)
Pemakaian token & estimasi biaya per generate.

#### 5.12 Aset (`/link`, `/template`, `/akun`, `/konten`, `/penawaran`)
- Detektor link (mendeteksi marketplace & ID affiliate).
- Template konten, akun sosial, aset penawaran.

---

## 6. Prompt AI aktif (23 versi)

Aturan: **versi lama tidak diedit**; perubahan selalu file baru.

| Prompt | Versi aktif | Dipakai untuk |
|---|---|---|
| `generate-status` | **v9** | Menulis status/utas (fork v4 + 12 gaya hook + integrasi kerangka + aturan fakta untuk `fomo_lembut` & `urgensi_rasional`) |
| `ide-konten` | v2 → v1 | 10 ide konten |
| `analisis-penawaran` | v3 → v2 | Analisis produk/penawaran |
| `carousel-slides` | v2 → v1 | Slide carousel |
| `naskah-video` | v2 → v1 | Naskah video |
| `peluang-produk` | v2 | Peluang produk dari keluhan |
| `review-pasar` | **v2** | Ringkasan ulasan pembeli — WAJIB parafrase, larangan salin >8 kata, buang data pribadi |
| `analisa-gaya` | **v2** | Analisa gaya akun lain — larangan salin >5 kata, catchphrase maks 5 kata |
| `serial-7-hari` / `serial-30-hari` | v1 | Rancangan serial |
| `mirror` | **v2** | Tiru POLA gaya kompetitor — larangan salin >5 kata, tanpa nama kreator asli |
| `ab-hook`, `battle`, `kembaran-jujur`, `lab-uji`, `lawan-bots`, `nyanyian`, `paralel`, `ghostwriter`, `ide-masalah`, `riset-audience`, `analisis-produk`, `foto` | v1 | Alat Lab & riset |

**Blok bersama:** `lib/ai/gaya-bahasa.ts` (ATURAN_BAHASA, dipakai semua prompt)
dan `lib/ai/prompts/generate-status.v7.ts` (ATURAN_ANTI_TERJEMAHAN).

### 6.1 12 gaya hook (`gaya_hook`)
`bawaan`, `pertanyaan`, `masalah_relatif`, `pernyataan_mengejutkan`,
`curiosity_gap`, `before_after`, `contrarian`, **`educative`**,
**`fomo_lembut`**, **`negative_stop`**, **`urgensi_rasional`**,
**`pengalaman_nyata`** (5 terakhir = baru).

### 6.2 8 kerangka penulisan (`kerangka`)
`bebas`, `psc`, `aida`, `pas`, `bab`, `hbsc`, `msspc`, **`cerita`**
(Mini Story Telling: situasi awal → momen pakai → kesimpulan jujur → CTA lembut).

---

## 7. Tingkat kepercayaan & batas

| Hal | Status |
|---|---|
| Batas karakter | Threads 500, X 280, WA Status 700, Caption TikTok 2200 |
| Retry AI | 2x per generate, skema Zod memaksa patuh batas |
| Rate limit | Ada (`lib/rate-limit.ts`) untuk mencegah penyalahgunaan biaya |
| Sinkron lintas perangkat | **Sebagian** — draft/konten/produk tersimpan di Supabase; persona, branding kit, dan beberapa pengaturan masih localStorage per browser |
| Migrasi DB | 0013 (skor peluang) & 0014 (provider AI) sudah dijalankan user |
| Sinkron penuh | **Ditahan** sampai beta test teman selesai |

---

## 8. Yang sengaja TIDAK ada (jangan ditambahkan tanpa keputusan baru)

- Scraping marketplace / auto-fetch produk & ulasan.
- Rendering video / integrasi CapCut / TTS otomatis.
- Bot Telegram / webhook dispatcher.
- Prisma, cheerio, atau ORM/Scraper baru.
- Prompt self-correcting otomatis (belum; Analisa Gaya sudah menutup sebagian).

Ide yang **layak dibangun nanti** (sudah dinilai): rekonsiliasi CSV komisi
Shopee untuk mencocokkan hook mana yang menghasilkan uang; etalase publik
"rating kejujuran" dari Katalog.

---


---

## 8b. Auto-posting & Fase 7 (jangan salah baca)

Auto-posting **ADA**, tetapi bukan seperti yang biasa orang maksud:

| Aspek | Kenyataan |
|---|---|
| Rute | `POST /api/posting/kirim` — satu-satunya jalur kirim di seluruh aplikasi. |
| Default | **Mati.** `PENGATURAN_POSTING_AWAL.penyedia = "manual"`, diuji di `lib/posting/antrian.test.ts`. |
| Kapan aktif | Hanya bila `THREADS_USER_ID` + `THREADS_ACCESS_TOKEN` diisi di server. Kalau tidak, `penyediaEfektif()` otomatis jatuh ke `manual`. |
| Gerbang wajib | `periksaKirim()` di `lib/posting/antrian.ts` — konten harus berstatus `siap_posting`/`terjadwal`/`gagal`, jadwal sudah tiba, kuota harian belum penuh, jeda antar posting lewat, dan setiap status ≤ 500 byte. |
| Uji gerbang | 17 test di `lib/posting/antrian.test.ts` (status ditolak, jadwal belum tiba, batas harian, jeda, batas byte, konten tanpa status). |
| Siapa yang memakai | Hanya `kalender-klien.tsx` (tombol kirim di Kalender) dan `form-pengaturan.tsx`. Alat Lab tidak. |

Yang tetap **tidak ada**: menggenerate lalu memposting otomatis tanpa persetujuan
user, penjadwal latar belakang (cron) yang mengirim tanpa membuka aplikasi.

**Keputusan K12 (belum diputuskan):** penjadwal latar belakang otomatis
sengaja belum dibuat. Kode `lib/posting/antrian.ts` menyatakan bahwa pengiriman
otomatis latar belakang hanya boleh dibuat setelah K12 disetujui. Sampai
keputusan itu ada, kirim tetap dipicu user dari UI.

**Semua alat Lab (ab-hook, battle, ghostwriter, kembaran-jujur, lab-uji,
lawan-bots, mirror, nyanyian, paralel) tidak punya jalur kirim.** Ini dikunci
oleh test `lib/lab/tanpa-jalur-kirim.test.ts`: kalau ada yang menambahkan
import provider posting atau `/api/posting/kirim` ke salah satu route Lab,
test gagal.

---

## 8c. Privasi data pihak ketiga

- **Kunci master provider** (`AI_PROVIDER_SECRET`) hanya dibaca di server, tidak
  pernah masuk bundle klien, dan tidak pernah ada di localStorage — jadi tidak
  mungkin ikut terekspor di cadangan JSON.
- **Kunci API provider milik user** disimpan terenkripsi AES-256-GCM di kolom
  `api_key_enc`. `GET /api/ai-provider` tidak pernah memilih kolom itu, jadi
  kunci tidak pernah dikirim ke browser.
- **Teks ulasan pembeli** hanya dikirim ke provider AI saat user menekan tombol
  analisis, tidak disimpan ke Supabase, tidak di-log, dan tidak masuk
  `autothreads-riwayat-riset` (riwayat hanya menyimpan niche + audiens).
  Yang tersimpan di Bank Masalah adalah **parafrase** (prompt `review-pasar.v2`
  mewajibkan parafrase, melarang menyalin >8 kata, dan membuang data pribadi).
- **Cadangan JSON** hanya menyapu kunci berawalan `autothreads-`, sehingga
  tidak pernah memuat kunci API.

## 9. Peta file penting

```
lib/ai/
  schemas.ts            skema Pengaturan, Ide, batas jumlah/karakter
  persona.ts            daftar persona + "bernama"
  gaya-bahasa.ts        ATURAN_BAHASA (dipakai semua prompt)
  kerangka.ts           KERANGKA_IDS, BAGIAN, instruksiKerangka
  prompts/              23 prompt versioned
  jalankan-ai.ts        pemanggil provider + retry + biaya
features/
  posting/              5 tahap alur buat konten
  riset/                panel riset (input, review pasar, peluang, bank)
  branding/             Branding Kit
  katalog/, antrian/, lab/, video/, analitik/, pengaturan/, …
lib/
  branding/kit.ts       7 hari Branding Kit + bodyAI
  produk/store.ts       Katalog produk
  riset/                preset persona, skor peluang, tempel cepat
  konten/               siap-copas, auto-isi, daur-ulang
  storage/kotak.ts      pembungkus localStorage (16 store)
app/(dashboard)/…       halaman per menu
app/api/…               35 route (generate, ide, riset, lab, serial, …)
supabase/migrations/    0001–0015
```

---

## 10. Cara memverifikasi (untuk AI yang mengubah kode)

```bash
npx tsc --noEmit          # tipe
npm run lint              # 0 error, 0 warning
npx vitest run            # 960 test hijau
npm run build             # build produksi
```

Semua empat langkah harus hijau sebelum commit. Commit kecil dan bertema
satu hal supaya `git revert` bisa membatalkan satu langkah saja.

---

## 11. Ringkasan satu paragraf

Heaviliate mengubah satu produk affiliate menjadi konten siap tempel lewat
lima tahap — riset audiens, pilih ide, generate, sunting, terbit — dengan 23
prompt berbahasa Indonesia yang dijaga aturan anti-mengarang, 12 gaya hook,
8 kerangka termasuk Mini Story Telling, serta modul pendukung: Branding Kit
tujuh hari untuk akun baru, Katalog produk, antrian & kalender, analitik &
kalkulator komisi, Lab eksperimen konten, dan provider AI milik user sendiri.
Semua langkah eksternal (mengambil data, memposting) tetap manual — aplikasi
hanya membuat draf, menyimpan, mengingatkan, dan mengukur.
