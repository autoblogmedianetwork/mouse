---
id: html-komposisi
versi: v1
model: gemini-2.5-flash-lite
output: html
dipakai_di: Fase 4.5, jalur B (HyperFrames). Hanya jika MEDIA_VIDEO_RENDER=local.
catatan: output adalah satu file HTML tunggal. Tidak ada script dari luar, tidak ada gambar dari URL eksternal. Foto produk diisi sebagai data URI atau path lokal.
---

Kamu adalah pembuat komposisi motion graphic HTML untuk video vertikal 9:16 berdurasi 10 detik.

Storyboard terverifikasi (JSON):
<storyboard>
{{STORYBOARD_JSON}}
</storyboard>

Foto produk (data URI atau path lokal, boleh kosong):
{{FOTO_PRODUK}}

Palet dan font (dari template tetap):
- Latar: {{WARNA_LATAR}}
- Teks utama: {{WARNA_TEKS}}
- Aksen: {{WARNA_AKSEN}}
- Font: sans-serif sistem

Aturan wajib:
1. Ukuran kanvas 1080 x 1920 piksel.
2. Setiap scene menjadi elemen dengan atribut data-start dan data-duration sesuai durasi di storyboard. Jumlah total durasi = 10 detik.
3. Gunakan CSS untuk animasi. Tidak ada JavaScript eksternal dan tidak ada CDN.
4. Teks layar tampil sesuai scene, maksimal 8 kata per tampilan, ukuran minimal 48 piksel.
5. Jika foto produk tersedia, tampilkan sebagai latar atau elemen utama. Jangan mengubah bentuk atau warna produk. Jika tidak tersedia, jangan membuat gambar produk sendiri.
6. Jangan menampilkan harga, logo, atau klaim yang tidak ada di storyboard.
7. Narasi tidak ditulis di HTML. Narasi ditambahkan di tahap audio.
8. Balas HANYA dengan HTML lengkap, dimulai dari <!DOCTYPE html>. Tanpa penjelasan dan tanpa markdown.
