/** Prompt 3 v5 wrapper (ADR 0010): v4 content + language block, version intact. */
import { describe, expect, it } from "vitest";
import { buildGenerateStatusPrompt, PROMPT_VERSION } from "./generate-status.v5";
import { PENGATURAN_AWAL, type Ide } from "../schemas";

const ide: Ide = {
  judul: "5 Manfaat Tas Kanvas",
  deskripsi: "Bahan tebal, muat laptop.",
  jembatan: "Cocok untuk komuter.",
  format_label: "Listicle",
};

const input = (pengaturan: Partial<typeof PENGATURAN_AWAL> = {}) => ({
  namaProduk: "Tas Kanvas Sleek",
  ringkasan: "Tas kanvas tahan air dengan kompartemen laptop.",
  fitur: ["Waterproof", "Jahitan ganda"],
  ide,
  pengaturan: { ...PENGATURAN_AWAL, ...pengaturan },
  kategori: "hosting",
});

describe("prompt 03 generate-status v5", () => {
  it("memakai penanda versi v5", () => {
    expect(PROMPT_VERSION).toBe("generate-status.v5");
  });

  it("blok gaya bahasa natural ditambahkan di akhir", () => {
    const prompt = buildGenerateStatusPrompt(input());
    expect(prompt).toContain("GAYA BAHASA (WAJIB");
    expect(prompt).toContain("HARAM pembuka generik ala AI");
  });

  it("isi v4 (kategori penawaran dan aturan keras) tetap ada", () => {
    const prompt = buildGenerateStatusPrompt(input());
    expect(prompt).toContain("Kategori Penawaran (Hosting / SaaS)");
    expect(prompt).toContain("Setiap status MAKSIMAL 500 karakter");
  });
});
