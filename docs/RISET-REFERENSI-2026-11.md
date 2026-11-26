# Riset Referensi Internet — 17 November 2026

> Hasil penelusuran web untuk ide Heaviliate: 45+ referensi dari 7 pencarian
> ( Threads growth/affiliate, Threads API, video/TTS open source, foto produk
> marketplace, link-in-bio, hashtag tools ). Setiap ide dinilai terhadap
> aturan proyek: tanpa API wajib, tanpa scraping, manual paste, laptop
> low-end, pemula Indonesia.

## A. Threads growth & taktik affiliate (8)

1. partnershare.net — 2026 Threads Affiliate Marketing Guide (struktur program, komisi)
2. microposter.so — 8-Point Threads Growth Strategy 2026 (sistem > viral; cross-post adaptif)
3. contentstudio.io — Threads Marketing Guide (For You vs Following feed; replies berbobot tinggi di algoritma)
4. kingfin-jp.com — FX Affiliate Funnel on Threads (funnel: replies → pinned post → artikel → signup; disclosure wajib)
5. linktolooks.com — Affiliate links di Threads (label paid partnership WAJIB; dua artikel help Meta saling bertentangan → pakai keduanya)
6. outfy.com — 7 Ways to Boost Conversions 2026 (engagement 8,3× lebih tinggi; first-mover)
7. involve.asia — Beginner's Guide (bio SEO-friendly; link-in-bio tool)
8. businessinsider.com — Threads chief Connor Hayes (500 juta user Juni 2026)

**Temuan kunci:** replies >50% dari views global (lebih kuat di Jepang) → strategi "link di balasan" Heaviliate sudah benar. Disclosure/paid-partnership adalah kewajiban Meta, bukan pilihan.

## B. Threads API & Web Intents (9)

9. developers.facebook.com/docs/threads/overview — gratis, 250 post/24 jam, 1.000 replies/24 jam
10. blog.lots.social — Threads API: akses gratis, posting akun sendiri TANPA App Review (jadi tester sendiri); review hanya untuk akun orang lain
11. developers.facebook.com — Threads use case & permissions (threads_basic, threads_content_publish, dst.)
12. developers.facebook.com — Troubleshooting (status container: EXPIRED/ERROR/IN_PROGRESS/PUBLISHED)
13. developers.facebook.com — dokumentasi index (+ llms.txt)
14. abondy.com — perbandingan biaya API sosial (semua gratis kecuali X yang bayar per request)
15. developers.facebook.com — What's new in Threads API 2026: **lampiran teks 10.000 karakter** dengan format, ghost posts 24 jam, spoiler, GIF, cross-share ke IG Stories
16. developers.facebook.com — **Web Intents**: `threads.com/intent/post?text=&url=&tag=&reply_control=` — tanpa token, tanpa review; di HP membuka aplikasi Threads
17. siaran.my — tabel rate limit semua platform (IG 100 post/24 jam, FB Pages 30 Reels/24 jam)

**Temuan kunci:** auto-posting Fase 7 (K12) jauh lebih murah dari dugaan — API gratis dan akun sendiri tanpa review. Tetap keputusan user.

## C. Video & TTS open source (8)

18. github.com/vikash-iwe3/Free-AI-Video-Editor — CPU-only, ffmpeg+Pillow+Edge TTS; loudness normalization -16 LUFS; Ken Burns; caption auto-wrap
19. github.com/yanghhu/ai-voiceover-studio — edge-tts tanpa API key; **caption per-kata gaya TikTok**; musik di-duck; keluaran SRT
20. github.com/sekika/slidemovie — Markdown/PPT → video narasi (butuh API AI untuk narasi)
21. github.com/michael-borck/slide-stream — deck → video; voice offline Kokoro
22. github.com/Harry-sai/Automated-Explainer-Video-Generator — teks → slide + gTTS + MoviePy (pola sama dengan notebook Heaviliate)
23. github.com/skwasimrazzak/n8n-Text-To-Video-Generator — pipeline Flask+n8n, gTTS
24. github.com/riyadhctg/local_ai_agent_slideshow_creator — Ollama + DuckDuckGo image search (❌ scraping — ditolak)
25. github.com/CharlesCreativeContent/BentoText2Video — XTTS+SDXL-Turbo (butuh GPU — ditolak untuk laptop ini)

**Temuan kunci:** pendekatan notebook slideshow Heaviliate (ADR 0021) persis arah komunitas; peningkatan yang layak diadopsi: caption per-kata, normalisasi loudness, musik latar di-duck.

## D. Foto produk & aturan marketplace (8)

26. blog.solvinc.io — rembg untuk ratusan foto produk, Rp0 (⚠️ lisensi model default bria-rmbg berbayar untuk komersial — pilih model lain via `-m`)
27. yayandigital.com — tool gratis seller: rembg + **Upscayl** (perbesar/pertajam foto) + InvenTree (stok)
28. accesstrade.co.id — "visual hook" AI: AI mengubah LINGKUNGAN, bukan produk (selaras ADR 0019)
29. kolabora.id — alur foto produk AI aman: AI hanya latar/perapian; foto utama tetap foto asli; remove.bg tutup 1 Des 2026
30. lemon8-app.com — tips foto produk HP: cahaya jendela, latar polos, multi-sudut
31. capcut.com — hapus latar untuk Shopee (tool berbayar di atas freemium)
32. panduanjualan.com — aturan foto Shopee (500×500 min, produk ≥70% frame, latar putih) & TikTok Shop (600×600, ≥60%)
33. vitaaff.com — SaaS affiliate Shopee (ide generator angle, script, caption — kompetitor; referensi fitur)

**Temuan kunci:** prinsip "AI mengubah sekitar, bukan produk" identik dengan ADR 0019 Heaviliate — arah sudah benar sejak awal.

## E. Link-in-bio open source (6)

34. github.com/kidow/opentree — desktop app, 21 tipe blok termasuk **affiliate (UTM)** & commerce; deploy Vercel/CF/GH Pages
35. github.com/tufantunc/opentwig — CLI npx, JSON config, QR code, OG image otomatis
36. github.com/heristop/linkfolio — Next.js + Tailwind, deploy Vercel
37. github.com/sudo-sein/linkspace — Astro + YAML config
38. github.com/furryweekend/Pawprint — Cloudflare Worker + klik analytics
39. github.com/VEX-SL/linkgrid — vanilla JS self-hosted + analytics

**Temuan kunci:** bio-link adalah pelengkap wajib strategi "link di balasan/bio". Kandidat fitur Heaviliate: ekspor halaman bio-link dari Katalog (JSON → HTML statis), bukan linktree pihak ketiga.

## F. Hashtag & keyword tools (6)

40. hashly.pro — 28+ tool keyword/hashtag tanpa login, semua di browser (pola bagus: lokal, tanpa server)
41. contentmation.com — hashtag 30 per run di-split 3 tier kompetisi (low/medium/high)
42. hashtagtools.io — perbandingan tool gratis 2026: data terbaik dari platform sendiri (TikTok Creative Center, IG search)
43. easyhashtag.com — generator gratis tanpa signup
44. toolu.dev — generator 30 hashtag IG di browser
45. sites.google.com — Tik Analyzer ekstensi Chrome (❌ ekstraksi data TikTok — gugat aturan no-scraping, ditolak)

**Temuan kunci:** strategi hashtag terbaik = bobot ke tag kompetisi rendah + 2-3 medium + maksimal 1 tinggi. Bisa jadi peningkatan Tag Shopee/hashtag Heaviliate (lokal, tanpa API).

---

## Triage keputusan

### Diterima & dikerjakan (17 Nov, commit `135096f`)
1. **Tombol "Buka di Threads"** (web intent) di Siap Salin — ref #16, #33-36
2. **Pengingat disclosure paid partnership** — ref #5, #4

### Parkir terurut (kandidat sesi berikut, semua tanpa API)
1. **Utas panjang 10.000 karakter** (lampiran teks Threads) — ref #15; prompt baru versi terpisah
2. **Pipeline foto produk**: rembg (model non-bria) + Upscayl → bahan IG caption & Pinterest pin — ref #26-29; sekaligus membuka 3 platform yang diminta user
3. **Notebook slideshow v2**: caption per-kata + loudness normalization + musik duck — ref #18-19
4. **Generator bio-link** dari Katalog (HTML statis diexport) — ref #34-39
5. **Skor hashtag bertingkat kompetisi** di Tag Shopee — ref #40-42
6. **K12 auto-posting via Threads API resmi** — ref #9-10: gratis, tanpa review untuk akun sendiri, 250/24 jam; keputusan tetap milik user

### Ditolak (melanggar aturan proyek)
- Image search otomatis (DuckDuckGo) untuk slideshow — scraping (#24)
- Ekstraksi data TikTok (Tik Analyzer) — scraping (#45)
- Pipeline GPU lokal (BentoText2Video) — tidak realistis di laptop (#25)
- Auto-posting tanpa konfirmasi user — selalu melanggar Fase 4
