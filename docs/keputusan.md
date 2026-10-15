# Keputusan Proyek: Heaviliate

Keputusan yang sudah diambil dicatat di `docs/adr/`. Dokumen ini berisi keputusan yang masih menunggu konfirmasi dan ringkasan status prasyarat.

## 1. Keputusan produk (menunggu konfirmasi)

| No | Pertanyaan | Usulan | Konfirmasi |
|---|---|---|---|
| K1 | Preview memakai rasio asli Threads? | Ya, 4:5 untuk foto | [ ] |
| K2 | Ada tombol "Simpan sebagai template"? | Ya, menu sekunder di bilah aksi | [ ] |
| K3 | Lama arsip sebelum dihapus? | 90 hari sejak `arsip_at` | [ ] |
| K4 | Metode login? | Magic link email | [ ] |
| K5 | Scraping mati di MVP? | Ya, default mati | [ ] |
| K6 | Batas biaya AI per bulan? | Batas keras di Pengaturan, angka awal ditentukan setelah P8 | [ ] |
| K7 | Foto produk dianalisis AI? | Ya, jika P7 lolos | [ ] |
| K8 | Arah produk: MVP Threads-only dengan arsitektur multi-platform | Ya | [ ] |
| K9 | Nama produk | Heaviliate tetap, atau ganti (AutoAffiliate, AffiliateHub) | [ ] |
| K10 | Platform tahap kedua | Instagram dan Facebook (satu API Meta) | [ ] |
| K11 | Marketplace tahap pertama | Shopee, dengan input generik untuk lainnya | [ ] |
| K12 | Mode otomatis penuh: opsi A (persetujuan sekali per produk atau batch, lalu kirim otomatis untuk konten yang lolos checklist) atau opsi B (tidak dibuat) | Opsi A, sesuai `docs/fitur-mode-kerja.md` bagian 1.2 | [ ] |
| K13 | Renderer carousel: off dulu, lalu local atau cloud. Apakah gambar AI masuk | Renderer off di Fase 4.5. Gambar AI ditunda | [ ] |
| K14 | Nilai default ambang skor (70), skor prioritas (85), dan batas draft per hari (3) | Sesuai bagian 2 `docs/fitur-mode-kerja.md`, dikalibrasi setelah golden set | [ ] |

## 2. Keputusan yang sudah diambil (ADR)

| ADR | Judul | Status |
|---|---|---|
| 0001 | Google Gemini sebagai provider AI utama | Digantikan sebagian oleh 0006 |
| 0002 | Provider AI dan posting dipisah per fungsi | Diterima |
| 0003 | Tools media tersedia dan diaktifkan per fitur | Diterima |
| 0006 | Provider chat bebas lewat endpoint OpenAI-compatible | Diterima |

## 3. Prasyarat

| No | Prasyarat | Status |
|---|---|---|
| P1 | Endpoint, format request, dan harga provider chat dicatat dari dokumentasi resmi | belum |
| P2 | Satu panggilan teks menghasilkan JSON valid | belum |
| P3 | Akun Supabase dan Vercel dibuat | belum |
| P4 | Repo Git dibuat dan terhubung ke Vercel | belum |
| P5 | Golden set 10 produk ditulis manual | belum |
| P6 | K1 sampai K7 dijawab | belum |
| P7 | Foto produk berhasil dikirim ke provider visi dan JSON valid | belum |
| P8 | Harga dan kuota gratis provider yang dipakai dicek (chat, TTS, posting) | belum |
| P9 | Provider cadangan untuk chat diuji dengan golden set yang sama | belum |
| P10 | Tools media yang akan diaktifkan sudah diuji di perangkat tujuan | belum |
| P11 | Akun dibuat per provider, tanpa membuat banyak akun untuk satu provider | belum |

## 4. Tooling

| Area | Pilihan |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind, shadcn/ui |
| Form dan validasi | React Hook Form, Zod |
| Database, auth, storage | Supabase |
| Provider chat (utama) | Endpoint kompatibel OpenAI, default OpenRouter `nvidia/nemotron-3-super-120b-a12b:free` (ADR 0006) |
| Provider chat (cadangan) | Model OpenRouter gratis lain, DeepSeek, Groq, Ollama, LM Studio — cukup ganti `AI_BASE_URL` dan `AI_MODEL` |
| Provider suara | ElevenLabs, Edge TTS, atau VoiceStudio lokal (ADR 0001 untuk TTS masih berlaku) |
| Provider posting | Manual (default), Threads API, Buffer atau Metricool, Postiz atau Mixpost |
| Tools media | Kompresi di browser, rembg, HyperFrames, VoiceStudio (opsional, lihat ADR 0003) |
| Hosting | Vercel |
| Test | Vitest, Playwright (E2E nanti) |
