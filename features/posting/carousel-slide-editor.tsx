"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CarouselSlide } from "@/lib/ai/schemas";
import { BATAS_KATA_CAROUSEL, hitungKata } from "@/lib/ai/schemas";
import {
  daftarPresetGaya,
  hapusPresetGaya,
  PENGATURAN_GAYA_AWAL,
  simpanPresetGaya,
  type GayaPreset,
} from "@/lib/konten/gaya-preset";
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
    bgCanvas: ["#050810", "#0d1526"],
    textPrimary: "#f8fafc",
    textSecondary: "#94a3b8",
    accent: "#22d3ee",
    cardBorder: "#1e293b",
  },
  light_clean: {
    nama: "Light Minimal",
    bgStyle: "bg-slate-50 text-slate-900",
    bgCanvas: ["#fcfdff", "#e9efea"],
    textPrimary: "#0f172a",
    textSecondary: "#64748b",
    accent: "#0ea474",
    cardBorder: "#e2e8f0",
  },
  bold_warm: {
    nama: "Bold Amber",
    bgStyle: "bg-zinc-950 text-zinc-100",
    bgCanvas: ["#15151a", "#09090b"],
    textPrimary: "#fafafa",
    textSecondary: "#a1a1aa",
    accent: "#fbbf24",
    cardBorder: "#27272a",
  },
};

/** Preferensi gaya global carousel dari panel "Gaya Slide". Global per carousel supaya
 * komposisi antar-slide tetap konsisten (docs/fitur-carousel.md bagian 4). */
export interface GayaCarousel {
  /** Pengali ukuran font seleuruh elemen teks, persen (70–150). */
  skalaFont: number;
  /** Warna aksen kustom hex; string kosong = ikut tema aktif. */
  warnaAksen: string;
  /** Penempatan blok teks slide cover/isi; CTA selalu terpusat. */
  posisiKonten: "atas" | "tengah";
  /** Pengali margin dan jarak antar elemen, persen (90–140) — penangkal teks "nempel". */
  ruangKeliling: number;
}


/**
 * Menggambar satu slide ke canvas HTML5 beresolusi tinggi (1080x1350 atau 1080x1080).
 * Tipografi besar agar terbaca dan menarik di layar HP; teks panjang mengecil otomatis
 * (auto-shrink) supaya headline besar tetap aman tanpa terpotong (docs/fitur-carousel.md bagian 4).
 * Parameter `gaya` (panel "Gaya Slide") mengatur skala font, warna aksen, posisi blok teks,
 * dan kelonggaran jarak — berlaku seragam untuk preview dan unduhan PNG.
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
  gaya: GayaCarousel = PENGATURAN_GAYA_AWAL,
) {
  const width = 1080;
  const height = rasio === "4:5" ? 1350 : 1080;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const conf = TEMPLATE_CONFIG[tema];
  const isCTA = slide.peran === "cta";
  const isCover = slide.peran === "cover";
  /** k: pengali ukuran teks; RU: pengali jarak/margin dari panel gaya. */
  const k = gaya.skalaFont / 100;
  const RU = gaya.ruangKeliling / 100;
  const accent = gaya.warnaAksen.trim() || conf.accent;
  const MARGIN = Math.round(80 * RU);
  const contentWidth = width - MARGIN * 2;
  const bottomLimit = height - 170;
  const onAccent = warnaTeksDiatas(accent);
  const adaVisualAI = Boolean(visualElement && visualElement.complete && visualElement.naturalWidth);

  // 1. Latar dasar: gradient vertikal tema
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, conf.bgCanvas[0]);
  grad.addColorStop(1, conf.bgCanvas[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 1a. Ilustrasi AI Pollinations: full-bleed dengan veil gradien — gambar tetap terlihat,
  // teks tetap kontras berkat veil yang menebal ke bawah.
  if (adaVisualAI && visualElement) {
    ctx.save();
    ctx.drawImage(visualElement, 0, 0, width, height);
    const veilTop = tema === "light_clean" ? "255,255,255" : "10,15,26";
    const veilBottom = tema === "light_clean" ? "255,255,255" : "9,13,22";
    const veil = ctx.createLinearGradient(0, 0, 0, height);
    veil.addColorStop(0, `rgba(${veilTop}, 0.30)`);
    veil.addColorStop(0.45, `rgba(${veilTop}, 0.55)`);
    veil.addColorStop(1, `rgba(${veilBottom}, 0.96)`);
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  } else {
    // 1b. Latar dinamis ketika tidak ada gambar: glow radial, pola diagonal halus,
    // ring dekoratif, dan watermark nomor raksasa samar.
    gambarGlow(ctx, 0, 0, width * 0.75, accent, 0.16);
    gambarGlow(ctx, width, height, width * 0.6, accent, 0.10);

    ctx.save();
    ctx.globalAlpha = 0.045;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    for (let s = -height; s < width + height; s += 64) {
      ctx.beginPath();
      ctx.moveTo(s, 0);
      ctx.lineTo(s + height, height);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(width - 60, height - 120, 230, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.arc(width - 60, height - 120, 300, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(MARGIN + 30, height - 260, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = accent;
    ctx.font = "bold 640px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(String(index + 1).padStart(2, "0"), width + 30, height + 150);
    ctx.textAlign = "left";
    ctx.restore();

    ctx.strokeStyle = conf.cardBorder;
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, width - 60, height - 60);
  }

  // 2. Header: kicker sebagai chip kapsul warna + badge nomor bundar
  const kickerTeks = (slide.kicker || (isCover ? "AFFILIATE PICK" : `POIN ${index + 1}`)).toUpperCase();
  const chipFontSize = Math.round((isCover ? 34 : 30) * k);
  ctx.font = `bold ${chipFontSize}px sans-serif`;
  const chipPadX = 40;
  const chipW = ctx.measureText(kickerTeks).width + chipPadX * 2;
  const chipH = chipFontSize + 40;
  const chipY = 96;
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.roundRect(MARGIN, chipY, chipW, chipH, chipH / 2);
  ctx.fill();
  ctx.fillStyle = onAccent;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(kickerTeks, MARGIN + chipW / 2, chipY + chipH / 2 + 1);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const badgeR = 40;
  const badgeCx = width - MARGIN - badgeR;
  const badgeCy = chipY + chipH / 2;
  ctx.beginPath();
  ctx.arc(badgeCx, badgeCy, badgeR, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.fillStyle = onAccent;
  ctx.font = `bold ${Math.round(32 * k)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(index + 1).padStart(2, "0"), badgeCx, badgeCy + 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // 3. Foto produk: besar, dengan bayangan lembut dan ring aksen
  let contentStartY = chipY + chipH + Math.round(70 * RU);
  if (imgElement && imgElement.complete && imgElement.naturalWidth) {
    const imgSize = rasio === "4:5" ? 480 : 360;
    const imgX = (width - imgSize) / 2;
    const imgY = chipY + chipH + Math.round(60 * RU);
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;
    ctx.fillStyle = conf.cardBorder;
    ctx.beginPath();
    ctx.roundRect(imgX - 4, imgY - 4, imgSize + 8, imgSize + 8, 36);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(imgX, imgY, imgSize, imgSize, 32);
    ctx.clip();
    ctx.drawImage(imgElement, imgX, imgY, imgSize, imgSize);
    ctx.restore();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(imgX, imgY, imgSize, imgSize, 32);
    ctx.stroke();
    contentStartY = imgY + imgSize + Math.round(64 * RU);
  }

  const judulTeks = slide.headline || slide.judul || "";
  const isiTeks = slide.isi || "";

  if (isCTA) {
    // Slide CTA: blok terpusat — headline besar (sampai 96px), isi 48px, lalu pill aksen besar
    const avail = bottomLimit - contentStartY;
    const sizeIsiCta = Math.round(48 * k);
    let tinggiIsi = 0;
    if (isiTeks) {
      ctx.font = `normal ${sizeIsiCta}px sans-serif`;
      tinggiIsi = wrapLines(ctx, isiTeks, contentWidth).length * sizeIsiCta * 1.35;
    }
    let sizeJudul = 0;
    let tinggiJudul = 0;
    if (judulTeks) {
      sizeJudul = cariUkuranFont(ctx, judulTeks, contentWidth, avail * 0.55, Math.round(96 * k), Math.round(56 * k));
      tinggiJudul = wrapLines(ctx, judulTeks, contentWidth).length * sizeJudul * 1.18;
    }
    const sizeJudulPill = Math.round(46 * k);
    const tinggiPill = sizeJudulPill + 64;
    const tinggiBlok = tinggiJudul + (tinggiJudul ? Math.round(40 * RU) : 0) + tinggiIsi + (tinggiIsi ? Math.round(48 * RU) : 0) + tinggiPill;
    let cy = contentStartY + Math.max(0, (avail - tinggiBlok) / 2);

    if (judulTeks) {
      ctx.fillStyle = conf.textPrimary;
      ctx.font = `bold ${sizeJudul}px sans-serif`;
      cy = drawWrappedText(ctx, judulTeks, width / 2, cy, contentWidth, sizeJudul * 1.18, "center") + Math.round(40 * RU);
    }
    if (isiTeks) {
      ctx.fillStyle = conf.textSecondary;
      ctx.font = `normal ${sizeIsiCta}px sans-serif`;
      cy = drawWrappedText(ctx, isiTeks, width / 2, cy, contentWidth, sizeIsiCta * 1.35, "center") + Math.round(48 * RU);
    }

    const pilTeks = "Link di Bio 👉";
    ctx.font = `bold ${Math.round(46 * k)}px sans-serif`;
    const pillW = ctx.measureText(pilTeks).width + Math.round(110 * RU);
    const pillX = width / 2 - pillW / 2;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.roundRect(pillX, cy, pillW, tinggiPill, tinggiPill / 2);
    ctx.fill();
    ctx.fillStyle = onAccent;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pilTeks, width / 2, cy + tinggiPill / 2 + 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  } else {
    // Slide cover / isi: komposisi poster — blok teks dipusatkan vertikal dengan headline raksasa
    const avail = bottomLimit - contentStartY;
    let tinggiIsi = 0;
    let sizeIsi = Math.round(46 * k);
    if (isiTeks) {
      ctx.font = `normal ${sizeIsi}px sans-serif`;
      tinggiIsi = wrapLines(ctx, isiTeks, contentWidth).length * sizeIsi * 1.35;
      if (tinggiIsi > avail * 0.4) {
        sizeIsi = Math.max(32, Math.round(40 * k));
        tinggiIsi = wrapLines(ctx, isiTeks, contentWidth).length * sizeIsi * 1.35;
      }
    }
    let sizeJudul = 0;
    let tinggiJudul = 0;
    if (judulTeks) {
      const ruangJudul = Math.max(160, avail - tinggiIsi - (isiTeks ? Math.round(40 * RU) : 0) - Math.round(46 * RU));
      sizeJudul = cariUkuranFont(
        ctx, judulTeks, contentWidth, ruangJudul,
        Math.round((isCover ? 120 : 76) * k),
        Math.round((isCover ? 56 : 48) * k),
      );
      tinggiJudul = wrapLines(ctx, judulTeks, contentWidth).length * sizeJudul * 1.15;
    }
    const tinggiBar = judulTeks ? Math.round(46 * RU) : 0; // bar aksen di bawah headline
    const tinggiBlok = tinggiJudul + tinggiBar + (isiTeks ? Math.round(40 * RU) + tinggiIsi : 0);
    // Posisi panel gaya: "atas" menempel blok teks ke atas area konten; "tengah" dipusatkan
    let cursorY =
      gaya.posisiKonten === "atas"
        ? contentStartY
        : contentStartY + Math.max(0, (avail - tinggiBlok) / 2);

    if (judulTeks) {
      ctx.fillStyle = conf.textPrimary;
      ctx.font = `bold ${sizeJudul}px sans-serif`;
      cursorY = drawWrappedText(ctx, judulTeks, MARGIN, cursorY, contentWidth, sizeJudul * 1.15) + Math.round(24 * RU);
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.roundRect(MARGIN, cursorY, 140, 12, 6);
      ctx.fill();
      cursorY += tinggiBar;
    }
    if (isiTeks) {
      ctx.fillStyle = conf.textSecondary;
      ctx.font = `normal ${sizeIsi}px sans-serif`;
      drawWrappedText(ctx, isiTeks, MARGIN, cursorY + Math.round(40 * RU), contentWidth, sizeIsi * 1.35);
    } else if (!judulTeks) {
      cursorY += Math.round(40 * RU);
    }
  }

  // 4. Footer: handle akun, ajakan geser, dan bar progres slide
  ctx.fillStyle = conf.textSecondary;
  ctx.font = `normal ${Math.round(30 * k)}px sans-serif`;
  ctx.fillText(handleAkun ? `@${handleAkun.replace(/^@/, "")}` : "Threads", MARGIN, height - 104);

  const swipeText = isCTA ? "Cek link di bio 👉" : "Geser untuk lanjut 👉";
  ctx.fillStyle = accent;
  ctx.font = `bold ${Math.round(30 * k)}px sans-serif`;
  const swipeWidth = ctx.measureText(swipeText).width;
  ctx.fillText(swipeText, width - MARGIN - swipeWidth, height - 104);

  const trackY = height - 76;
  ctx.fillStyle = conf.cardBorder;
  ctx.beginPath();
  ctx.roundRect(MARGIN, trackY, contentWidth, 8, 4);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.roundRect(MARGIN, trackY, Math.max(24, contentWidth * ((index + 1) / totalSlides)), 8, 4);
  ctx.fill();
}

/** Warna teks yang detak terbaca di atas blok berwarna aksen mana pun (luminansi). */
function warnaTeksDiatas(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) || 0;
  const g = parseInt(h.slice(2, 4), 16) || 0;
  const b = parseInt(h.slice(4, 6), 16) || 0;
  const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return l > 0.65 ? "#0b1220" : "#ffffff";
}

/** Konversi warna hex (#rrggbb) ke rgba dengan alpha untuk glow dan pola. */
function denganAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Glow radial lembut di titik (x, y) untuk memecah latar polos. */
function gambarGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  warna: string,
  alpha: number,
) {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0, denganAlpha(warna, alpha));
  grad.addColorStop(1, denganAlpha(warna, 0));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Mencari ukuran font terbesar (dari maxSize turun 4px per langkah) yang
 * membuat teks pas di ruang maxWidth x maxHeight. Nomor terbesar yang muat menang.
 */
function cariUkuranFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxHeight: number,
  maxSize: number,
  minSize: number,
  rasioTinggiBaris = 1.18,
): number {
  for (let size = maxSize; size >= minSize; size -= 4) {
    ctx.font = `bold ${size}px sans-serif`;
    const tinggi = wrapLines(ctx, text, maxWidth).length * size * rasioTinggiBaris;
    if (tinggi <= maxHeight) return size;
  }
  return minSize;
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  align: "left" | "center" = "left",
): number {
  if (!text) return y;
  const lines = wrapLines(ctx, text, maxWidth);
  if (align === "center") ctx.textAlign = "center";
  let currentY = y;
  for (const line of lines) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  if (align === "center") ctx.textAlign = "left";
  // Posisi baseline baris terakhir.
  return currentY - lineHeight;
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
  const [gaya, setGaya] = useState<GayaCarousel>(PENGATURAN_GAYA_AWAL);

  const ubahGaya = (patch: Partial<GayaCarousel>) => setGaya((g) => ({ ...g, ...patch }));

  // Preset gaya per akun (tabel carousel_gaya_preset, migrasi 0009).
  const KUNCI_PRESET_TERAKHIR = "heaviliate:preset_gaya_terakhir";
  const [presets, setPresets] = useState<GayaPreset[]>([]);
  const [presetDipilih, setPresetDipilih] = useState("");
  const [namaPresetBaru, setNamaPresetBaru] = useState("");
  const [presetMemuat, setPresetMemuat] = useState(false);
  const [pesanPreset, setPesanPreset] = useState<string | null>(null);

  const tampilkanPesanPreset = (pesan: string) => {
    setPesanPreset(pesan);
    setTimeout(() => setPesanPreset(null), 3000);
  };

  const muatDaftarPreset = useCallback(async (): Promise<GayaPreset[]> => {
    try {
      setPresetMemuat(true);
      const daftar = await daftarPresetGaya();
      setPresets(daftar);
      return daftar;
    } catch (err) {
      tampilkanPesanPreset(err instanceof Error ? err.message : "Gagal memuat preset.");
      return [];
    } finally {
      setPresetMemuat(false);
    }
  }, []);

  // Muat sekali saat editor terbuka; terapkan otomatis preset terakhir yang dipakai
  // supaya setiap carousel baru langsung punya gaya yang sama.
  useEffect(() => {
    (async () => {
      const daftar = await muatDaftarPreset();
      const idTerakhir = window.localStorage.getItem(KUNCI_PRESET_TERAKHIR);
      const pilih = daftar.find((p) => p.id === idTerakhir);
      if (pilih) {
        setGaya(pilih.gaya);
        setPresetDipilih(pilih.id);
      }
    })();
  }, [muatDaftarPreset]);

  const terapkanPreset = (p: GayaPreset) => {
    setGaya(p.gaya);
    setPresetDipilih(p.id);
    window.localStorage.setItem(KUNCI_PRESET_TERAKHIR, p.id);
    tampilkanPesanPreset(`Preset "${p.nama}" diterapkan ke semua slide.`);
  };

  const simpanPresetSekarang = async () => {
    const namaLama = presets.find((p) => p.id === presetDipilih)?.nama ?? "";
    const nama = namaPresetBaru.trim() || namaLama;
    if (!nama) {
      tampilkanPesanPreset("Tulis nama preset dulu di kolom nama.");
      return;
    }
    try {
      setPresetMemuat(true);
      const tersimpan = await simpanPresetGaya(nama, gaya);
      setNamaPresetBaru("");
      await muatDaftarPreset();
      setPresetDipilih(tersimpan.id);
      window.localStorage.setItem(KUNCI_PRESET_TERAKHIR, tersimpan.id);
      tampilkanPesanPreset(`Preset "${tersimpan.nama}" tersimpan di akun.`);
    } catch (err) {
      tampilkanPesanPreset(err instanceof Error ? err.message : "Gagal menyimpan preset.");
    } finally {
      setPresetMemuat(false);
    }
  };

  const hapusPresetSekarang = async () => {
    const p = presets.find((x) => x.id === presetDipilih);
    if (!p) return;
    try {
      setPresetMemuat(true);
      await hapusPresetGaya(p.id);
      setPresets((daftar) => daftar.filter((x) => x.id !== p.id));
      window.localStorage.removeItem(KUNCI_PRESET_TERAKHIR);
      setPresetDipilih("");
      tampilkanPesanPreset(`Preset "${p.nama}" dihapus.`);
    } catch (err) {
      tampilkanPesanPreset(err instanceof Error ? err.message : "Gagal menghapus preset.");
    } finally {
      setPresetMemuat(false);
    }
  };
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

      {/* Panel gaya: kontrol global seluruh slide — skala teks, warna aksen, posisi, kelonggaran */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-surface-border bg-surface p-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          🎨 Gaya
        </span>

        <label className="flex items-center gap-2 text-xs text-muted-foreground">
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

        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Warna aksen
          <input
            type="color"
            value={gaya.warnaAksen || TEMPLATE_CONFIG[tema].accent}
            onChange={(e) => ubahGaya({ warnaAksen: e.target.value })}
            className="h-7 w-9 cursor-pointer rounded border border-surface-border bg-transparent"
          />
        </label>

        <button
          type="button"
          onClick={() => ubahGaya({ warnaAksen: "" })}
          className={cn(
            "rounded-lg border px-3 py-1 text-xs font-medium transition-colors",
            gaya.warnaAksen
              ? "border-surface-border text-muted-foreground hover:text-foreground"
              : "border-primary bg-primary/10 text-primary font-semibold",
          )}
        >
          Ikut Tema
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Posisi:</span>
          <div className="flex rounded-lg border border-surface-border bg-muted/30 p-1">
            {(["atas", "tengah"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => ubahGaya({ posisiKonten: p })}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors",
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

        <label className="flex items-center gap-2 text-xs text-muted-foreground">
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
          className="ml-auto rounded-lg border border-surface-border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          ↺ Reset gaya
        </button>
      </div>

      {/* Preset gaya: tersimpan per akun di tabel carousel_gaya_preset (migrasi 0009).
          Preset terakhir yang dipakai otomatis diterapkan saat editor dibuka. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-surface-border bg-surface p-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          💾 Preset gaya
        </span>
        <select
          value={presetDipilih}
          onChange={(e) => {
            const p = presets.find((x) => x.id === e.target.value);
            if (p) terapkanPreset(p);
            else setPresetDipilih("");
          }}
          className="rounded-lg border border-surface-border bg-background px-2 py-1.5 text-xs"
        >
          <option value="">Pilih preset…</option>
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={namaPresetBaru}
          onChange={(e) => setNamaPresetBaru(e.target.value)}
          maxLength={40}
          placeholder="Nama preset baru"
          className="w-40 rounded-lg border border-surface-border bg-background px-2 py-1.5 text-xs"
        />
        <button
          type="button"
          onClick={simpanPresetSekarang}
          disabled={presetMemuat}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          Simpan gaya ini
        </button>
        <button
          type="button"
          onClick={hapusPresetSekarang}
          disabled={!presetDipilih || presetMemuat}
          className="rounded-lg border border-surface-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          Hapus
        </button>
        {pesanPreset ? <span className="text-xs text-muted-foreground">{pesanPreset}</span> : null}
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
