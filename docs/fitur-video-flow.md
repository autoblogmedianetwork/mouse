# Fitur: Prompt video (storyboard ChatGPT + Google Flow)

Halaman: `/video`. Keputusan teknis: ADR 0018.
Template asal: `prompts/04-storyboard-json.md` (storyboard, v1) dan
`prompts/07-prompt-foto-ke-video.md` (prompt Flow, v1).

## Prinsip

- **Aplikasi tidak memanggil AI dan tidak membuat video.** Yang keluar hanya
  teks untuk disalin.
- Semua hasil berstatus **draft**; video baru dianggap selesai setelah user
  melewati dua checkpoint.
- Produk tidak boleh berubah bentuk, warna, atau isi paket di setiap klip.

## Alur

| Langkah | Yang dilakukan | Di mana |
|---|---|---|
| 1 | Isi nama produk, varian, ringkasan, angle, hook, durasi, jumlah scene | `/video` bagian 1 |
| 2 | Salin prompt storyboard | ChatGPT |
| 3 | Tempel balasan JSON ChatGPT, periksa tabel scene + peringatan | `/video` bagian 3 — **checkpoint 1** |
| 4 | Salin prompt per scene (atau "Salin semua prompt") | Google Flow |
| 5 | Bandingkan tiap klip dengan foto asli, isi checklist, tempel link video | `/video` bagian 5 — **checkpoint 2** |
| 6 | Simpan sebagai draft | Arsip video di `/video` |

## Aturan yang dijaga kode

| Aturan | Di mana |
|---|---|
| JSON harus bisa diurai, punya minimal satu scene, tiap scene punya deskripsi visual, durasi > 0 | `lib/video/storyboard.ts` |
| Jumlah scene 3–5, total durasi scene = durasi total, teks layar ≤ 8 kata, narasi ≤ 2 kata/detik, nomor scene tidak dobel | peringatan di `lib/video/storyboard.ts` |
| Setiap prompt Flow memuat kunci produk + larangan harga/klaim/logo | `lib/video/prompt-flow.ts` |
| Prompt Flow tidak bisa disalin sebelum checkpoint 1 | `features/video/alur-video.tsx` |
| Draft tidak bisa disimpan sebelum checklist lengkap | `lib/video/store.ts` |

Teks JSON dari ChatGPT boleh memakai nama kolom template lama
(`deskripsi_visual`, `kamera`, `id`, `durasi`) — dinormalkan otomatis.

## Checklist sebelum video dipakai

- [ ] Produk di tiap klip sesuai foto (bentuk, warna, isi paket).
- [ ] Tidak ada harga, diskon, atau klaim yang tidak ada di listing.
- [ ] Hook muncul dalam 3 detik pertama.
- [ ] Ada tanda visual dibuat AI dan disclosure affiliate.

## Batasan

- Cerita storyboard bergantung pada model ChatGPT yang dipakai; aplikasi hanya
  memeriksa bentuk dan batas gaya.
- Konsistensi produk antar klip tidak bisa dipaksakan oleh teks. Klip yang
  meleset harus digenerate ulang.
- Arsip video disimpan di `localStorage` browser, bukan di database.
