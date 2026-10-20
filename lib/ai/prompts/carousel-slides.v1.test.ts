import { describe, expect, it } from "vitest";
import {
  PENGATURAN_AWAL,
  carouselResponseSkema,
  carouselSlideSkema,
  hitungKata,
  BATAS_KATA_CAROUSEL,
  type Ide,
  type Pengaturan,
} from "../schemas";
import {
  buildCarouselPrompt,
  PROMPT_VERSION,
  type CarouselPromptInput,
} from "./carousel-slides.v1";
import { ambilPersona } from "../persona";

const ide: Ide = {
  judul: "5 Alasan Tas Kanvas Ini Awet",
  deskripsi: "Bahan kanvas tebal dengan jahitan ganda.",
  jembatan: "Cocok untuk mahasiswa dan pekerja komuter.",
  format_label: "Listicle",
};

function input(pengaturan: Partial<Pengaturan> = {}, extra: Partial<CarouselPromptInput> = {}): CarouselPromptInput {
  return {
    namaProduk: "Tas Kanvas Sleek",
    ringkasan: "Tas kanvas tahan air dengan kompartemen laptop.",
    fitur: ["Waterproof", "Muat laptop 15 inci", "Jahitan ganda"],
    ide,
    pengaturan: { ...PENGATURAN_AWAL, persona: "ahli", ...pengaturan } as Pengaturan,
    jumlahSlide: 5,
    ...extra,
  };
}

describe("prompt 08 carousel slides v1", () => {
  it("memakai penanda versi v1", () => {
    expect(PROMPT_VERSION).toBe("carousel-slides.v1");
  });

  it("memuat aturan jumlah slide default 5 dan peran cover/isi/cta", () => {
    const prompt = buildCarouselPrompt(input());
    expect(prompt).toContain("Jumlah slide: 5");
    expect(prompt).toContain("Slide 1 (cover)");
    expect(prompt).toContain("Slide terakhir (CTA)");
    expect(prompt).toContain("peran \"cover\"");
    expect(prompt).toContain("peran \"isi\"");
    expect(prompt).toContain("peran \"cta\"");
  });

  it("mencantumkan batasan kata per peran", () => {
    const prompt = buildCarouselPrompt(input());
    expect(prompt).toContain("kicker (label kecil maksimal 3 kata)");
    expect(prompt).toContain("headline (maksimal 8 kata)");
    expect(prompt).toContain("judul (maksimal 6 kata)");
    expect(prompt).toContain("isi penjelasan (maksimal 25 kata)");
    expect(prompt).toContain("ajakan halus (maksimal 12 kata)");
  });

  it("mengirim data produk dan persona", () => {
    const prompt = buildCarouselPrompt(input());
    expect(prompt).toContain("Tas Kanvas Sleek");
    expect(prompt).toContain(ambilPersona("ahli").deskripsi_nada);
  });

  it("menyesuaikan jumlah slide jika diatur user (3 sampai 10)", () => {
    const prompt3 = buildCarouselPrompt(input({}, { jumlahSlide: 3 }));
    expect(prompt3).toContain("Jumlah slide: 3");
    expect(prompt3).toContain("Slide 2 sampai 2 (isi)");

    const prompt7 = buildCarouselPrompt(input({}, { jumlahSlide: 7 }));
    expect(prompt7).toContain("Jumlah slide: 7");
  });
});

describe("skema carouselResponseSkema & carouselSlideSkema", () => {
  const validSlides = [
    {
      urutan: 1,
      peran: "cover" as const,
      kicker: "Review Jujur",
      headline: "Tas Kanvas Terbaik Buat Ngantor",
      judul: null,
      isi: null,
    },
    {
      urutan: 2,
      peran: "isi" as const,
      kicker: null,
      headline: null,
      judul: "Bahan Tahan Air",
      isi: "Kain kanvas berlapis nano coating tahan cipratan hujan.",
    },
    {
      urutan: 3,
      peran: "cta" as const,
      kicker: null,
      headline: null,
      judul: "Cek Link Produk",
      isi: "Link pembelian ada di komentar pertama.",
    },
  ];

  const validResponse = {
    slides: validSlides,
    caption: "Ulasan tas kanvas yang tahan air dan muat laptop. #affiliate",
    hashtag: ["taskanvas", "rekomendasi"],
    klaim_perlu_cek: [],
  };

  it("menerima jawaban carousel valid", () => {
    expect(carouselResponseSkema.safeParse(validResponse).success).toBe(true);
    expect(carouselSlideSkema.safeParse(validSlides[0]).success).toBe(true);
  });

  it("menolak jika jumlah slide kurang dari 3", () => {
    const res = carouselResponseSkema.safeParse({
      ...validResponse,
      slides: validSlides.slice(0, 2),
    });
    expect(res.success).toBe(false);
  });

  it("menolak jika jumlah slide lebih dari 10", () => {
    const banyak = Array.from({ length: 11 }, (_, i) => ({
      urutan: i + 1,
      peran: "isi" as const,
      judul: `Judul ${i + 1}`,
      isi: `Isi penjelasan ${i + 1}`,
    }));
    const res = carouselResponseSkema.safeParse({
      ...validResponse,
      slides: banyak,
    });
    expect(res.success).toBe(false);
  });

  it("menolak caption yang melebihi batas 2200 karakter", () => {
    const panjang = "x".repeat(2201);
    expect(carouselResponseSkema.safeParse({ ...validResponse, caption: panjang }).success).toBe(false);
  });

  it("menolak jika hashtag lebih dari 5", () => {
    expect(
      carouselResponseSkema.safeParse({
        ...validResponse,
        hashtag: ["1", "2", "3", "4", "5", "6"],
      }).success,
    ).toBe(false);
  });
});

describe("helper hitungKata", () => {
  it("menghitung jumlah kata dengan benar", () => {
    expect(hitungKata("")).toBe(0);
    expect(hitungKata(null)).toBe(0);
    expect(hitungKata("Satu dua tiga")).toBe(3);
    expect(hitungKata("   Banyak    spasi   di   antara   ")).toBe(4);
  });

  it("konstanta batas kata sesuai spesifikasi", () => {
    expect(BATAS_KATA_CAROUSEL.cover_headline).toBe(8);
    expect(BATAS_KATA_CAROUSEL.isi_penjelasan).toBe(25);
    expect(BATAS_KATA_CAROUSEL.cta).toBe(12);
  });
});
