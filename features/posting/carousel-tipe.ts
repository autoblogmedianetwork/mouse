/**
 * Tipe & konfigurasi tema editor carousel (refactor R6).
 * Dipisah dari carousel-slide-editor.tsx supaya renderer canvas dan panel
 * preset memakai satu sumber definisi.
 */
import type { CarouselSlide } from "@/lib/ai/schemas";

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

export const TEMPLATE_CONFIG: Record<
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
