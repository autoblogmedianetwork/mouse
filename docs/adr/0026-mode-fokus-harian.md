# ADR 0026: Mode Fokus Harian dan Streak

Status: diterima
Tanggal: 2026-11-11

## Konteks

Pustaka konten bisa berisi puluhan draft, sehingga pertanyaan harian "hari ini
posting apa?" tidak terjawab oleh dashboard yang menampilkan angka total. Ide
"mode fokus harian" menutup celah ini, tetapi harus tetap menghormati aturan
proyek: tidak ada status berubah tanpa tindakan user (PRD F0).

## Keputusan

1. **Halaman `/fokus`** (menu "Fokus harian") menampilkan maksimal tiga item:
   - konten `terjadwal` yang jadwalnya hari ini, diurutkan dari jam paling awal;
   - lalu konten `siap_posting`, terbaru lebih dulu.
   Arsip, draft, dan status lain tidak ditampilkan.
2. **Tindakan** hanya dua: "Salin utas" (clipboard, tanpa mengubah data) dan
   "Tandai selesai" yang memanggil `tandaiTerkirim()` — jalur yang sama dengan
   penandaan manual di Antrian. Tidak ada penjadwalan atau pengiriman otomatis.
3. **Streak** disimpan di `autothreads-fokus-selesai` sebagai daftar tanggal
   lokal `YYYY-MM-DD` (maksimal 120 hari). Satu hari dihitung jika minimal satu
   konten ditandai selesai. Rentetan dihitung mundur; hari ini yang belum
   selesai tidak memutus rentetan (dihitung dari kemarin) supaya angka tidak
   jatuh ke nol hanya karena hari belum berjalan.
4. **Fungsi murni** di `lib/konten/fokus.ts` (`pilihFokus`, `catatHariSelesai`,
   `hitungStreak`, `tujuhHariTerakhir`) sehingga aturan bisa diuji tanpa DOM.

## Konsekuensi

- Tidak ada dependency baru dan tidak ada API; semua data tetap lokal.
- Streak adalah motivasi, bukan metrik bisnis: tidak dikirim ke server dan tidak
  memengaruhi status konten selain lewat aksi "Tandai selesai".
- Menandai selesai memindahkan konten ke tab "Sudah posting" di Antrian; user
  yang salah tekan bisa mengembalikannya lewat "Kembalikan ke draft".
