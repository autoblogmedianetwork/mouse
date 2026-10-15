# Fitur Pengingat (feedback Claude #2)

Sumber masalah: affiliate mengeluh alat ini pasif — tidak ada pengingat untuk
posting jam berapa, produk mana yang belum diangkat, atau konten mana yang
sudah lama ditinggal di draft. Padahal konsistensi lebih menentukan daripada
kualitas tulisan. Fitur ini menutup bagian pengingat dalam MVP: notifikasi di
aplikasi (dashboard), tanpa email atau push — itu jalur lanjutan jika
dibutuhkan.

## Bagian yang ditutup

| Aturan pengingat | Sumber data | Tampilan |
|---|---|---|
| `jadwal_lewat` | `contents.status = 'terjadwal'` dan `jadwal_at` sudah berlalu | Paling atas, rona gagal |
| `jadwal_hari_ini` | terjadwal, `jadwal_at` di hari lokal ini | Jam di tampilkan pukul HH.mm |
| `jadwal_minggu_ini` | terjadwal, besok sampai 7 hari ke depan | Nama hari + tanggal |
| `draft_pustaka` | status `draft` atau `siap_posting`, `updated_at` ≥ 3 hari | "Draft/Siap posting di pustaka, tidak diubah N hari" |
| `draft_kerja` | draft di halaman Buat posting (`autothreads-draft-posting`) ≥ 3 hari | Tombol "Lanjutkan" |

Konten terkirim, gagal, ditolak, dan arsip tidak menimbulkan pengingat. `gagal`
dan `ditolak` sudah punya tab sendiri di Antrian review, arsip dikecualikan
sesuai K3.

## Komposisi kode

| Berkas | Isi |
|---|---|
| `lib/konten/pengingat.ts` | Aturan penilaian (fungsi murni), tanpa storage |
| `lib/konten/pengingat.test.ts` | Test aturan: urutan jenis, jadwal lewat/hari ini/7 hari, draft ≥ 3 hari, dismiss |
| `features/pengingat/panel-pengingat.tsx` | Panel UI di dashboard; dismiss harian di localStorage |
| `app/(dashboard)/ringkasan-dashboard.tsx` | Menyalakan panel di atas kartu ringkasan |

## Perilaku penting

1. **Disabel per hari.** Tombol "Tutup" menyimpan `{ id: "YYYY-MM-DD" }` ke
   localStorage (`autothreads-pengingat-ditutup`). Item tidak muncul lagi di
   hari yang sama, tetapi besok muncul kembali — pengingat tetap tidak bisa
   hilang selamanya.
2. **Urutan tetap.** Lewat > hari ini > minggu ini > draft, bukan urutan
   pustaka, supaya jadwal terlewat selalu terlihat dulu.
3. **Id stabil.** `jenis:id` supaya target dismiss tidak salah meski judul
   konten diedit.
4. **Tanpa perubahan status.** Membuka dari pengingat tidak mengubah konten;
   aksi kirim atau pindah jadwal tetap lewat halaman asalnya (F0: tidak ada
   `siap_posting`/kirim tanpa aksi user).

## Setelahnya

- Daftar produk yang lama tidak diposting (feedback Claude #4/Sedang) —
  sambung dari pengingat yang sama, sumbernya riwayat `terkirim` di pustaka.
- Email atau notifikasi harian terjadwal menunggu infrastruktur pengirim
  (mis. cron server); disimpan di keputusan, bukan bagian MVP ini.
