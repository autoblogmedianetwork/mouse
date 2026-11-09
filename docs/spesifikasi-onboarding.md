# Spesifikasi Onboarding Heaviliate

**Versi:** 1.0 · **Tanggal:** 10 Nov 2026 · **Status:** terimplementasi (Fase 1, task C)
**Acuan:** Workflow v0.4 bagian 11, UI-Spec bagian "Tur awal untuk pemula"

---

## 1. Tujuan

User baru — terutama pemula yang belum pernah affiliate — harus paham cara kerja
aplikasi dan berhasil membuat konten pertamanya dalam 10 menit, tanpa perlu
membaca PRD atau bertanya. Tur menjawab tiga pertanyaan: ini apa, cara kerjanya
bagaimana, dan mulai dari mana.

## 2. Pemicu dan flag

- Tur tampil saat pertama kali membuka **dashboard** (`/`) setelah login.
- Flag `autothreads-onboarding-selesai` di localStorage (`features/onboarding/produk-contoh.ts`).
- **Setiap cara kelur menandai selesai** — tombol apa pun, tombol tutup dialog,
  maupun Esc — supaya tur tidak pernah menyebalkan.
- Pengecekan flag terjadi setelah mount (render kosong sebelumnya) untuk
  menghindari hydration mismatch; pola sama dengan draft posting.

## 3. Dialog 3 langkah (`features/onboarding/tur-awal.tsx`)

| Langkah | Isi | Tombol |
|---|---|---|
| 1 | Pengenalan: aplikasi mengubah produk menjadi konten siap posting; semua hasil AI berstatus **draft** sampai disetujui | Lanjut |
| 2 | Alur 4 langkah dengan bahasa sehari-hari: isi produk → AI analisis & ide → AI menulis, kamu edit → checklist wajib, lalu salin/kirim | Kembali / Lanjut |
| 3 | Pilihan mulai | Tiga aksi di bawah |

Langkah 3:

1. **"Coba dengan produk contoh >>>"** (tombol utama) — menulis draft berisi
   produk contoh ke localStorage, lalu membuka `/posting/baru` dengan Tahap 1
   sudah terisi.
2. **"Isi produk saya sendiri"** — langsung ke `/posting/baru` tanpa draft.
3. **"Jelajahi dulu"** — menutup tur, tetap di dashboard.

## 4. Produk contoh (`features/onboarding/produk-contoh.ts`)

- Produk fiktif "Contoh: Tumbler Stainless 500ml" — nama internal diawali
  **"Contoh:"** supaya mudah dikenali dan mudah dihapus user.
- Lolos `productFormSchema` (diuji di `produk-contoh.test.ts`): deskripsi >= 10
  karakter, tanpa link, tanpa hashtag, harga angka rupiah.
- Draft ditulis ke kunci `autothreads-draft-posting` — sama persis dengan
  `DRAFT_KEY` milik `alur-buat-posting.tsx` (ada test yang menjaga kesamaan ini).
- Sifat draft lainnya memakai default (`PENGATURAN_AWAL`), jadi user langsung
  menekan tombol analisis tanpa menyentuh pengaturan.

## 5. Aturan yang tetap dijaga

- Draft-first: produk contoh hanyalah **isi form**, bukan konten jadi.
- Tidak ada generate otomatis saat onboarding — user yang menekan tombol.
- Jalur manual tidak pernah tertutup: opsi "Isi produk saya sendiri" selalu ada.
- Tidak ada dependency baru; dialog memakai `<dialog>` native (pola ConfirmDialog).

## 6. Terkait: pengaturan lanjutan (Fase 1, task C)

Di Tahap 5, form pengaturan generate memilah dua tingkat:

- **Selalu terlihat (pemula):** mode output, panjang thread, jumlah status,
  panjang per status.
- **Di balik tombol "Pengaturan lanjutan" (default terlipat):** gaya pembuka,
  kerangka penulisan, gaya bahasa (persona), posisi link affiliate, instruksi
  tambahan, filter bahasa AI, wajib sebut kekurangan, disclosure.

Nilai default tetap aman dipakai tanpa membuka lipatan sama sekali.

## 7. Rencana penyempurnaan (belum diimplementasi)

1. Deteksi user lama: jika sudah ada draft atau produk tersimpan, tampilkan
   varian tur yang lebih pendek (1 langkah) — atau lewati sama sekali.
2. Tur per halaman opsional (tooltip mengikuti) untuk fitur lanjutan seperti
   video dan analitik.
3. Tautan "Lihat contoh hasil" ke konten sampel di langkah 2.
4. Ukur konversi: berapa persen user baru yang menekan "Coba dengan produk
   contoh" vs langsung menutup (butuh event analytics — keputusan terpisah).
