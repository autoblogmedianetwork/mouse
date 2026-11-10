# Status Ide Fitur Heaviliate

Diperbarui: 11 November 2026 · Commit terakhir saat rekap: `b455998`

Berkas ini menjawab satu pertanyaan: dari daftar ide produktivitas, mana yang
sudah jadi, mana yang baru separuh, dan mana yang belum disentuh. Status "jadi"
berarti kode ada, ada test bila logikanya murni, dan sudah di-commit.

## 1. Sudah jadi

| Ide | Letak |
|---|---|
| Ekspor CSV antrian (BOM UTF-8, RFC 4180) | `lib/konten/ekspor.ts`, tombol di `/antrian` |
| Kalender posting manual | `/kalender`, `jadwal_at` di `lib/konten/skema.ts` |
| Template CTA pribadi (localStorage) | `lib/konten/snippet-cta.ts`, `StatusEditor` |
| Statistik dashboard: konten bulan ini | `app/(dashboard)/ringkasan-dashboard.tsx` |
| Statistik dashboard: komisi per marketplace & produk teratas | `features/impor/performa-ringkas.tsx` |
| Statistik bank masalah (total, bulan ini, kategori terbanyak) | `lib/riset/statistik-bank.ts` |
| Duplikasi konten | `lib/konten/store.ts` (`duplikatKonten`) |
| Quick capture produk (bookmarklet) | `features/posting/kartu-quick-capture.tsx` |
| Snippet teks khas | `lib/konten/snippet-cta.ts` |
| Checklist pra-posting | `features/posting/checklist-gate.tsx` |
| Pembersih sampel dummy 1-klik | `lib/konten/pembersih-dummy.ts`, Pengaturan → Data |
| Pengingat cadangan mingguan | `lib/konten/cadangan.ts`, `PengingatCadangan` |
| Pencarian global lintas konten/produk/masalah | `lib/cari/cari-global.ts`, halaman `/cari` |
| Riwayat pencarian riset (niche + audiens) | `lib/riset/riwayat-pencarian.ts`, `PanelRiset` |
| Favorit/pin produk | `lib/produk/favorit.ts`, form produk |
| Tag/label produk + filter | `lib/produk/tag.ts`, form produk |
| Mode fokus harian + streak | `lib/konten/fokus.ts`, halaman `/fokus` |
| Skor shadowban gabungan + lampu merah sebelum salin | `lib/konten/skor-shadowban.ts`, `/fokus` dan `/antrian` |
| Detektor shadowban menyeluruh (kata terlarang, klaim medis, hashtag, panjang) | `lib/konten/skor-shadowban.ts` |
| Persona konsisten bernama (karakter + gaya bicara tetap) | `lib/ai/persona.ts`, `pengaturan-generate.tsx` |
| A/B otomatis dua hook (AI) | `lib/ai/prompts/ab-hook.v1.ts`, `/api/ab-hook`, panel eksperimen hook |
| Ghostwriter dari transkrip | `lib/ai/prompts/ghostwriter.v1.ts`, `/api/ghostwriter`, lab |
| Roulette/battle gabungan produk | `lib/ai/prompts/battle.v1.ts`, `/api/battle`, lab |
| AI kembaran jujur (rewrite jujur) | `lib/ai/prompts/jujur.v1.ts`, `/api/kembaran-jujur`, lab |
| Mode paralel universe | `lib/ai/prompts/paralel.v1.ts`, `/api/paralel`, lab |
| Time capsule (lokal) | `lib/konten/time-capsule.ts`, lab |
| Mode nyanyian | `lib/ai/prompts/nyanyian.v1.ts`, `/api/nyanyian`, lab |
| Gamifikasi (XP/level/badge) | `lib/konten/gamifikasi.ts`, lab |
| Lawan bots (dialog debat) | `lib/ai/prompts/lawan-bots.v1.ts`, `/api/lawan-bots`, lab |
| Notifikasi proaktif (lokal) | `features/lab/notifikasi-proaktif.tsx` |
| Konten dari foto (visi) | `lib/ai/prompts/foto.v1.ts`, `/api/foto`, lab |
| Kalkulator komisi & target cuan | `lib/affiliate/kalkulator-komisi.ts`, dashboard |
| Pembangkit hashtag lokal | `lib/konten/hashtag.ts`, `/lab` bagian 4 |
| Kemasan 1 konten → Threads + TikTok + WA | `lib/konten/kemasan-multi-platform.ts`, `/antrian` |
| Kamus kata terlarang | `lib/konten/kata-terlarang.ts`, `StatusEditor` |
| Mesin ide dari bank masalah (AI) | `/lab` bagian 2, `app/api/ide-masalah` |
| Serial 7 hari (AI) | `/lab` bagian 3, `app/api/serial-7-hari` |
| Serial 30 hari (AI) | `/lab` bagian 3b, `app/api/serial-30-hari` |
| Lab uji / simulator 3 pembeli (AI) | `/lab` bagian 1, `app/api/lab-uji` |
| Peta panen komisi (hari × blok jam) | `lib/performa/peta-panen.ts`, `/analitik` |
| Eksperimen hook A/B manual (hingga 5 varian, pencatatan pemenang) | `lib/konten/eksperimen-hook.ts`, `/analitik` |
| Batch produk 3–5 (draft + antrean review satu per satu) | `lib/konten/batch-produk.ts`, `/batch` |

## 2. Baru separuh

_(kosong)_

## 3. Belum dibuat — lokal, tanpa API (prioritas berikutnya)

_(kosong — semua ide lokal sudah dibuat)_

## 4. Sudah dibuat — butuh kunci AI hidup untuk diuji

- A/B otomatis dua hook (`/api/ab-hook`), Roulette/battle (`/api/battle`),
  ghostwriter dari transkrip (`/api/ghostwriter`), lawan bots (`/api/lawan-bots`).
- AI kembaran jujur (`/api/kembaran-jujur`), mode nyanyian (`/api/nyanyian`),
  paralel universe (`/api/paralel`), konten dari foto (`/api/foto`).
- Gamifikasi, notifikasi proaktif, time capsule (lokal).
- Mirror competitor (manual, tanpa scraping) sudah dibuat (`/api/mirror`).
- Provider AI per user terenkripsi (opsi B) sudah dibuat (`/api/ai-provider`, Pengaturan).

Catatan: semua jalur AI di repo ini memakai `AI_BASE_URL` / `AI_API_KEY` /
`AI_MODEL` di server. Per 11 November 2026, kunci Sumopod sudah tersedia di
`.env.local` (lokal), sehingga fitur AI di `/lab` bisa diuji. Fitur di atas
masih belum diimplementasikan; kunci yang hidup tidak otomatis menandainya
selesai.

## 5. Menunggu tindakan user (bukan pekerjaan kode)

- Jalankan `supabase/migrations/0013_skor_peluang.sql` di Supabase SQL Editor.
- Uji visual fitur Fase 3–5 di browser.
- Ganti 10 produk dummy golden set dengan produk nyata.
- Ganti kunci AI yang hidup sebelum memakai `/lab`.
