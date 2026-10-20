/** Prompt 1 v3 wrapper (ADR 0010): v2 content + language block, version intact. */
import { describe, expect, it } from "vitest";
import { buildAnalisisPenawaranPrompt, PROMPT_VERSION } from "./analisis-penawaran.v3";

describe("prompt 01 analisis-penawaran v3", () => {
  it("memakai penanda versi v3", () => {
    expect(PROMPT_VERSION).toBe("analisis-penawaran.v3");
  });

  it("cabang marketplace dan non-marketplace tetap dari v2", () => {
    const marketplace = buildAnalisisPenawaranPrompt({ deskripsi: "Deskripsi produk dari halaman." });
    const saas = buildAnalisisPenawaranPrompt({
      deskripsi: "Hosting dengan uptime 99,9%.",
      nama: "Hos Kita",
      kategori: "hosting",
    });
    expect(marketplace).toContain("halaman Shopee");
    expect(saas).toContain("analis penawaran affiliate teknologi");
  });

  it("blok gaya bahasa natural ditambahkan di akhir", () => {
    const prompt = buildAnalisisPenawaranPrompt({ deskripsi: "Deskripsi produk." });
    expect(prompt).toContain("GAYA BAHASA (WAJIB");
    expect(prompt).toContain("HARAM pembuka generik ala AI");
  });
});
