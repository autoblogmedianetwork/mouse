<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md: AutoThreads

Dashboard pribadi untuk membuat konten Threads dari produk affiliate Shopee. Bahasa antarmuka: Indonesia. Kode dan komentar: Inggris.

**Stack:** Next.js (App Router), TypeScript, Tailwind, shadcn/ui, Supabase, Zod, React Hook Form, Vitest.

**Sumber kebenaran:** docs/PRD-AutoThreads.md (fitur), docs/UI-Spec-AutoThreads.md (UI), docs/Rencana-Pengembangan-AutoThreads.md (fase), docs/skema-database.md (data), docs/ai-provider.md (AI), docs/keputusan.md (keputusan).

**Aturan:**
1. Baca dokumen yang relevan sebelum coding, dan sebutkan yang sudah dibaca.
2. Satu task per sesi. Jelaskan rencana dan file yang akan berubah, lalu tunggu persetujuan sebelum menulis kode.
3. Jangan menambah dependency tanpa izin.
4. Semua output AI berstatus draft. Tidak ada status siap_posting tanpa aksi user.
5. Input manual selalu tersedia. Scraping nonaktif kecuali task mengaktifkannya.
6. Panggilan AI hanya lewat lib/ai/, dan setiap output divalidasi dengan Zod.
7. Status Threads maksimal 500 karakter, dijaga di kode dan constraint database.
8. API key dan SUPABASE_SERVICE_ROLE_KEY hanya dipakai di server, tidak di komponen klien.
9. Perubahan skema lewat migrasi baru. Jangan mengubah migrasi yang sudah dijalankan. Perbarui docs/skema-database.md.
10. Prompt bernomor versi. Jangan menimpa versi lama, buat versi baru (misalnya v2).
11. Pakai komponen yang sudah ada di components/ sebelum membuat yang baru.
12. Tulis test untuk validator 500 karakter, parser JSON, dan pembersih deskripsi.
13. Jangan mengubah file di luar scope task.
14. Jangan commit .env.local.
15. Akhiri setiap task dengan: daftar file yang berubah, hasil test, dan cara uji manual.

**Perintah:** `npm run dev`, `npm test`, `npm run lint`.

**Istilah dan keputusan:** pakai nama kode dari docs/glosarium.md. Keputusan teknis yang sudah diambil ada di docs/adr/. Jangan memilih ulang provider, library, atau skema yang sudah tercatat tanpa ADR baru.
