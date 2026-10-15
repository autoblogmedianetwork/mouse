# Fitur: Mode Kerja, Antrian Review, dan Kontrol Biaya

**Versi:** 0.1
**Acuan:** PRD F5, F8, F0 (draft-first), UI-Spec 3.x, AGENTS.md aturan 4
**Status keputusan:** menunggu K12 sampai K14 di `docs/keputusan.md`

Dokumen ini menambahkan pola kerja dari referensi Jimmi Studio yang kami setujui: mode kerja, antrian review dengan tab, skor ide dengan ambang, dan kontrol biaya AI. Semua tetap tunduk pada aturan draft-first.

---

## 1. Mode kerja

Mode kerja diatur per akun di Pengaturan. Nilai default adalah `manual`.

| Mode | Kode | Yang dilakukan AI | Yang dilakukan user | Fase |
|---|---|---|---|---|
| Manual | `manual` | Tidak ada generate otomatis | Memilih produk, ide, dan generate sendiri | MVP |
| Semi-otomatis | `semi` | Pada setiap slot jam aktif, membuat draft dari ide dengan skor tertinggi di atas ambang | Meninjau draft di Antrian review | Fase 5 |
| Otomatis penuh | `penuh` | Sama seperti semi, ditambah menjadwalkan konten yang lolos checklist ke slot berikutnya | Bisa menjeda, membatalkan jadwal, atau menolak | Fase 7, opsional |

### 1.1 Aturan per mode

**Manual**
- Tidak ada job terjadwal yang membuat konten.
- Semua aksi dimulai user.

**Semi-otomatis**
- Hanya berjalan pada jam aktif (`jam_aktif_mulai` sampai `jam_aktif_selesai`).
- Setiap `interval_cek_menit`, sistem memeriksa produk yang ditandai "aktif" oleh user dan membuat draft untuk ide terbaik, dengan batas `maks_draft_otomatis_per_hari`.
- Hasil selalu `draft`. Tidak ada posting.
- Produk yang belum punya analisis tidak diproses otomatis. Analisis tetap manual, supaya biaya dan kualitas terkendali.

**Otomatis penuh**
- Semua aturan semi berlaku.
- Konten yang checklist-nya lolos dan ditandai user sebagai "boleh otomatis" masuk antrean `terjadwal`, lalu dikirim oleh provider posting pada slot berikutnya.
- Tombol "Jeda semua" di header menghentikan semua job terjadwal seketika.
- Mode ini tidak aktif sampai provider posting yang dipakai sudah lolos uji (Fase 7).

### 1.2 Konflik dengan draft-first (perlu keputusan K12)

AGENTS.md aturan 4 menyatakan bahwa tidak ada `siap_posting` tanpa aksi user. Mode otomatis penuh bertentangan dengan aturan ini.

Dua pilihan:
- **Opsi A (usulan):** mode penuh tetap memerlukan aksi user sekali di awal, berupa persetujuan "boleh otomatis" per produk atau per batch. Setelah itu sistem bisa mengirim sendiri, tapi hanya untuk konten yang sudah disetujui dan lolos checklist.
- **Opsi B:** mode penuh tidak dibuat. Mode semi sudah cukup untuk pemakaian pribadi.

Sampai K12 diputuskan, mode `penuh` tidak diimplementasikan.

---

## 2. Pengaturan mode kerja

| Parameter | Kode | Default | Rentang | Catatan |
|---|---|---|---|---|
| Mode kerja | `mode_kerja` | `manual` | manual, semi, penuh | Lihat bagian 1 |
| Ambang skor | `ambang_skor` | 70 | 0 sampai 100 | Ide di bawah nilai ini tidak dibuat draft otomatis |
| Skor prioritas | `skor_prioritas` | 85 | 0 sampai 100 | Ide di atas nilai ini didahulukan |
| Maks draft otomatis per hari | `maks_draft_otomatis_per_hari` | 3 | 1 sampai 10 | Membatasi biaya dan banjir draft |
| Jam aktif mulai | `jam_aktif_mulai` | 07:00 | 00:00 sampai 23:59 | Zona waktu WIB |
| Jam aktif selesai | `jam_aktif_selesai` | 22:00 | 00:00 sampai 23:59 | Di luar jam ini, tidak ada job otomatis |
| Interval cek | `interval_cek_menit` | 30 | 15 sampai 240 | Frekuensi pemeriksaan antrean otomatis |
| Batas biaya bulanan | `AI_MONTHLY_BUDGET_USD` | 5 | sesuai K6 | Panggilan AI berhenti saat tercapai |

Nilai default di atas hanya contoh awal. Angka pasti ditentukan setelah golden set pertama berjalan.

Parameter disimpan di `settings.data` (lihat `docs/skema-database.md`). Tidak perlu tabel baru.

---

## 3. Skor ide (prompt 02 v2)

Setiap ide diberi skor 0 sampai 100 oleh AI, dengan empat kriteria:

| Kriteria | Bobot | Yang dinilai |
|---|---|---|
| Relevansi produk | 30 | Seberapa kuat ide terhubung dengan fitur nyata produk |
| Kebaruan angle | 25 | Apakah angle berbeda dari ide lain dalam batch yang sama |
| Potensi hook | 25 | Seberapa kuat judul menahan perhatian 3 detik pertama |
| Kepatuhan klaim | 20 | Apakah ide menghindari klaim yang tidak bisa dibuktikan |

Aturan kalibrasi:
- Skor AI dibandingkan dengan penilaian manual di golden set sebelum dipakai untuk mode semi.
- Jika korelasi rendah (di bawah kesepakatan cukup dari 10 produk), mode semi tidak diaktifkan.
- Versi prompt disimpan (`prompts/02-ide-konten.v2.md`), dan versi lama tidak diubah.

---

## 4. Antrian review

Halaman ini menggantikan tampilan sederhana di Pustaka konten dengan tab status.

| Tab | Status database | Aksi yang tersedia |
|---|---|---|
| Perlu review | `draft` | Edit, tandai siap, tolak, hapus |
| Disetujui | `siap_posting` | Salin, jadwalkan (Fase 7), kembalikan ke draft |
| Terjadwal | `terjadwal` | Batalkan jadwal |
| Gagal posting | `gagal` | Coba lagi, salin manual |
| Sudah posting | `terkirim` | Lihat, duplikat |
| Ditolak | `ditolak` | Pulihkan ke draft, hapus |

Catatan:
- Status `ditolak` belum ada di enum `content_status`. Tambahkan lewat migrasi baru (draft di `docs/skema-database.md` bagian 8).
- Setiap tab menampilkan jumlah konten di dalamnya.
- Di mode semi atau penuh, konten yang dibuat otomatis diberi label "Otomatis" supaya mudah dibedakan.
- Setiap kartu menampilkan skor ide, produk, tanggal, dan letak link.

---

## 5. Kontrol biaya di header

Widget kecil di header menampilkan:
- Biaya AI hari ini (USD dan perkiraan rupiah)
- Biaya AI bulan ini
- Progres terhadap batas bulanan (misalnya 9 persen dari $5)

Sumber data: `sum(biaya_usd)` dari tabel `generations`, dikelompokkan per hari dan bulan.

Peringatan:
- Pada 80 persen dari batas, tampil peringatan kuning.
- Pada 100 persen, panggilan AI berhenti dan tombol generate dinonaktifkan dengan pesan jelas.

---

## 6. Masa berlaku token (Fase 7)

Saat akun Threads terhubung lewat Threads API, Pengaturan menampilkan:
- Status koneksi: terhubung, akan kedaluwarsa (kurang dari 7 hari), kedaluwarsa
- Tanggal kedaluwarsa token
- Tombol "Hubungkan ulang" dan "Putuskan"

Data disimpan di tabel `threads_accounts` (rencana migrasi 0002): kolom `token_kedaluwarsa_at`, `status_koneksi`, dan `terakhir_diperbarui_at`. Token sendiri disimpan terenkripsi di server.

---

## 7. Urutan implementasi

| Fase | Fitur |
|---|---|
| MVP (M1 sampai M3) | Tab antrian review (tanpa mode otomatis), widget biaya di header, parameter jam aktif dan batas harian disimpan tapi belum dipakai |
| Fase 2 sampai 3 | Skor ide dengan prompt 02 v2, dikalibrasi di golden set |
| Fase 5 | Mode semi-otomatis dengan job terjadwal, setelah pemakaian pribadi stabil |
| Fase 7 | Masa berlaku token, dan mode otomatis penuh jika K12 memilih opsi A |

Tiap fitur mengikuti Definition of Done di `docs/Rencana-Pengembangan-Heaviliate.md` bagian 7.
