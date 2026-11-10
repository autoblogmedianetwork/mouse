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
| Kalkulator komisi & target cuan | `lib/affiliate/kalkulator-komisi.ts`, dashboard |
| Pembangkit hashtag lokal | `lib/konten/hashtag.ts`, `/lab` bagian 4 |
| Kemasan 1 konten → Threads + TikTok + WA | `lib/konten/kemasan-multi-platform.ts`, `/antrian` |
| Kamus kata terlarang | `lib/konten/kata-terlarang.ts`, `StatusEditor` |
| Mesin ide dari bank masalah (AI) | `/lab` bagian 2, `app/api/ide-masalah` |
| Serial 7 hari (AI) | `/lab` bagian 3, `app/api/serial-7-hari` |
| Lab uji / simulator 3 pembeli (AI) | `/lab` bagian 1, `app/api/lab-uji` |

## 2. Baru separuh

- **Persona konsisten bernama.** Persona AI sudah ada (`lib/ai/persona.ts`) dan
  dipakai prompt generate, tetapi belum ada "karakter" bernama dengan gaya bicara
  tetap yang dipakai di semua konten.
- **Detektor "bakal kena shadowban".** Kata terlarang sudah menandai klaim dan
  pelanggaran UI, tetapi belum ada skor gabungan (hashtag agresif, klaim medis,
  panjang caption) dengan lampu merah sebelum salin.

## 3. Belum dibuat — lokal, tanpa API (prioritas berikutnya)

1. **Peta panen komisi** — heatmap hari/jam dari data performa yang sudah diimpor.
2. **A/B manual 5 varian hook** + pencatatan pemenang di Analitik.
3. **Batch generate 3–5 produk** (butuh antrean job; tetap review satu-satu).

## 4. Belum dibuat — butuh kunci AI hidup

- A/B otomatis dua hook dengan pencatatan pemenang.
- Serial 30 hari (sekarang baru 7 hari).
- Roulette produk, battle mode, ghostwriter dari voice note, mirror competitor.
- Gamifikasi (poin/level), time capsule, notifikasi proaktif.
- "AI kembaran jujur": profil kelemahan dari konten lama, deteksi kebohongan
  klaim vs deskripsi produk, neural link gaya pribadi.
- Mode nyanyian, paralel universe, konten dari foto, lawan bots.

Catatan: semua jalur AI di repo ini memakai `AI_BASE_URL` / `AI_API_KEY` /
`AI_MODEL` di server. Selama kunci masih mati (401), fitur AI akan menjawab 502
dengan pesan provider — bukan hasil palsu.

## 5. Menunggu tindakan user (bukan pekerjaan kode)

- Jalankan `supabase/migrations/0013_skor_peluang.sql` di Supabase SQL Editor.
- Uji visual fitur Fase 3–5 di browser.
- Ganti 10 produk dummy golden set dengan produk nyata.
- Ganti kunci AI yang hidup sebelum memakai `/lab`.
