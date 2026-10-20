/** Prompt 2 v2 wrapper (ADR 0010): v1 content + language block, version intact. */
import { describe, expect, it } from "vitest";
import { buildIdeKontenPrompt, PROMPT_VERSION } from "./ide-konten.v2";

describe("prompt 02 ide-konten v2", () => {
  const input = {
    namaProduk: "Tas Kanvas",
    ringkasan: "Tas tahan air, muat laptop 15 inci.",
    fitur: ["Waterproof", "Jahitan ganda"],
    target_audiens: ["mahasiswa", "pekerja kantoran"],
    angle: [{ judul: "Tas anti gerimis", alasan: "Audiens komuter sering kehujanan." }],
  };

  it("memakai penanda versi v2", () => {
    expect(PROMPT_VERSION).toBe("ide-konten.v2");
  });

  it("blok gaya bahasa natural ditambahkan di akhir", () => {
    const prompt = buildIdeKontenPrompt(input);
    expect(prompt).toContain("GAYA BAHASA (WAJIB");
    expect(prompt).toContain("HARAM pembuka generik ala AI");
  });

  it("isi v1 tetap ada (tepat 10 ide dan label format)", () => {
    const prompt = buildIdeKontenPrompt(input);
    expect(prompt).toContain("tepat 10 ide");
    expect(prompt).toContain("Listicle");
  });
});
