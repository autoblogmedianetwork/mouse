"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CarouselSlide } from "@/lib/ai/schemas";
import { BATAS_KATA_CAROUSEL, hitungKata } from "@/lib/ai/schemas";
import { salinKeClipboard } from "@/lib/konten/salin";
import { buildPollinationsUrl, rekomendasiPromptVisual } from "@/lib/media/pollinations";
import { cn } from "@/lib/utils";

export type RasioSlide = "4:5" | "1:1";
export type TemaSlide = "dark_tech" | "light_clean" | "bold_warm";

export interface CarouselSlideEditorProps {
  slides: CarouselSlide[];
  caption: string;
  hashtag?: string[];
  produkNama?: string;
  fotoUrl?: string;
  handleAkun?: string;
  onChangeSlides: (slides: CarouselSlide[]) => void;
  onChangeCaption: (caption: string) => void;
  onChangeHashtag?: (hashtag: string[]) => void;
}

const TEMPLATE_CONFIG: Record<
  TemaSlide,
  {
    nama: string;
    bgStyle: string;
    bgCanvas: string[];
    textPrimary: string;
    textSecondary: string;
    accent: string;
    cardBorder: string;
  }
> = {
  dark_tech: {
    nama: "Dark Cyan",
    bgStyle: "bg-slate-950 text-slate-100",
    bgCanvas: ["#090d16", "#0f172a"],
    textPrimary: "#f8fafc",
    textSecondary: "#94a3b8",
    accent: "#38bdf8",
    cardBorder: "#1e293b",
  },
  light_clean: {
    nama: "Light Minimal",
    bgStyle: "bg-slate-50 text-slate-900",
    bgCanvas: ["#ffffff", "#f1f5f9"],
    textPrimary: "#0f172a",
    textSecondary: "#64748b",
    accent: "#059669",
    cardBorder: "#e2e8f0",
  },
  bold_warm: {
    nama: "Bold Amber",
    bgStyle: "bg-zinc-950 text-zinc-100",
    bgCanvas: ["#18181b", "#09090b"],
    textPrimary: "#fafafa",
    textSecondary: "#a1a1aa",
    accent: "#f59e0b",
    cardBorder: "#27272a",
  },
};

/**
 * Menggambar satu slide ke canvas HTML5 beresolusi tinggi (1080x1350 atau 1080x1080).
 */
function renderSlideToCanvas(
  canvas: HTMLCanvasElement,
  slide: CarouselSlide,
  index: number,
  totalSlides: number,
  tema: TemaSlide,
  rasio: RasioSlide,
  handleAkun: string,
  imgElement: HTMLImageElement | null,
  visualElement: HTMLImageElement | null = null,
) {
  const width = 1080;
  const height = rasio === "4:5" ? 1350 : 1080;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const conf = TEMPLATE_CONFIG[tema];

  // 1. Background gradient dasar
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, conf.bgCanvas[0]);
  grad.addColorStop(1, conf.bgCanvas[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 1b. Gambar ilustrasi visual AI (Pollinations) jika ada
  if (visualElement && visualElement.complete && visualElement.naturalWidth) {
    ctx.save();
    ctx.drawImage(visualElement, 0, 0, width, height);
    // Overlay transparan agar teks tetap kontras dan nyaman dibaca di HP
    ctx.fillStyle =
      tema === "light_clean"
        ? "rgba(255, 255, 255, 0.85)"
        : "rgba(10, 15, 26, 0.86)";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // 2. Decorative subtle grid or border accent
  ctx.strokeStyle = conf.cardBorder;
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, width - 60, height - 60);

  // 3. Header: Kicker atau nomor slide
  const kickerTeks = (slide.kicker || (slide.peran === "cover" ? "AFFILIATE PICK" : `POIN ${index + 1}`)).toUpperCase();
  ctx.fillStyle = conf.accent;
  ctx.font = "bold 26px sans-serif";
  ctx.fillText(kickerTeks, 70, 95);

  // Slide Counter
  const counterTeks = `${String(index + 1).padStart(2, "0")} / ${String(totalSlides).padStart(2, "0")}`;
  ctx.fillStyle = conf.textSecondary;
  ctx.font = "bold 24px sans-serif";
  const counterWidth = ctx.measureText(counterTeks).width;
  ctx.fillText(counterTeks, width - 70 - counterWidth, 95);

  // Divider atas
  ctx.fillStyle = conf.cardBorder;
  ctx.fillRect(70, 120, width - 140, 2);

  // 4. Foto Produk (jika ada dan cover/isi)
  let contentStartY = 200;
  if (imgElement && imgElement.complete && imgElement.naturalWidth) {
    const imgSize = rasio === "4:5" ? 400 : 320;
    const imgX = (width - imgSize) / 2;
    const imgY = 160;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(imgX, imgY, imgSize, imgSize, 24);
    ctx.clip();
    ctx.drawImage(imgElement, imgX, imgY, imgSize, imgSize);
    ctx.restore();
    contentStartY = imgY + imgSize + 60;
  }

  // 5. Headline / Judul
  const judulTeks = slide.headline || slide.judul || "";
  if (judulTeks) {
    ctx.fillStyle = conf.textPrimary;
    ctx.font = `bold ${slide.peran === "cover" ? "56px" : "48px"} sans-serif`;
    contentStartY = drawWrappedText(ctx, judulTeks, 70, contentStartY, width - 140, slide.peran === "cover" ? 70 : 60);
    contentStartY += 30;
  }

  // 6. Isi Penjelasan
  const isiTeks = slide.isi || "";
  if (isiTeks) {
    ctx.fillStyle = conf.textSecondary;
    ctx.font = "normal 34px sans-serif";
    drawWrappedText(ctx, isiTeks, 70, contentStartY, width - 140, 48);
  }

  // 7. Footer: Handle akun & Call to Action swipe
  ctx.fillStyle = conf.cardBorder;
  ctx.fillRect(70, height - 100, width - 140, 2);

  ctx.fillStyle = conf.textSecondary;
  ctx.font = "normal 24px sans-serif";
  ctx.fillText(handleAkun ? `@${handleAkun.replace(/^@/, "")}` : "Threads", 70, height - 60);

  const swipeText = slide.peran === "cta" ? "Link di Bio / Balasan 👉" : "Geser untuk lanjut 👉";
  ctx.fillStyle = conf.accent;
  ctx.font = "bold 24px sans-serif";
  const swipeWidth = ctx.measureText(swipeText).width;
  ctx.fillText(swipeText, width - 70 - swipeWidth, height - 60);
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
  return currentY;
}

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
    );
  }, [slide, slideAktif, slides.length, tema, rasio, handleAkun, imgVersion, visualImgVersion]);

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
      );

      const url = c.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `slide-${index + 1}-${targetSlide.peran}.png`;
      a.click();
    },
    [slides, tema, rasio, handleAkun, slideAktif],
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface p-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase">
            Rasio:
          </span>
          <div className="flex rounded-lg border border-surface-border p-1 bg-muted/30">
            <button
              type="button"
              onClick={() => setRasio("4:5")}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
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
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
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
          <span className="text-xs font-semibold text-muted-foreground uppercase">
            Tema:
          </span>
          <div className="flex gap-1.5">
            {(["dark_tech", "light_clean", "bold_warm"] as TemaSlide[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTema(t)}
                className={cn(
                  "rounded-lg border px-3 py-1 text-xs font-medium transition-colors",
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
            className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            📋 Salin Teks Semua Slide
          </button>
          <button
            type="button"
            onClick={unduhSemuaSlide}
            disabled={isDownloading}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            {isDownloading ? "Mengunduh…" : "📥 Unduh Semua PNG"}
          </button>
        </div>
      </div>

      {pesanSalin ? (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-400">
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
              "flex-shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
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
            className="flex-shrink-0 rounded-lg border border-dashed border-surface-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-foreground"
          >
            + Tambah Slide
          </button>
        ) : null}
      </div>

      {/* Main Grid: Preview Kartu (Kiri) & Editor Teks Slide (Kanan) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Kolom Kiri: Visual Canvas Preview */}
        <div className="flex flex-col items-center rounded-xl border border-surface-border bg-surface p-4 lg:col-span-6">
          <div className="mb-3 flex w-full items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Preview Slide {slideAktif + 1} ({slide.peran.toUpperCase()})
            </span>
            <button
              type="button"
              onClick={() => unduhSlidePng(slideAktif)}
              className="text-xs text-primary hover:underline"
            >
              Unduh PNG Ini
            </button>
          </div>

          <div
            className={cn(
              "relative overflow-hidden rounded-2xl shadow-xl border border-surface-border max-w-full flex items-center justify-center bg-black/40",
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
              className="rounded-lg border border-surface-border px-3 py-1.5 text-xs disabled:opacity-40"
            >
              ← Sebelumnya
            </button>
            <span className="text-xs text-muted-foreground font-mono">
              {slideAktif + 1} / {slides.length}
            </span>
            <button
              type="button"
              disabled={slideAktif === slides.length - 1}
              onClick={() => setSlideAktif((p) => Math.min(slides.length - 1, p + 1))}
              className="rounded-lg border border-surface-border px-3 py-1.5 text-xs disabled:opacity-40"
            >
              Berikutnya →
            </button>
          </div>
        </div>

        {/* Kolom Kanan: Form Edit Slide Aktif */}
        <div className="space-y-4 rounded-xl border border-surface-border bg-surface p-4 sm:p-6 lg:col-span-6">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div>
              <h3 className="text-sm font-semibold">
                Edit Slide {slideAktif + 1}
              </h3>
              <p className="text-xs text-muted-foreground">
                Peran: <strong className="uppercase">{slide.peran}</strong>
              </p>
            </div>
            {slides.length > 3 ? (
              <button
                type="button"
                onClick={() => hapusSlide(slideAktif)}
                className="text-xs text-red-400 hover:underline"
              >
                Hapus slide ini
              </button>
            ) : null}
          </div>

          {/* Kicker (opsional) */}
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <label htmlFor="slide-kicker" className="font-medium text-muted-foreground">
                Kicker / Label Atas
              </label>
              <span
                className={cn(
                  kataKicker > BATAS_KATA_CAROUSEL.kicker
                    ? "text-red-400 font-semibold"
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
              className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          {/* Headline / Judul */}
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <label htmlFor="slide-headline" className="font-medium text-muted-foreground">
                {slide.peran === "cover" ? "Headline Utama" : "Judul Poin"}
              </label>
              <span
                className={cn(
                  kataJudul > batasJudul
                    ? "text-red-400 font-semibold"
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
              className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          {/* Isi Penjelasan */}
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <label htmlFor="slide-isi" className="font-medium text-muted-foreground">
                {slide.peran === "cta" ? "Ajakan Bertindak (CTA)" : "Isi Penjelasan"}
              </label>
              <span
                className={cn(
                  kataIsi > batasIsi
                    ? "text-red-400 font-semibold"
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
              className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          {/* Visual Pendukung AI (Pollinations.ai) */}
          <div className="rounded-xl border border-surface-border bg-muted/20 p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold">🎨 Visual Pendukung AI</span>
                <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-medium text-sky-400">
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
                  className="text-xs text-red-400 hover:underline"
                >
                  Hapus visual
                </button>
              ) : null}
            </div>

            <p className="mb-2 text-[11px] text-muted-foreground">
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
                className="w-full rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-xs outline-none focus:border-primary"
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
                className="flex-shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
              >
                {isGeneratingVisual ? "Membuat…" : "✨ Buat Visual"}
              </button>
            </div>
          </div>

          {/* Editor Caption & Hashtag */}
          <div className="border-t border-surface-border pt-4">
            <div className="mb-1 flex items-center justify-between text-xs">
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
              className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
            {onChangeHashtag ? (
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-xs">
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
                  className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
