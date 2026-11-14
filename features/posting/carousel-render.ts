/**
 * Renderer canvas carousel (refactor R6). Dipindah utuh dari
 * carousel-slide-editor.tsx — fungsi murni menggambar, tanpa React,
 * supaya bisa diuji dan dibaca terpisah dari UI editor.
 */
import type { CarouselSlide } from "@/lib/ai/schemas";
import { PENGATURAN_GAYA_AWAL } from "@/lib/konten/gaya-preset";
import type { GayaCarousel, RasioSlide, TemaSlide } from "./carousel-tipe";
import { TEMPLATE_CONFIG } from "./carousel-tipe";

/**
 * Menggambar satu slide ke canvas HTML5 beresolusi tinggi (1080x1350 atau 1080x1080).
 * Tipografi besar agar terbaca dan menarik di layar HP; teks panjang mengecil otomatis
 * (auto-shrink) supaya headline besar tetap aman tanpa terpotong (docs/fitur-carousel.md bagian 4).
 * Parameter `gaya` (panel "Gaya Slide") mengatur skala font, warna aksen, posisi blok teks,
 * dan kelonggaran jarak — berlaku seragam untuk preview dan unduhan PNG.
 */
export function renderSlideToCanvas(
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
