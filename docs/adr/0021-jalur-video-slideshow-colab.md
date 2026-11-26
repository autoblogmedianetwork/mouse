# ADR 0021: Jalur video slideshow — ekspor JSON bahan, render di Colab

Status: diterima
Tanggal: 2026-11-17

## Konteks

User meminta fitur bikin video yang cepat di spek laptopnya (AMD A9-9420e
2 core, RAM 8 GB — terverifikasi). Saran komunitas Threads adalah memakai
Google Colab. Kondisi yang ada:

- ADR 0018: aplikasi tidak memanggil AI untuk video dan tidak membuat
  video; keluaran hanya teks prompt (Google Flow).
- ADR 0003: tool media lokal (termasuk render video template HyperFrames)
  mati secara default; laptop low-end tidak sanggup render berat.
- Model AI video generatif (Wan, LTX) butuh GPU 8 GB+ — mustahil lokal,
  dan di Colab gratis butuh 5–10 menit per klip 5 detik: bertentangan
  dengan kebutuhan "cepat".

Format video affiliate yang terbukti konversi di Shopee/TikTok adalah
slideshow foto produk + teks hook + voiceover + caption — bukan klip AI.
Pipeline ini butuh CPU saja dan selesai dalam menit.

## Keputusan

1. Tambah **mode ketiga** di halaman `/video`: **"Mode slideshow (Colab)"**.
2. Aplikasi hanya **menyusun dan mengekspor satu blok JSON bahan**
   (`lib/video/bahan-slideshow.ts`): nama & harga produk, naskah per scene
   (1–6, satu baris satu scene), URL foto produk (boleh lebih sedikit dari
   scene; foto dipakai bergantian), pilihan suara, dan pengaturan keluaran
   (1080×1920, 30 fps, nama berkas).
3. **Render terjadi di notebook Colab**
   `docs/colab/heaviliate-slideshow.ipynb`: foto di-crop cover 9:16,
   zoom Ken Burns pelan, caption pita di bawah (harga ditampilkan), suara
   TTS Bahasa Indonesia via **edge-tts** (gratis, tanpa API key; suara
   `id-ID-ArdiNeural` / `id-ID-GadisNeural`), durasi scene mengikuti panjang
   audio, digabung jadi satu mp4.
4. Tanpa dependensi baru di aplikasi (pustaka hanya terpasang di Colab).
5. Unggah hasil ke Threads/Shopee tetap **manual** — tidak ada pengiriman
   otomatis (selaras Fase 7 / keputusan K12).

## Konsekuensi

- ADR 0018 tetap berlaku: aplikasi tidak merender video apa pun.
- ADR 0019 diwarisi: tanpa wajah/tubuh orang; produk tidak berubah bentuk
  karena foto yang dipakai adalah foto asli dari user.
- Batas scene 1–6 dan teks ≤220 karakter menjaga durasi total wajar
  (±8–40 detik) dan caption tetap terbaca di layar 9:16.
- edge-tts bergantung pada layanan Microsoft yang bisa berubah tanpa
  pemberitahuan; bila suatu saat mati, suara bisa diganti pustaka lain di
  notebook tanpa menyentuh aplikasi.
- Fallback bila Colab tidak tersedia: notebook yang sama bisa dijalankan
  lokal dengan Python + ffmpeg, tapi di laptop low-end estimasi render
  5–15 menit per video — Colab tetap jalur utama.
- IG caption dan Pinterest pin (usulan user) menunggu pipeline foto ini
  ada; dicatat di Bank Ide.
