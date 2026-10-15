# Glosarium: AutoThreads

Pemetaan istilah Indonesia (UI dan dokumen) ke nama kode. Pakai nama kode ini di semua file. Jangan mencampur bentuk lain seperti `statusList` atau `utas_status`.

| Istilah (UI) | Nama kode | Tabel / tipe | Catatan |
|---|---|---|---|
| Produk | product | `products` | Satu produk affiliate |
| Foto produk | media | `product_media` | Metadata; file ada di Storage |
| Analisis produk | analysis | `analysis_cache`, `analyze-product.ts` | Hasil JSON prompt 01 |
| Ide konten | idea | `ideas` | Satu dari 10 ide |
| Batch ide | idea batch | `idea_batches` | Kumpulan 10 ide per produk |
| Konten / utas | content | `contents` | Satu utas Threads hasil generate |
| Status (Threads) | status | `threads_statuses` | Satu pesan dalam utas, maks 500 karakter |
| Draft | draft | `content_status = 'draft'` | Default untuk semua konten baru |
| Siap posting | siap posting | `content_status = 'siap_posting'` | Hanya lewat aksi user dan checklist |
| Terjadwal | terjadwal | `content_status = 'terjadwal'` | Fase 6 ke atas |
| Terkirim | terkirim | `content_status = 'terkirim'` | Fase 7 ke atas |
| Gagal | gagal | `content_status = 'gagal'` | Posting atau generate gagal |
| Letak link | link placement | `link_placement` | `status_terakhir`, `balasan`, `tanpa_link` |
| Link affiliate | affiliate link | `affiliate_links` | Daftar link di halaman Link Affiliate |
| Klik | clicks | `contents.klik_manual` | Diisi manual |
| Komisi | commission | `contents.komisi_manual` | Diisi manual, rupiah |
| Template deskripsi | template | `templates` | Dengan placeholder `{{...}}` |
| Pengaturan generate | generate settings | `contents.pengaturan` (jsonb) | Jumlah status, panjang, instruksi, Anti AI Slop |
| Anti AI Slop | anti ai slop | `pengaturan.anti_ai_slop` | Aturan variasi dan dialog |
| Aturan kepercayaan | trust rule | `settings.data.wajib_kekurangan` | Wajib ada status yang menyebut batasan |
| Arsip | archive | `contents.is_arsip`, `arsip_at` | Dihapus setelah retensi (K3) |
| Pembersihan deskripsi | clean description | `products.deskripsi_bersih` | Maks 3.000 karakter |
| Foto referensi seller | seller reference | `product_media.is_referensi_seller` | Hanya referensi internal |
| Generate log | generation log | `generations` | Satu baris per panggilan AI |
| Biaya AI | ai cost | `generations.biaya_usd` | Dipakai untuk batas bulanan |
| Mode manual | manual mode | `posting_mode = 'manual'` | Default, salin utas |
| Mode auto | auto mode | `posting_mode = 'auto'` | Fase 7 (M6) |
| Scraping | scraping | `products.sumber = 'scraping'` | Nonaktif di MVP (K5) |
| Mode foto ke video | photo-to-video | `generations.jenis = 'foto_ke_video'` | F7.1 |
| Storyboard | storyboard | `generations.jenis = 'storyboard'` | F7, Template-Video-Affiliate.md |

## Aturan penamaan kode
- Nama tabel dan kolom: bahasa Indonesia, snake_case, sesuai tabel di atas.
- Nama fungsi dan tipe TypeScript: bahasa Inggris, camelCase atau PascalCase. Contoh: `generateStatuses`, `ThreadsPreview`.
- Nilai enum di database: snake_case Indonesia (`siap_posting`), bukan bahasa Inggris.
- Jangan menulis `status_list`, `statusList`, atau `utas_status`. Gunakan `threads_statuses` dan `generateStatuses`.

## Istilah tambahan (ADR 0002 dan 0003)

| Istilah (UI) | Nama kode | Tabel / tipe | Catatan |
|---|---|---|---|
| Provider chat | `AI_CHAT_PROVIDER` | env | OpenRouter utama (ADR 0006), bebas diganti |
| Base URL provider AI | `AI_BASE_URL` | env | Endpoint kompatibel OpenAI |
| Model provider AI | `AI_MODEL` | env | Nama model di `AI_BASE_URL` |
| Provider visi | `AI_VISION_PROVIDER` | env | Membaca gambar produk |
| Provider suara | `AI_TTS_PROVIDER` | env | Voice-over |
| Provider transkripsi | `AI_TRANSCRIBE_PROVIDER` | env | Opsional |
| Provider posting | `posting_provider` | `contents.posting_provider` | `manual`, `threads_api`, `buffer`, `metricool`, `postiz`, `mixpost` |
| Adapter | adapter | `lib/ai/*`, `lib/posting/*`, `lib/media/*` | Implementasi satu provider atau tool |
| Tool media | media tool | `lib/media/` | Rembg, HyperFrames, VoiceStudio, kompresi |
| Backend media | media backend | `MEDIA_*` env | `off`, `local`, `cloud`, `browser` |
| Fitur opsional | feature flag | `MEDIA_*`, `POSTING_PROVIDER` | Default `off` |
| Varian konten | content variant | `content_variants` (rencana migrasi 0002) | Satu versi konten per platform |
| Platform | platform | `platforms` (rencana) | Threads, Instagram, dan lainnya |
| Marketplace | marketplace | `marketplaces` (rencana) | Shopee, Tokopedia, TikTok Shop, dan lainnya |

## Istilah tambahan (fitur mode kerja dan carousel)

| Istilah (UI) | Nama kode | Tabel / tipe | Catatan |
|---|---|---|---|
| Mode kerja | `mode_kerja` | `settings.data` | `manual`, `semi`, `penuh` |
| Mode semi-otomatis | `semi` | - | Draft otomatis pada jam aktif |
| Mode otomatis penuh | `penuh` | - | Menunggu K12 |
| Ambang skor | `ambang_skor` | `settings.data` | Default 70 |
| Skor prioritas | `skor_prioritas` | `settings.data` | Default 85 |
| Jam aktif | `jam_aktif_mulai`, `jam_aktif_selesai` | `settings.data` | Zona WIB |
| Batas draft per hari | `maks_draft_otomatis_per_hari` | `settings.data` | Default 3 |
| Skor ide | `skor` dan `skor_rincian` | prompt 02 v2 | 0 sampai 100 |
| Antrian review | `ReviewTabs` | - | Tab status konten |
| Status ditolak | `ditolak` | `content_status` (migrasi baru) | Belum ada di enum |
| Carousel | carousel | `carousel_slides` (rencana) | 3 sampai 10 slide |
| Slide | slide | `carousel_slides` | Peran: cover, isi, atau cta |
| Renderer carousel | `MEDIA_CAROUSEL_RENDER` | env | off, local, cloud |
| Template carousel | template | `lib/carousel/templates/` | Template 1 sampai 3 |
| Widget biaya | `CostWidget` | `generations` | Biaya hari ini dan bulan ini |

## Istilah tambahan (persona dan prompt 03)

| Istilah (UI) | Nama kode | Tabel / tipe | Catatan |
|---|---|---|---|
| Persona | `persona` | `lib/ai/persona.ts`, `Pengaturan.persona` | `bawaan` (default), `sahabat`, `ahli` |
| Daftar persona | `PERSONA_LIST` | `lib/ai/persona.ts` | Data id, judul, deskripsi nada, ikon |
| Deskripsi nada | `deskripsi_nada` | `Persona` | Teks arah nada; ikut ke prompt 03 v2 |
| Prompt status v2 | `generate-status.v2` | `lib/ai/prompts/generate-status.v2.ts` | Menambah blok persona; v1 tidak diubah |
| Prompt status v3 | `generate-status.v3` | `lib/ai/prompts/generate-status.v3.ts` | Menambah parameter platform: batas 500 (Threads) atau 280 (X); fitur 9 |
| Prompt status v4 | `generate-status.v4` | - | Dipesan untuk format narasi 6 tahap (fitur 3) |

## Istilah tambahan (mode output platform, fitur 9)

| Istilah (UI) | Nama kode | Tabel / tipe | Catatan |
|---|---|---|---|
| Mode output | `mode_output` | `Pengaturan.mode_output` | `threads` (bawaan), `x`, `naskah_video` |
| Batas platform | `BATAS_PLATFORM` | `lib/platforms/batas.ts` | Threads 500, X 280; di kode (ADR 0008) |
| Batas mode | `batasKarakterMode` | `lib/platforms/batas.ts` | Dipakai editor, preview, dan validasi alur |
| Naskah video | naskah video | `naskahVideoSkema` | Tiga bagian (hook visual, fungsi produk, CTA), durasi 30 sampai 60 detik |
| Prompt naskah video | `naskah-video.v1` | `lib/ai/prompts/naskah-video.v1.ts` | Prompt 09; rute `/api/naskah-video` |
| Jenis generasi naskah video | `generations.jenis = 'naskah_video'` | migrasi 0007 | Memisah biaya di Widget biaya |

## Istilah tambahan (riwayat dari Supabase)

| Istilah (UI) | Nama kode | Tabel / tipe | Catatan |
|---|---|---|---|
| Riwayat hasil terakhir | `RiwayatSupabase` | `contents` + `threads_statuses` | 15 konten terakhir, dari Supabase bukan localStorage |
| Batas riwayat | `RIWAYAT_LIMIT` | `lib/konten/supabase-konten.ts` | 15 konten |
| Pemetaan konten | `kontenKeBaris`, `barisKeKonten` | `lib/konten/supabase-konten.ts` | Pemetaan murni, tanpa jaringan |
| Quick Capture | `bookmarkletQuickCapture` | `lib/impor/prefill.ts` | Bookmarklet, bukan ekstensi |
| Prefill produk | `prefill`, `PrefillProduk` | parameter `/posting/baru` | Base64url JSON, deskripsi maks 1.000 karakter |
| Batas deskripsi prefill | `MAKS_DESKRIPSI_PREFILL` | `lib/impor/prefill.ts` | 1.000 karakter |

