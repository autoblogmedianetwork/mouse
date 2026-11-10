# ADR 0027: Skor Shadowban Gabungan dengan Lampu Merah Sebelum Salin

Status: diterima
Tanggal: 2026-11-11

## Konteks

Kamus kata terlarang (ADR 0020) hanya menandai satu jenis risiko pada satu
status di editor. Ide #32 meminta detektor gabungan "bakal kena shadowban"
yang menghitung empat faktor — kata terlarang, hashtag agresif, klaim medis,
dan panjang caption — dan menampilkan lampu merah sebelum user menyalin utas.
Risiko terbesar affiliate bukan sekadar kata kasar, tetapi pola konten yang
terkumpul: caption panjang penuh klaim + tagar hard-sell.

## Keputusan

1. **Fungsi murni** `hitungSkorShadowban(statuses)` di
   `lib/konten/skor-shadowban.ts`, tanpa API dan tanpa AI:
   - `kataTerlarang` (bobot 35) memakai ulang `periksaKataTerlarang()` dari
     ADR 0020 — tidak ada daftar kata kedua.
   - `klaimMedis` (bobot 30) memakai daftar frasa lokal
     ("menyembuhkan", "pasti sembuh", "tanpa efek samping", dll).
   - `hashtagAgresif` (bobot 20) memakai daftar tagar hard-sell/spam
     (`#stok_habis`, `#segera`, `#terbatas_waktu`, dll).
   - `panjangCaption` (bobot 15) menandai status di atas batas 500 karakter
     dari `MAX_STATUS_LENGTH` (validator-500), satu sumber kebenaran dengan
     PRD aturan 10.
   - Hasil: `{ skor: 0–100, level: "aman"|"waspada"|"berbahaya"|"kritis",
     lampuMerah: boolean, temuan: TemuanShadowban[] }`. Skor di-clamp 0–100;
     lampu merah menyala begitu ada temuan (skor > 0).
2. **Komponen klien** `LampuShadowban` di `features/antrian/` hanya
   presentasi: badge level + skor + daftar temuan, mode `padat` untuk kartu.
   Styling memakai token yang sudah ada (`warning`, `status-failed`,
   `status-ready`); tidak ada token warna baru.
3. **Titik integrasi**: sebelum aksi salin, bukan penghalang keras.
   - `/fokus` (`features/fokus/fokus-harian.tsx`): lampu di atas tombol
     "Salin utas".
   - `/antrian` (`app/(dashboard)/antrian/antrian-review.tsx`): lampu padat di
     setiap kartu konten, dan dialog "Lihat/Salin utas" menampilkan temuan
     lengkap di atas konfirmasi salin.
   Salin tetap diizinkan: skor adalah peringatan (draft mindset), bukan gerbang
   baru. Ini konsisten dengan K11: hanya user yang memutuskan.

## Konsekuensi

- Tanpa dependency baru dan tanpa pemanggilan jaringan; bisa diuji penuh dengan
  Vitest (`skor-shadowban.test.ts`).
- Konten di atas 500 karakter dihitung risiko tinggi karena sudah melanggar
  aturan platform; validator tetap menjadi penghalang keras di jalur simpan.
- Daftar frasa medis dan tagar agresif hidup di satu berkas; pembaruan kamus
  berikutnya cukup edit konstanta + test.
