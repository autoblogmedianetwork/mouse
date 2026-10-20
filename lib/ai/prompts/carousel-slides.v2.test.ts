/** Prompt 8 v2 wrapper (ADR 0010): v1 content + language block, version intact. */
import { describe, expect, it } from "vitest";
import { buildCarouselPrompt, PROMPT_VERSION } from "./carousel-slides.v2";
import { PENGATURAN_AWAL, type Ide, type Pengaturan } from "../schemas";
import type { CarouselPromptInput } from "./carousel-slides.v1";

const ide: Ide = {
  judul: "5 Alasan Tas Kanvas Ini Awet",
  deskripsi: "Bahan kanvas tebal.",
  jembatan: "Cocok untuk komuter.",
  format_label: "Listicle",
};

const input = (pengaturan: Partial<Pengaturan> = {}, extra: Partial<CarouselPromptInput> = {}): CarouselPromptInput => ({
  namaProduk: "Tas Kanvas Sleek",
  ringkasan: "Tas kanvas tahan air dengan kompartemen laptop.",
  fitur: ["Waterproof", "Jahitan ganda"],
  ide,
  pengaturan: { ...PENGATURAN_AWAL, persona: "ahli", ...pengaturan } as Pengaturan,
  jumlahSlide: 5,
  ...extra,
});

describe("prompt 08 carousel-slides v2", () => {
  it("memakai penanda versi v2", () => {
    expect(PROMPT_VERSION).toBe("carousel-slides.v2");
  });

  it("blok gaya bahasa natural ditambahkan di akhir", () => {
    const prompt = buildCarouselPrompt(input());
    expect(prompt).toContain("GAYA BAHASA (WAJIB");
    expect(prompt).toContain("HARAM pembuka generik ala AI");
  });

  it("isi v1 tetap ada (cover/isi/cta dan caption)", () => {
    const prompt = buildCarouselPrompt(input());
    expect(prompt).toContain('"peran": "cover"');
    expect(prompt).toContain('"caption"');
  });
});
