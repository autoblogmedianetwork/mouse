# ADR 0031 — Provider AI per user tersimpan terenkripsi (opsi B)

## Status
Diterima.

## Konteks
Pengguna ingin menambah/mengganti provider AI langsung dari Pengaturan, tanpa edit env. Sebelumnya provider hanya via env server (ADR 0006).

## Keputusan
- Simpan provider per user di tabel `ai_provider`, kunci API terenkripsi AES-256-GCM dengan master key `AI_PROVIDER_SECRET` (32 byte) di server.
- RLS membatasi per user; partial unique index menjamin satu provider aktif per user.
- `generateJSON` menerima `baseURL`/`apiKey`/`model` eksplisit; `jalankanAI` memakai `providerAktif()` jika ada, fallback ke env.
- Kunci API tidak pernah dikembalikan terang ke klien.

## Konsekuensi
- Butuh migrasi `0014_ai_provider.sql` dan env `AI_PROVIDER_SECRET`.
- Jika env master key hilang, provider tersimpan tidak bisa didekripsi (fallback env tetap jalan).
- UI Pengaturan menambah/menghapus/mengaktifkan provider; test kesehatan tetap lewat `/api/ai/kesehatan`.
