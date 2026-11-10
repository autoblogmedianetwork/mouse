# ADR 0029: Eksperimen A/B hook manual dengan pencatatan pemenang

Status: diterima
Tanggal: 2026-11-10

## Konteks

Ide "A/B manual 5 varian hook + pencatatan pemenang di Analitik" (docs/status-ide.md
bagian 3.2) belum ada implementasinya. A/B otomatis (bagian 4) butuh kunci AI dan
posting otomatis, yang saat ini dilarang (AGENTS aturan 4: tidak ada `siap_posting`
tanpa aksi user). Jadi jalur yang aman adalah A/B manual: user menulis varian,
mempostingnya satu per satu, lalu mencatat pemenang dari data yang sudah diimpor.

## Keputusan

1. **Penyimpanan lokal.** Eksperimen disimpan di `localStorage` dengan kunci
   `autothreads-eksperimen-hook`, pola yang sama dengan snippet CTA. Tidak ada
   tabel Supabase baru — ini fitur pribadi dan data performanya juga masih lokal.
2. **Maksimum 5 varian, minimum 2.** Sesuai judul ide; varian wajib unik dan
   tidak boleh melebihi 500 karakter (panjang status Threads).
3. **Pemenang dicatat manual.** Field `pemenang` (indeks 0-based) dan
   `dicatat_pada`. User bisa membatalkan catatan. Tidak ada penentuan otomatis
   dari skor — data performa diimpor terpisah dan dicocokkan oleh user.
4. **Ringkasan agregat per slot** (0..4) dihitung murni di
   `ringkasanEksperimen()`, supaya pola "varian ke-1 vs varian ke-2" bisa dibaca
   setelah beberapa eksperimen selesai.
5. **Tidak menambah kolom ke `contents`.** Varian hook tidak disimpan per konten
   karena satu konten tidak selalu punya 5 varian, dan A/B manual lebih natural
   sebagai eksperimen tersendiri dengan nama sendiri.

## Konsekuensi

- Fitur ini tidak bergantung pada provider AI atau posting otomatis, jadi bisa
  dipakai sekarang.
- Data eksperimen tidak ikut bermigrasi ke Supabase nanti kecuali ditambah
  migrasi khusus; saat itu bentuknya sudah stabil (skema Zod).
- `validasiInput()` dan `ringkasanEksperimen()` bisa diuji tanpa DOM.
