import { describe, expect, it } from "vitest";
import { buildIdeMasalahPrompt, PROMPT_VERSION } from "./ide-masalah.v1";

describe("prompt mesin ide masalah v1", () => {
  it("menyisipkan masalah, kategori, produk, dan tuntutan 3 hook", () => {
    const prompt = buildIdeMasalahPrompt({
      masalah: "tas cepat kotor saat hujan",
      kategori: "fashion",
      produk: "Tas kanvas anti air",
    });

    expect(PROMPT_VERSION).toBe("ide-masalah.v1");
    expect(prompt).toContain("tas cepat kotor saat hujan");
    expect(prompt).toContain("fashion");
    expect(prompt).toContain("Tas kanvas anti air");
    expect(prompt).toContain("tepat 3 hook");
    expect(prompt).toContain("Balas HANYA dalam JSON valid");
  });

  it("memakai penanda default saat produk belum ditentukan", () => {
    const prompt = buildIdeMasalahPrompt({ masalah: "susah bangun pagi" });
    expect(prompt).toContain("belum ditentukan");
    expect(prompt).toContain("GAYA BAHASA (WAJIB");
  });
});
