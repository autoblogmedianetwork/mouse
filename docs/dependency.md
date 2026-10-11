# Dependency dan Tool: AutoThreads

Ringkasan semua tool, library, dan layanan dari diskusi, dengan status dan fase. Dokumen ini tidak menggantikan ADR. Keputusan teknis tetap di `docs/adr/`.

**Status:**
- **Aktif:** dipakai di fase yang ditandai
- **Opsional:** dipakai jika fitur diaktifkan, default mati
- **Manual:** dipakai user di luar aplikasi
- **Ditunda:** tidak dipakai sampai syarat tertentu terpenuhi
- **Ditolak:** tidak dipakai
- **Belum diverifikasi:** perlu dicek sebelum dipakai

## 1. Framework, UI, dan data

| Item | Peran | Fase | Status | Catatan |
|---|---|---|---|---|
| Next.js (App Router) + TypeScript | Framework | MVP | Aktif | AGENTS.md |
| Tailwind CSS | Styling | MVP | Aktif | UI Spec |
| shadcn/ui | Komponen UI (Card, Switch, Dialog, Toast) | MVP | Aktif | Install lewat CLI, tidak clone repo |
| Supabase (DB, Auth, Storage) | Data, login, foto | MVP | Aktif | ADR 0001, skema |
| Supabase Auth (magic link) | Login aplikasi | MVP | Aktif | K4 |
| Vercel | Hosting | MVP | Aktif | README |
| Supabase Edge Functions | Job queue | Ditunda | Ditunda | Generate serial dulu (Workflow §3 tahap 5) |
| Upstash Redis | Rate limit | Fase 7 | Ditunda | Rate limit dari database dan batas biaya (K6) cukup |
| Cron di Vercel | Hapus arsip (K3) | Fase 5 | Opsional | Hanya jika retensi diotomatisasi |

## 2. Validasi, form, dan state

| Item | Peran | Fase | Status | Catatan |
|---|---|---|---|---|
| Zod | Skema validasi klien dan server, validasi JSON AI | MVP | Aktif | AGENTS.md aturan 9 |
| React Hook Form | Form pengaturan, input produk, checklist | MVP | Aktif | Skema Zod yang sama |
| `lib/cleaning/` | Pembersih deskripsi | MVP | Aktif | Custom |
| `lib/affiliate/detect.ts` | Deteksi marketplace dari domain | MVP | Aktif | Custom, Shopee dan generik |
| `lib/affiliate/rules.ts` | Aturan konten per marketplace | MVP | Aktif | Dipakai checklist |
| `lib/platforms/threads.ts` | Validasi karakter Threads | MVP | Aktif | Batas 500 karakter |
| Hook `useCharCount` | Penghitung karakter | MVP | Aktif | Custom |
| Autosave (debounce 10 detik) | Simpan otomatis | MVP | Aktif | UI Spec 5.3 |
| TipTap | Editor kaya | - | Ditunda | Textarea untuk MVP |

## 3. Provider AI

| Item | Peran | Fase | Status | Catatan |
|---|---|---|---|---|
| Gemini 2.5 Flash-Lite | Chat, visi (utama) | MVP | Aktif | ADR 0001, ADR 0002. Harga belum diverifikasi (P1, P8) |
| Gemini 3.1 Flash-Lite | Chat (naik kelas) | MVP | Opsional | Jika kualitas kurang |
| Gemini TTS | Voice-over | 4.5 | Aktif | Harga belum diverifikasi (P8) |
| Groq | Chat cadangan pertama, transkripsi | MVP | Aktif | ADR 0002. Tidak menerima gambar di semua model |
| OpenRouter | Chat cadangan kedua | MVP | Opsional | Model berlabel gratis |
| DeepSeek atau MiMo | Chat cadangan berbayar | MVP | Opsional | Perlu saldo kecil |
| Google AI Studio | Akses API Gemini yang sama | - | Ditolak sebagai fallback | Vendor sama dengan Gemini. Tetap dipakai sebagai tempat membuat API key |
| ElevenLabs | TTS cadangan | 4.5 | Opsional | Kuota gratis bulanan |
| Edge TTS | TTS cadangan | 4.5 | Opsional | |
| Cloudflare Workers AI | Cadangan chat atau TTS | - | Belum diverifikasi | Kuota 10.000 Neuron per hari. Model dan kualitas belum dicek |
| Pollinations.AI | - | - | Ditolak | Data produk tidak bisa dikontrol. Jangan dipakai untuk prompt berisi data produk atau foto |
| FreeLLMAPI | Router pengembangan lokal | Pengembangan | Belum diverifikasi | Hanya lokal. Periksa repo, lisensi, dan pengiriman data sebelum dipakai |

## 4. Tools media

| Item | Peran | Fase | Status | Catatan |
|---|---|---|---|---|
| Caesium | Kompresi foto massal | 4.5 | Manual | Di luar aplikasi. Di aplikasi tetap kompresi browser |
| Kompresi foto di browser (Canvas) | Kompresi sebelum upload | MVP | Aktif | Sisi 1080 px, WebP. Library opsional `browser-image-compression` |
| rembg | Hapus background | 4.5 | Opsional | Default mati. Butuh Python dan CPU cukup. ADR 0003 |
| HyperFrames | Render HTML jadi MP4 (jalur B) | 4.5 | Opsional | Default mati. Chromium stabil. Lisensi Apache 2.0 (dicek) |
| VoiceStudio | TTS dan voice cloning lokal | 4.5 | Opsional | Default mati. Suara harus punya hak pakai |
| HandBrake | Kompresi video final | 4.5 | Manual | Di luar aplikasi |
| OpenMontage | Pembuat video AI | - | Belum diverifikasi | Link di daftar tidak lengkap. Bisa tumpang tindih dengan Google Flow |
| Voicebox | Alternatif TTS | - | Belum diverifikasi | Link di daftar tidak lengkap. Bersaing dengan provider TTS yang ada |
| Google Flow | Pembuat video AI (jalur A) | MVP, 4.5 | Manual | Dijalankan user, sesuai F7 |

## 5. Posting dan integrasi

| Item | Peran | Fase | Status | Catatan |
|---|---|---|---|---|
| Manual (salin utas) | Posting default | MVP | Aktif | Selalu tersedia (F8) |
| Clipboard API | Salin utas | MVP | Aktif | Harus dipicu klik langsung, fallback disiapkan |
| Threads Web / App | Tujuan posting manual | MVP | Aktif | Tidak ada fitur draft di aplikasi, jadi "Salin dari Bank Konten" |
| Threads API (Meta Developer) | Auto-posting | Fase 7 | Ditunda | Butuh review Meta dan OAuth terpisah. Token disimpan di server |
| Buffer atau Metricool | Scheduler hosted | Fase 6 | Opsional | Dicek dukungan Threads sebelum dipakai |
| Postiz atau Mixpost | Scheduler self-host | Fase 6 | Opsional | Butuh VPS, Docker, database, dan Redis. Pilih salah satu |
| social0-oss | Multi-platform API | - | Belum diverifikasi | Link tidak lengkap |
| Skyvern | Scraping dinamis berbasis AI | - | Ditolak | Bertentangan dengan K5 dan risiko ToS |
| Browser-Use | Otomasi browser berbasis AI | - | Ditolak | Berisiko melanggar ketentuan layanan |
| Playwright | Scraping sederhana | - | Ditunda | Hanya jika K5 berubah |

## 6. Analitik, log, dan testing

| Item | Peran | Fase | Status | Catatan |
|---|---|---|---|---|
| Tabel `generations` | Log AI, biaya, token | MVP | Aktif | Menggantikan `ai_logs` |
| Cache analisis (hash + Supabase) | Hindari analisis ulang | MVP | Aktif | `analysis_cache`. Cache ide belum ada di skema |
| Preview biaya agregat | Total biaya per bulan | Fase 5 | Aktif | Query `sum(biaya_usd)` dari `generations` |
| Recharts (via shadcn Chart) | Grafik performa | Fase 6 | Ditunda | Tabel ringkas dulu |
| View analitik Supabase | Agregat per angle dan hook | Fase 6 | Aktif | Wajib `security_invoker` atau RLS |
| Form tracking manual | Input klik dan komisi | MVP | Aktif | Lewat aplikasi, bukan Table Editor |
| Vitest | Unit test | MVP | Aktif | Rencana bagian 6 |
| Playwright (E2E) | Tes end-to-end | Fase 5 | Opsional | |
| gitleaks | Cegah kebocoran key | MVP | Opsional | Pre-commit atau CI |

## 7. Pengembangan

| Item | Peran | Fase | Status | Catatan |
|---|---|---|---|---|
| Cursor atau OpenCode | AI IDE | MVP | Aktif | Membaca `AGENTS.md` |
| `AGENTS.md` | Aturan AI coding | MVP | Aktif | Satu sumber, tidak ada file aturan lain |
| `prompts/` (.md dengan versi) | Manajemen prompt | MVP | Aktif | |
| Golden set | Uji kualitas prompt | MVP | Aktif | `golden/` |

## 8. Biaya

| Item | Biaya | Catatan | Terverifikasi |
|---|---|---|---|
| Supabase | Rp 0 | Free tier, batas bisa berubah | Belum (P3) |
| Vercel | Rp 0 | Free tier, untuk pemakaian pribadi | Belum (P4) |
| Groq | Rp 0 | Free tier | Belum (P8) |
| Google AI Studio / Gemini | Rp 0 (free tier) | Berbayar di atas kuota. Perkiraan sekitar Rp 50 per batch 4 konten, belum diverifikasi | Belum (P1, P8) |
| Cloudflare Workers AI | Rp 0 | 10.000 Neuron per hari, belum diverifikasi | Belum |
| Pollinations.AI | - | Ditolak untuk data produk | - |
| Domain (opsional) | ~Rp 12.500 per bulan | Rp 150.000 per tahun, bisa ditunda ke Fase 4 | - |
| VPS (opsional) | Belum ada angka | Untuk Postiz, Mixpost, atau tools lokal dari Vercel | Belum |
| Total MVP | Rp 0 | Berlaku jika tetap di free tier | Belum |

## 9. Keputusan yang masih terbuka

| No | Pertanyaan | Terkait |
|---|---|---|
| K1 sampai K7 | Lihat `docs/keputusan.md` | Produk |
| K8 | Arah MVP Threads-only dengan arsitektur multi-platform | Platform |
| K9 | Nama produk | Branding |
| K10 | Platform tahap kedua | Platform |
| K11 | Marketplace tahap pertama | Marketplace |
| Q1 | Peran Groq: cadangan atau utama | ADR 0001 vs 0002 |
| Q2 | Job queue: ditunda sampai kapan | Workflow |
| Q3 | HyperFrames (jalur B) masuk Fase 4.5 atau setelahnya | Jalur video |
| Q4 | TTS untuk VO: Gemini TTS atau VoiceStudio | ADR 0003 |
| Q5 | Textarea atau TipTap | UI |
| Q6 | Verifikasi link OpenMontage, Voicebox, social0-oss, jalari | Tools |
