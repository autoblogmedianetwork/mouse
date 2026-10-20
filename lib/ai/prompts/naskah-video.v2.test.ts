/** Prompt 9 v2 wrapper (ADR 0010): v1 content + language block, version intact. */
import { describe, expect, it } from "vitest";
import { buildNaskahVideoPrompt, PROMPT_VERSION } from "./naskah-video.v2";
import { PENGATURAN_AWAL, type Ide } from "../schemas";

const ide: Ide = {
  judul: "Tas Kanvas Buat Komuter",
  deskripsi: "Muat laptop, tahan gerimis.",
  jembatan: "Perjalanan kerja jadi santai.",
  format_label: "Listicle",
};

const input = {
  namaProduk: "Tas Kanvas Sleek",
  ringkasan: "Tas kanvas tahan air dengan kompartemen laptop.",
  fitur: ["Waterproof", "Jahitan ganda"],
  ide,
  pengaturan: { ...PENGATURAN_AWAL, persona: "ahli" } as typeof PENGATURAN_AWAL,
};

describe("prompt 09 naskah-video v2", () => {
  it("memakai penanda versi v2", () => {
    expect(PROMPT_VERSION).toBe("naskah-video.v2");
  });

  it("blok gaya bahasa natural ditambahkan di akhir", () => {
    const prompt = buildNaskahVideoPrompt(input);
    expect(prompt).toContain("GAYA BAHASA (WAJIB");
    expect(prompt).toContain("HARAM pembuka generik ala AI");
  });

  it("isi v1 tetap ada (struktur tiga bagian)", () => {
    const prompt = buildNaskahVideoPrompt(input);
    expect(prompt).toContain("hook_visual");
    expect(prompt).toContain("fungsi_produk");
    expect(prompt).toContain("cta");
  });
});
