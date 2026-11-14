'use client';

/**
 * Editor slide carousel (refactor R6): komponen UI saja. Tipe & tema ada di
 * carousel-tipe.ts, penggambaran canvas di carousel-render.ts, panel preset
 * di panel-preset-gaya.tsx. Logika dipindah utuh — tidak ada perubahan perilaku.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/card";
import type { CarouselSlide } from "@/lib/ai/schemas";
import { BATAS_KATA_CAROUSEL, hitungKata } from "@/lib/ai/schemas";
import { PENGATURAN_GAYA_AWAL } from "@/lib/konten/gaya-preset";
import { salinKeClipboard } from "@/lib/konten/salin";
import { buildPollinationsUrl, rekomendasiPromptVisual } from "@/lib/media/pollinations";
import { cn } from "@/lib/utils";
import { renderSlideToCanvas } from "./carousel-render";
import {
  TEMPLATE_CONFIG,
  type CarouselSlideEditorProps,
  type GayaCarousel,
  type RasioSlide,
  type TemaSlide,
} from "./carousel-tipe";
import { KUNCI_PRESET_TERAKHIR, PanelPresetGaya } from "./panel-preset-gaya";

export function CarouselSlideEditor({
  slides,
  caption,
  hashtag = [],
  produkNama = "Produk Pilihan",
  fotoUrl = "",
  handleAkun = "",
  onChangeSlides,
  onChangeCaption,
  onChangeHashtag,
}: CarouselSlideEditorProps) {
  const [slideAktif, setSlideAktif] = useState(0);
  const [rasio, setRasio] = useState<RasioSlide>("4:5");
  const [tema, setTema] = useState<TemaSlide>("dark_tech");
  const [gaya, setGaya] = useState<GayaCarousel>(PENGATURAN_GAYA_AWAL);
  const [presetDipilih, setPresetDipilih] = useState("");

  const ubahGaya = (patch: Partial<GayaCarousel>) => setGaya((g) => ({ ...g, ...patch }));

  // Preset gaya per akun (tabel carousel_gaya_preset, migrasi 0009).
  const [isDownloading, setIsDownloading] = useState(false);
  const [pesanSalin, setPesanSalin] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgVersion, setImgVersion] = useState(0);

  const visualImgRef = useRef<HTMLImageElement | null>(null);
  const [visualImgVersion, setVisualImgVersion] = useState(0);
  const [isGeneratingVisual, setIsGeneratingVisual] = useState(false);
  const [customPromptPerSlide, setCustomPromptPerSlide] = useState<Record<number, string>>({});

  const slide = slides[slideAktif] || slides[0];

  const visualPromptInput =
    customPromptPerSlide[slideAktif] ??
    (slide?.visualPrompt ||
      rekomendasiPromptVisual(
        slide?.peran ?? "cover",
        slide?.headline || slide?.judul || "",
        produkNama,
      ));

  // Preload gambar produk jika ada
  useEffect(() => {
    if (!fotoUrl) {
      imgRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setImgVersion((v) => v + 1);
    };
    img.onerror = () => {
      imgRef.current = null;
    };
    img.src = fotoUrl;
  }, [fotoUrl]);

  // Preload gambar visual AI jika slide memiliki visualUrl
  useEffect(() => {
    if (!slide?.visualUrl) {
      visualImgRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      visualImgRef.current = img;
      setVisualImgVersion((v) => v + 1);
    };
    img.onerror = () => {
      visualImgRef.current = null;
    };
    img.src = slide.visualUrl;
  }, [slide?.visualUrl]);



  // Render canvas saat slide, rasio, tema, gambar, atau visual AI berganti
  useEffect(() => {
    if (!canvasRef.current || !slide) return;
    renderSlideToCanvas(
      canvasRef.current,
      slide,
      slideAktif,
      slides.length,
      tema,
      rasio,
      handleAkun,
      imgRef.current,
      visualImgRef.current,
      gaya,
    );
  }, [slide, slideAktif, slides.length, tema, rasio, handleAkun, imgVersion, visualImgVersion, gaya]);

  const updateSlideField = (field: keyof CarouselSlide, val: string | null) => {
    const next = [...slides];
    next[slideAktif] = { ...next[slideAktif], [field]: val };
    onChangeSlides(next);
  };

  const tambahSlide = () => {
    if (slides.length >= 10) return;
    const urutanBaru = slides.length + 1;
    const slideBaru: CarouselSlide = {
      urutan: urutanBaru,
      peran: "isi",
      kicker: null,
      headline: null,
      judul: "Poin Tambahan",
      isi: "Tuliskan keunggulan produk di sini.",
    };
    const next = [...slides];
    // Masukkan sebelum slide terakhir jika slide terakhir peran CTA
    if (next[next.length - 1]?.peran === "cta") {
      next.splice(next.length - 1, 0, slideBaru);
      // Re-index urutan
      next.forEach((s, idx) => (s.urutan = idx + 1));
    } else {
      next.push(slideBaru);
    }
    onChangeSlides(next);
    setSlideAktif(Math.max(0, next.length - 2));
  };

  const hapusSlide = (idx: number) => {
    if (slides.length <= 3) return;
    const next = slides.filter((_, i) => i !== idx);
    next.forEach((s, i) => (s.urutan = i + 1));
    onChangeSlides(next);
    setSlideAktif((curr) => Math.min(curr, next.length - 1));
  };

  const unduhSlidePng = useCallback(
    (index: number) => {
      const c = document.createElement("canvas");
      const targetSlide = slides[index];
      if (!targetSlide) return;

      renderSlideToCanvas(
        c,
        targetSlide,
        index,
        slides.length,
        tema,
        rasio,
        handleAkun,
        imgRef.current,
        index === slideAktif ? visualImgRef.current : null,
        gaya,
      );

      const url = c.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `slide-${index + 1}-${targetSlide.peran}.png`;
      a.click();
    },
    [slides, tema, rasio, handleAkun, slideAktif, gaya],
  );

  const unduhSemuaSlide = useCallback(async () => {
    setIsDownloading(true);
    for (let i = 0; i < slides.length; i++) {
      unduhSlidePng(i);
      // Jeda singkat agar browser tidak memblokir multiple download
      await new Promise((r) => setTimeout(r, 400));
    }
    setIsDownloading(false);
  }, [slides, unduhSlidePng]);

  const salinFormatCanva = async () => {
    const buffer: string[] = [];
    buffer.push(`=== CAROUSEL: ${produkNama.toUpperCase()} ===\n`);
    slides.forEach((s, i) => {
      buffer.push(`--- SLIDE ${i + 1} (${s.peran.toUpperCase()}) ---`);
      if (s.kicker) buffer.push(`[Label]: ${s.kicker}`);
      if (s.headline || s.judul) buffer.push(`[Judul]: ${s.headline || s.judul}`);
      if (s.isi) buffer.push(`[Penjelasan]: ${s.isi}`);
      buffer.push("");
    });

    buffer.push("=== CAPTION THREADS / INSTAGRAM ===");
    buffer.push(caption);
    if (hashtag.length > 0) {
      buffer.push("\n" + hashtag.map((h) => `#${h.replace(/^#/, "")}`).join(" "));
    }

    const ok = await salinKeClipboard(buffer.join("\n"));
    setPesanSalin(ok ? "Semua teks slide berhasil disalin!" : "Gagal menyalin.");
    setTimeout(() => setPesanSalin(null), 3000);
  };

  // Hitung jumlah kata per field slide aktif
  const kataKicker = hitungKata(slide.kicker);
  const kataJudul = hitungKata(slide.headline || slide.judul);
  const kataIsi = hitungKata(slide.isi);

  const batasJudul =
    slide.peran === "cover"
      ? BATAS_KATA_CAROUSEL.cover_headline
      : BATAS_KATA_CAROUSEL.isi_judul;
  const batasIsi =
    slide.peran === "cta"
      ? BATAS_KATA_CAROUSEL.cta
      : BATAS_KATA_CAROUSEL.isi_penjelasan;

  return (
    <div className="space-y-6">
      {/* Pengaturan Rasio & Tema Template */}
      <Card padat className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2">
          <span className="text-meta font-semibold text-muted-foreground uppercase">
            Rasio:
          </span>
          <div className="flex border border-surface-border p-1 bg-muted/30">
            <button
              type="button"
              onClick={() => setRasio("4:5")}
              className={cn(
                "px-2.5 py-1 text-meta font-medium transition-colors",
                rasio === "4:5"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              4:5 (Vertikal Feed)
            </button>
            <button
              type="button"
              onClick={() => setRasio("1:1")}
              className={cn(
                "px-2.5 py-1 text-meta font-medium transition-colors",
                rasio === "1:1"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              1:1 (Persegi)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-meta font-semibold text-muted-foreground uppercase">
            Tema:
          </span>
          <div className="flex gap-1.5">
            {(["dark_tech", "light_clean", "bold_warm"] as TemaSlide[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTema(t)}
                className={cn(
                  "border px-3 py-1 text-meta font-medium transition-colors",
                  tema === t
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-surface-border hover:bg-muted text-muted-foreground",
                )}
              >
                {TEMPLATE_CONFIG[t].nama}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={salinFormatCanva}
            className="border border-surface-border px-3 py-1.5 text-meta font-medium hover:bg-muted"
          >
            Salin Teks Semua Slide
          </button>
          <button
            type="button"
            onClick={unduhSemuaSlide}
            disabled={isDownloading}
            className="bg-primary px-3 py-1.5 text-meta font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            {isDownloading ? "Mengunduh…" : "Unduh Semua PNG"}
          </button>
        </div>
      </Card>

      {/* Panel gaya: kontrol global seluruh slide — skala teks, warna aksen, posisi, kelonggaran */}
      <Card padat className="flex flex-wrap items-center gap-x-5 gap-y-3 p-4">
        <span className="text-meta font-semibold uppercase tracking-meta text-muted-foreground">
          Gaya
        </span>

        <label className="flex items-center gap-2 text-meta text-muted-foreground">
          Skala teks
          <input
            type="range"
            min={70}
            max={150}
            step={5}
            value={gaya.skalaFont}
            onChange={(e) => ubahGaya({ skalaFont: Number(e.target.value) })}
            className="w-28 accent-primary"
          />
          <span className="w-10 font-semibold text-foreground">{gaya.skalaFont}%</span>
        </label>

        <label className="flex items-center gap-2 text-meta text-muted-foreground">
          Warna aksen
          <input
            type="color"
            value={gaya.warnaAksen || TEMPLATE_CONFIG[tema].accent}
            onChange={(e) => ubahGaya({ warnaAksen: e.target.value })}
            className="h-7 w-9 cursor-pointer border border-surface-border bg-transparent"
          />
        </label>

        <button
          type="button"
          onClick={() => ubahGaya({ warnaAksen: "" })}
          className={cn(
            "border px-3 py-1 text-meta font-medium transition-colors",
            gaya.warnaAksen
              ? "border-surface-border text-muted-foreground hover:text-foreground"
              : "border-primary bg-primary/10 text-primary font-semibold",
          )}
        >
          Ikut Tema
        </button>

        <div className="flex items-center gap-2">
          <span className="text-meta font-semibold uppercase text-muted-foreground">Posisi:</span>
          <div className="flex border border-surface-border bg-muted/30 p-1">
            {(["atas", "tengah"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => ubahGaya({ posisiKonten: p })}
                className={cn(
                  "px-2.5 py-1 text-meta font-medium capitalize transition-colors",
                  gaya.posisiKonten === p
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-meta text-muted-foreground">
          Kelonggaran
          <input
            type="range"
            min={90}
            max={140}
            step={5}
            value={gaya.ruangKeliling}
            onChange={(e) => ubahGaya({ ruangKeliling: Number(e.target.value) })}
            className="w-28 accent-primary"
          />
          <span className="w-10 font-semibold text-foreground">{gaya.ruangKeliling}%</span>
        </label>

        <button
          type="button"
          onClick={() => {
            setGaya(PENGATURAN_GAYA_AWAL);
            setPresetDipilih("");
            window.localStorage.removeItem(KUNCI_PRESET_TERAKHIR);
          }}
          className="ml-auto border border-surface-border px-3 py-1 text-meta font-medium text-muted-foreground hover:bg-muted"
        >
          Reset gaya
        </button>
      </Card>

      <PanelPresetGaya
        gaya={gaya}
        presetDipilih={presetDipilih}
        setPresetDipilih={setPresetDipilih}
        onTerapkanGaya={setGaya}
      />

      {pesanSalin ? (
        <div className="border border-status-ready/30 bg-status-ready/10 p-2.5 text-meta text-status-ready">
          {pesanSalin}
        </div>
      ) : null}

      {/* Selector Slide Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {slides.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setSlideAktif(idx)}
            className={cn(
              "flex-shrink-0 border px-3 py-1.5 text-meta font-medium transition-colors",
              idx === slideAktif
                ? "border-primary bg-primary text-primary-foreground"
                : "border-surface-border bg-surface hover:bg-muted text-muted-foreground",
            )}
          >
            Slide {idx + 1} ({s.peran})
          </button>
        ))}
        {slides.length < 10 ? (
          <button
            type="button"
            onClick={tambahSlide}
            className="flex-shrink-0 border border-dashed border-surface-border px-3 py-1.5 text-meta text-muted-foreground hover:border-primary hover:text-foreground"
          >
            + Tambah Slide
          </button>
        ) : null}
      </div>

      {/* Main Grid: Preview Kartu (Kiri) & Editor Teks Slide (Kanan) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Kolom Kiri: Visual Canvas Preview */}
        <Card padat className="flex flex-col items-center p-4 lg:col-span-6">
          <div className="mb-3 flex w-full items-center justify-between">
            <span className="text-meta font-medium text-muted-foreground">
              Preview Slide {slideAktif + 1} ({slide.peran.toUpperCase()})
            </span>
            <button
              type="button"
              onClick={() => unduhSlidePng(slideAktif)}
              className="text-meta text-primary hover:underline"
            >
              Unduh PNG Ini
            </button>
          </div>

          <div
            className={cn(
              "relative overflow-hidden border border-surface-border max-w-full flex items-center justify-center bg-black/40",
              rasio === "4:5" ? "aspect-[4/5] max-h-[500px]" : "aspect-square max-h-[440px]",
            )}
          >
            <canvas
              ref={canvasRef}
              className="h-full w-full object-contain"
              style={{ maxHeight: rasio === "4:5" ? "500px" : "440px" }}
            />
          </div>

          <div className="mt-4 flex w-full items-center justify-between px-2">
            <button
              type="button"
              disabled={slideAktif === 0}
              onClick={() => setSlideAktif((p) => Math.max(0, p - 1))}
              className="border border-surface-border px-3 py-1.5 text-meta disabled:opacity-40"
            >
              ← Sebelumnya
            </button>
            <span className="text-meta text-muted-foreground font-mono">
              {slideAktif + 1} / {slides.length}
            </span>
            <button
              type="button"
              disabled={slideAktif === slides.length - 1}
              onClick={() => setSlideAktif((p) => Math.min(slides.length - 1, p + 1))}
              className="border border-surface-border px-3 py-1.5 text-meta disabled:opacity-40"
            >
              Berikutnya →
            </button>
          </div>
        </Card>

        {/* Kolom Kanan: Form Edit Slide Aktif */}
        <Card className="space-y-4 lg:col-span-6">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div>
              <h3 className="text-badan font-semibold">
                Edit Slide {slideAktif + 1}
              </h3>
              <p className="text-meta text-muted-foreground">
                Peran: <strong className="uppercase">{slide.peran}</strong>
              </p>
            </div>
            {slides.length > 3 ? (
              <button
                type="button"
                onClick={() => hapusSlide(slideAktif)}
                className="text-meta text-status-failed hover:underline"
              >
                Hapus slide ini
              </button>
            ) : null}
          </div>

          {/* Kicker (opsional) */}
          <div>
            <div className="mb-1 flex items-center justify-between text-meta">
              <label htmlFor="slide-kicker" className="font-medium text-muted-foreground">
                Kicker / Label Atas
              </label>
              <span
                className={cn(
                  kataKicker > BATAS_KATA_CAROUSEL.kicker
                    ? "text-status-failed font-semibold"
                    : "text-muted-foreground",
                )}
              >
                {kataKicker}/{BATAS_KATA_CAROUSEL.kicker} kata
              </span>
            </div>
            <input
              id="slide-kicker"
              type="text"
              value={slide.kicker || ""}
              onChange={(e) => updateSlideField("kicker", e.target.value)}
              placeholder="Mis. TIPS MEMILIH, REVIEW JUJUR"
              className="w-full border border-surface-border bg-surface px-3 py-2 text-badan outline-none focus:border-primary"
            />
          </div>

          {/* Headline / Judul */}
          <div>
            <div className="mb-1 flex items-center justify-between text-meta">
              <label htmlFor="slide-headline" className="font-medium text-muted-foreground">
                {slide.peran === "cover" ? "Headline Utama" : "Judul Poin"}
              </label>
              <span
                className={cn(
                  kataJudul > batasJudul
                    ? "text-status-failed font-semibold"
                    : "text-muted-foreground",
                )}
              >
                {kataJudul}/{batasJudul} kata
              </span>
            </div>
            <input
              id="slide-headline"
              type="text"
              value={slide.headline || slide.judul || ""}
              onChange={(e) => {
                if (slide.peran === "cover") {
                  updateSlideField("headline", e.target.value);
                } else {
                  updateSlideField("judul", e.target.value);
                }
              }}
              placeholder={
                slide.peran === "cover"
                  ? "Headline pemikat (maks 8 kata)"
                  : "Judul poin (maks 6 kata)"
              }
              className="w-full border border-surface-border bg-surface px-3 py-2 text-badan outline-none focus:border-primary"
            />
          </div>

          {/* Isi Penjelasan */}
          <div>
            <div className="mb-1 flex items-center justify-between text-meta">
              <label htmlFor="slide-isi" className="font-medium text-muted-foreground">
                {slide.peran === "cta" ? "Ajakan Bertindak (CTA)" : "Isi Penjelasan"}
              </label>
              <span
                className={cn(
                  kataIsi > batasIsi
                    ? "text-status-failed font-semibold"
                    : "text-muted-foreground",
                )}
              >
                {kataIsi}/{batasIsi} kata
              </span>
            </div>
            <textarea
              id="slide-isi"
              rows={4}
              value={slide.isi || ""}
              onChange={(e) => updateSlideField("isi", e.target.value)}
              placeholder={
                slide.peran === "cta"
                  ? "Ajakan santai, misal: Cek link affiliate di bio atau komentar."
                  : "Penjelasan ringkas poin ini (maks 25 kata)."
              }
              className="w-full border border-surface-border bg-surface px-3 py-2 text-badan outline-none focus:border-primary"
            />
          </div>

          {/* Visual Pendukung AI (Pollinations.ai) */}
          <div className="border border-surface-border bg-muted/20 p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-meta font-semibold">Visual Pendukung AI</span>
                <span className="border border-surface-border px-1.5 py-0.5 font-mono text-mikro font-semibold uppercase tracking-badge text-muted-foreground">
                  Pollinations Cloud
                </span>
              </div>
              {slide.visualUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    updateSlideField("visualUrl", null);
                    updateSlideField("visualPrompt", null);
                  }}
                  className="text-meta text-status-failed hover:underline"
                >
                  Hapus visual
                </button>
              ) : null}
            </div>

            <p className="mb-2 text-meta text-muted-foreground">
              Latar ilustrasi suasana / masalah pendukung slide. Bebas biaya dan tidak membebani laptop.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={visualPromptInput}
                onChange={(e) =>
                  setCustomPromptPerSlide((prev) => ({
                    ...prev,
                    [slideAktif]: e.target.value,
                  }))
                }
                placeholder="Deskripsi visual bahasa Inggris..."
                className="w-full border border-surface-border bg-surface px-3 py-1.5 text-meta outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => {
                  setIsGeneratingVisual(true);
                  const promptToUse =
                    visualPromptInput.trim() ||
                    rekomendasiPromptVisual(
                      slide.peran,
                      slide.headline || slide.judul || "",
                      produkNama,
                    );
                  const width = 1080;
                  const height = rasio === "4:5" ? 1350 : 1080;
                  const randomSeed = Math.floor(Math.random() * 999999);
                  const url = buildPollinationsUrl({
                    prompt: promptToUse,
                    width,
                    height,
                    seed: randomSeed,
                  });

                  const next = [...slides];
                  next[slideAktif] = {
                    ...next[slideAktif],
                    visualUrl: url,
                    visualPrompt: promptToUse,
                  };
                  onChangeSlides(next);
                  setTimeout(() => setIsGeneratingVisual(false), 800);
                }}
                disabled={isGeneratingVisual}
                className="flex-shrink-0 bg-primary px-3 py-1.5 text-meta font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
              >
                {isGeneratingVisual ? "Membuat…" : "Buat Visual"}
              </button>
            </div>
          </div>

          {/* Editor Caption & Hashtag */}
          <div className="border-t border-surface-border pt-4">
            <div className="mb-1 flex items-center justify-between text-meta">
              <label htmlFor="carousel-caption" className="font-medium text-muted-foreground">
                Caption Postingan
              </label>
              <span className="text-muted-foreground">
                {caption.length}/2200 karakter
              </span>
            </div>
            <textarea
              id="carousel-caption"
              rows={3}
              value={caption}
              onChange={(e) => onChangeCaption(e.target.value)}
              placeholder="Caption pengantar carousel..."
              className="w-full border border-surface-border bg-surface px-3 py-2 text-badan outline-none focus:border-primary"
            />
            {onChangeHashtag ? (
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-meta">
                  <label htmlFor="carousel-hashtag" className="font-medium text-muted-foreground">
                    Tagar / Hashtag (maks 5)
                  </label>
                  <span className="text-muted-foreground">{hashtag.length}/5 tagar</span>
                </div>
                <input
                  id="carousel-hashtag"
                  type="text"
                  value={hashtag.join(" ")}
                  onChange={(e) => {
                    const tags = e.target.value
                      .split(/\s+/)
                      .map((t) => t.replace(/^#/, "").trim())
                      .filter(Boolean)
                      .slice(0, 5);
                    onChangeHashtag(tags);
                  }}
                  placeholder="Contoh: taskanvas rekomendasi racunshopee"
                  className="w-full border border-surface-border bg-surface px-3 py-2 text-badan outline-none focus:border-primary"
                />
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
