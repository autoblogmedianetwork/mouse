# docs/

Dokumen di folder ini adalah **sumber kebenaran** untuk repo ini. Salinan di folder kerja
`FILE KERJA AFFILIATE` statusnya arsip dan bisa berbeda (folder itu tersinkron dari penyimpanan
awan, jadi ada berkas yang lebih baru dan ada yang lebih lama dari versi di sini).

## Aturan penyuntingan

- Sunting dokumen **di sini**, jangan di salinan folder kerja. Kalau dua-duanya disunting, akan ada
  dua versi yang berbeda dan AI akan menebak mana yang benar.
- Perubahan skema database wajib memperbarui `skema-database.md` pada tugas yang sama
  (aturan 12 di `AGENTS.md`).
- Keputusan teknis baru ditulis sebagai ADR di `adr/` memakai `adr/TEMPLATE.md`.

## Isi dan kegunaannya

| Berkas | Dipakai untuk |
|---|---|
| `PRD-AutoThreads.md` | daftar fitur, non-goals MVP, metrik sukses |
| `UI-Spec-AutoThreads.md` | layout, komponen inti, perilaku status, responsif |
| `Workflow-AutoThreads.md` | alur user per tahap, state konten, error dan recovery |
| `Rencana-Pengembangan-AutoThreads.md` | fase, exit criteria, strategi pengujian, definisi selesai |
| `rencana-testing.md` | rincian lapisan tes, tes per fase, tes RLS, tes kegagalan |
| `skema-database.md` | tabel, enum, storage, migrasi yang sudah ada dan draft migrasi berikutnya |
| `ai-provider.md` | endpoint provider AI, harga, provider per fungsi, tools media |
| `keputusan.md` | jawaban K1–K14, status prasyarat P1–P11, pilihan tooling |
| `glosarium.md` | istilah Indonesia ke nama kode (dipakai di semua berkas) |
| `fitur-mode-kerja.md` | mode kerja, antrian review, skor ide, kontrol biaya |
| `fitur-carousel.md` | struktur slide, template, renderer, checklist carousel |
| `Template-Video-Affiliate.md` | acuan modul video (storyboard, JSON Google Flow, checklist) |
| `dependency.md` | semua tool dan layanan beserta status dan fasenya |
| `adr/` | keputusan teknis 0001 sampai sekarang |

## Berkas pendamping di luar docs/

| Folder | Isi |
|---|---|
| `prompts/` | Prompt AI bernomor versi (frontmatter: id, versi, model, output) |
| `golden/` | Set uji 10 produk dan `rubrik.md` |
| `lib/ai/prompts/` | Prompt yang sudah dipakai kode (TypeScript, versi di nama file) |
