<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md: AutoThreads

Dashboard pribadi untuk membuat konten affiliate dari produk marketplace, dengan Threads sebagai platform aktif di MVP. Bahasa antarmuka: Indonesia. Kode dan komentar: Inggris.

**Stack:** Next.js (App Router), TypeScript, Tailwind, shadcn/ui, Supabase, Zod, React Hook Form, Vitest.

**Sumber kebenaran:** docs/PRD-AutoThreads.md (fitur), docs/UI-Spec-AutoThreads.md (UI), docs/Workflow-AutoThreads.md (alur), docs/Rencana-Pengembangan-AutoThreads.md (fase), docs/skema-database.md (data), docs/ai-provider.md (provider), docs/adr/ (keputusan teknis), docs/glosarium.md (nama).

**Aturan:**
1. Baca dokumen yang relevan sebelum coding, dan sebutkan yang sudah dibaca.
2. Satu task per sesi. Jelaskan rencana dan file yang berubah, tunggu persetujuan sebelum menulis kode.
3. Jangan menambah dependency tanpa izin.
4. Semua output AI berstatus draft. Tidak ada `siap_posting` tanpa aksi user. Mode otomatis penuh hanya boleh dibuat setelah K12 disetujui.
5. Input manual selalu tersedia. Scraping nonaktif kecuali task mengaktifkannya.
6. Setiap fungsi punya antarmuka sendiri: chat, visi, TTS, transkripsi di `lib/ai/`; posting di `lib/posting/`; tools media di `lib/media/`. Provider dipilih lewat env, komponen UI tidak memanggil API langsung.
7. Provider posting `manual` selalu tersedia sebagai pilihan.
8. Tools media default `off`. Aktif per fitur lewat env dan Pengaturan. Panggil `isAvailable()` sebelum menampilkan tombol.
9. Output AI divalidasi dengan Zod. Jika gagal, satu retry lalu pesan error.
10. Status Threads maksimal 500 karakter, dijaga di kode dan constraint database.
11. API key dan `SUPABASE_SERVICE_ROLE_KEY` hanya di server.
12. Perubahan skema lewat migrasi baru. Jangan mengubah migrasi yang sudah dijalankan. Perbarui docs/skema-database.md.
13. Prompt bernomor versi. Jangan menimpa versi lama, buat versi baru.
14. Tulis test untuk validator, parser JSON, dan pembersih deskripsi. Fixture di `tests/fixtures/`.
15. Keputusan teknis baru ditulis sebagai ADR di docs/adr/. Jangan memilih ulang yang sudah tercatat tanpa ADR baru.
16. Jangan mengubah file di luar scope task. Jangan commit `.env.local`.
17. Akhiri setiap task dengan: daftar file yang berubah, hasil test, dan cara uji manual.

**Perintah:** `npm run dev`, `npm test`, `npm run lint`.
