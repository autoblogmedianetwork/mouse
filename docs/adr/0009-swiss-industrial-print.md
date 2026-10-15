# ADR 0009: Bahasa visual Swiss Industrial Print di seluruh aplikasi

Tanggal: 16 Oktober 2026 · Status: diterima

## Konteks

Halaman masuk dirancang dengan bahasa visual Swiss Industrial Print
(garis tegas 90 derajat, tipografi struktural raksasa, metadata monospace)
dan hasilnya dianggap pas untuk identitas produk. Sisa aplikasi masih
memakai bentuk membulat (`rounded-xl`, pill) sehingga terasa dua keluarga
desain berbeda.

## Keputusan

1. **Satu bahasa visual untuk semua halaman**, ditegakkan lewat sumber
   bersama, bukan suntikan per halaman:
   - token global di `app/globals.css`: `border-radius: 0` dan tanpa
     `box-shadow` untuk semua elemen (menimpa kelas radius mana pun);
   - komponen inti direstyle: `AppShell`, `PageHeader`, `StatCard`,
     `StatusBadge`, `EmptyState`.
   Halaman yang memakai komponen ini berubah otomatis.
2. **Skema warna tidak diubah.** Token existing (oranye primary, abu
   netral, warna status) tetap; yang berubah hanya bentuk, tipografi
   (mono uppercase untuk metadata, judul hitam berat dengan tracking
   negatif), dan garis pembatas 1px/2px.
3. **Aksen ASCII dipakai pada label statis** (`[ KOSONG ]`, `>>>`), dan
   teks `///` selalu diletakkan di akhir string JSX agar tidak terbaca
   sebagai komentar oleh `react/jsx-no-comment-textnodes`.
4. Rujukan gaya: dokumen skill "industrial-brutalist-ui" (arketipe Swiss
   Industrial Print) — dipilih arketipe terang, bukan memadukan dua
   arketipe dalam satu antarmuka.

## Konsekuensi

- Kelas `rounded-*` di file fitur tidak perlu dihapus satu per satu;
  token global menimpanya. Bentuk khusus baru harus menimpa secara
  eksplisit dan diberi alasan.
- Ikon/emoji dan elemento gambar tidak terpengaruh (hanya radius/shadow).
- Kalau nanti perlu varian bentuk membulat (mis. avatar), buat token
  khusus — jangan menimpa token global.
