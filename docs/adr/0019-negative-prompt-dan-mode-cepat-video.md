# ADR 0019: Negative prompt, audio, dan mode cepat pada jalur video

Status: diterima
Tanggal: 2026-11-08

## Konteks

Setelah halaman `/video` dipakai, muncul alur kerja nyata dari komunitas
affiliate yang lebih ringkas:

> Buka Google Flow, pilih Gemini Omni, unggah produk, tulis satu prompt
> storyboard 10 detik 9:16 dengan 6 scene, sound effect, VO, bubble text, lalu
> minta ChatGPT membuat prompt video dari storyboard itu.

Dibanding prompt kita, alur itu punya dua hal yang lebih baik dan satu hal yang
berbeda arah:

1. **Negative prompt rinci** — melarang ikon keranjang kuning, tombol "klik
   keranjang", teks "check out", "stok habis", "sebelum kehabisan stock",
   kualitas rendah, wajah distorsi, warna/detail pakaian berubah. Ini mencegah
   pelanggaran platform, bukan sekadar soal estetika.
2. **Audio diminta eksplisit** — sound effect dan VO. Prompt kita menyimpan
   `suara_latar` di JSON tetapi membuangnya saat menyusun prompt Flow.
3. **Referensi wajah model 100% dari gambar unggahan** — ini yang justru tidak
   kita ikuti (lihat Keputusan 4).

## Keputusan

1. **Negative prompt menjadi konstanta** `NEGATIVE_PROMPT` di
   `lib/video/prompt-flow.ts` dan ikut di setiap prompt Flow maupun prompt
   cepat. Isinya bisa berubah di satu tempat.
2. **Audio diteruskan.** `suara_latar` dari storyboard menjadi baris
   `Sound effect: …`; narasi tetap menjadi VO dengan batas 2 kata per detik.
3. **Mode cepat ditambahkan** (`lib/video/prompt-cepat.ts`): satu prompt panjang
   gaya Gemini Omni — storyboard, audio, bubble text, negative prompt, langkah
   selanjutnya — untuk pemakaian cepat tanpa storyboard JSON. Mode JSON tetap
   ada dan tetap satu-satunya yang punya checkpoint 1 dan arsip.
4. **Tidak ada orang di video.** Prompt cepat dan prompt scene sama-sama
   melarang wajah/tubuh; interaksi dibatasi pada tangan. Alasan: memakai wajah
   orang lain tanpa izin berisiko, dan produk tetap bisa dijelaskan tanpa model.
5. **Jumlah scene dilonggarkan ke 3–6** (sebelumnya 3–5) karena alur cepat
   memakai 6 scene pendek. Di luar rentang itu tetap muncul peringatan.

## Konsekuensi

- Prompt Flow menjadi lebih panjang; itu wajar karena larangan platform harus
  eksplisit, dan Flow tidak bisa diandalkan menebak sendiri.
- Mode cepat tidak memvalidasi apa pun. Hasil video bisa lebih cepat jadi,
  tetapi klaim dan konsistensi produk sepenuhnya tanggung jawab user.
- Larangan ikon keranjang menurunkan peluang Flow menempelkan UI e-commerce,
  tetapi tidak menjamin. Pemeriksaan visual tetap wajib.
- Bila nanti ada kebutuhan menampilkan model, itu keputusan baru dengan ADR
  sendiri (menyangkut izin atas wajah).
