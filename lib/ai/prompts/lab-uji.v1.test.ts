import { describe, expect, it } from "vitest";
import { buildLabUjiPrompt, PROMPT_VERSION } from "./lab-uji.v1";

describe("prompt lab uji v1", () => {
  it("memuat ketiga persona, konten, dan instruksi JSON", () => {
    const prompt = buildLabUjiPrompt({
      statuses: ["Tumbler ini bikin pagi lebih rapi.", "Cek link di bio ya."],
      produk: "Tumbler 500ml",
    });

    expect(PROMPT_VERSION).toBe("lab-uji.v1");
    expect(prompt).toContain("skeptis");
    expect(prompt).toContain("ibu_muda");
    expect(prompt).toContain("mahasiswa");
    expect(prompt).toContain("[2] Cek link di bio ya.");
    expect(prompt).toContain("Tumbler 500ml");
    expect(prompt).toContain("Balas HANYA dalam JSON valid");
  });

  it("tetap menyertakan gaya bahasa dan larangan klaim absolut", () => {
    const prompt = buildLabUjiPrompt({ statuses: ["Halo"] });
    expect(prompt).toContain("GAYA BAHASA (WAJIB");
    expect(prompt.toLowerCase()).toContain("klaim berlebihan");
  });
});
