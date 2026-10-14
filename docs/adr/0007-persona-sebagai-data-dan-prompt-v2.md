# ADR 0007: Persona sebagai data dan prompt 03 versi v2

Status: diterima
Tanggal: Oktober 2026

## Konteks
Pilihan persona sudah ada di Pengaturan generate, tetapi opsinya ditulis langsung di komponen dan hanya judulnya yang dikirim ke prompt 03 ("Persona: Sahabat"). Akibatnya arah nada persona tidak pernah sampai ke model, dan setiap perubahan daftar persona berarti mengubah komponen UI.

Persona juga dipakai lintas dua tempat: form pengaturan dan rakitan prompt. Keduanya harus membaca sumber yang sama.

## Keputusan

1. Persona disimpan sebagai data di `lib/ai/persona.ts`, bukan hardcode di komponen. Satu persona punya `id`, `judul`, `deskripsi_nada`, dan `ikon`. Default dan fallback adalah `bawaan`.
2. `Pengaturan.persona` menyimpan `id` persona, bukan label. Nilai lama dari draf tersimpan ("Bawaan", "Sahabat", "Ahli") dinormalkan lewat `normalkanPersonaId`, baik saat skema Zod memvalidasi pengaturan maupun saat draf lokal dimuat.
3. Persona dimasukkan ke prompt 03 sebagai blok berisi judul dan deskripsi nada. Karena isi prompt 03 berubah, dibuat versi baru `generate-status.v2` (`lib/ai/prompts/generate-status.v2.ts` dan `prompts/03-generate-status.v2.md`). v1 tidak diubah.

## Alternatif yang ditolak
- **Tabel `personas` di Supabase.** Butuh migrasi dan CRUD, sementara belum ada kebutuhan persona yang bisa diedit user. Data di kode sudah cukup dan bisa ditinjau lewat review.
- **Menimpa `generate-status.v1`.** Melanggar aturan prompt bernomor versi: versi lama harus tetap bisa dibaca untuk membandingkan hasil.
- **Mengirim label nada sebagai nilai `pengaturan.persona`.** Membuat nilai tersimpan bukan lagi id, sehingga sulit dipakai untuk perbandingan atau analitik persona nanti.

## Konsekuensi
- Menambah atau mengubah persona cukup mengubah satu berkas data; UI dan prompt ikut otomatis.
- Nomor versi prompt 03 bergeser: fitur format narasi 6 tahap (N-3) memakai `generate-status.v3`, bukan v2 seperti yang tertulis di rencana fitur.
- Mengubah `deskripsi_nada` mengubah isi prompt v2. Perubahan berikutnya pada prompt 03 wajib memakai versi baru lagi, dan hasil versi baru sebaiknya dibandingkan dengan golden set.
