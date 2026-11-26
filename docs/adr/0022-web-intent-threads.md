# ADR 0022: Tombol "Buka di Threads" via web intent

Status: diterima
Tanggal: 2026-11-17

## Konteks

Alur publikasi Heaviliate selalu manual (Fase 4): salin teks, pindah
aplikasi, tempel. Riset 17 Nov (docs/RISET-REFERENSI-2026-11.md) menemukan
bahwa Meta menyediakan **web intent** resmi:
`https://www.threads.com/intent/post?text=...` — membuka komposer Threads
dengan teks sudah terisi. Tanpa API, tanpa App Review, tanpa token; di HP
membuka aplikasi Threads bila terpasang. User tetap yang menekan kirim.

## Keputusan

1. Tambah tombol **"Buka di Threads"** di setiap kartu Siap Salin
   (`lib/platforms/intent-threads.ts`).
2. Hanya parameter `text` yang dipakai. Parameter `url` (lampiran link di
   postingan utama) **sengaja dihindari** — strategi Heaviliate menaruh
   link affiliate di balasan, bukan di postingan utama.
3. Teks lebih dari batas Threads (500) atau kosong ditolak sebelum link
   dibangun, supaya komposer tidak membuka draft yang pasti gagal.
4. Enkole memakai `encodeURIComponent` (gaya `%20`, bukan `+`) sesuai
   contoh dokumentasi Meta.

## Konsekuensi

- Fase 4 tetap utuh: tidak ada pengiriman otomatis apa pun.
- Web intent tidak memberi data klik; atribusi tetap lewat tag Shopee.
- Bila Meta mengubah format intent, hanya satu berkas yang perlu diubah.
- Pengingat disclosure paid partnership ditambahkan di halaman yang sama
  (aturan konten berbayar Meta berlaku untuk link affiliate).
