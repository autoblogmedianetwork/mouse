import { describe, expect, it } from "vitest";
import { buildSerial7Prompt, PROMPT_VERSION } from "./serial-7-hari.v1";

describe("prompt serial 7 hari v1", () => {
  it("memuat deskripsi produk, alur 7 hari, dan batas 500 karakter", () => {
    const prompt = buildSerial7Prompt({
      namaProduk: "Botol minum 1 liter",
      deskripsi: "Botol stainless dengan penutup ulir, tahan bocor, muat 1 liter.",
      masalah: "sering lupa minum saat kerja",
    });

    expect(PROMPT_VERSION).toBe("serial-7-hari.v1");
    expect(prompt).toContain("Botol minum 1 liter");
    expect(prompt).toContain("tahan bocor");
    expect(prompt).toContain("Hari 1-2");
    expect(prompt).toContain("Hari 7");
    expect(prompt).toContain("500");
    expect(prompt).toContain("Balas HANYA dalam JSON valid");
  });

  it("melarang klaim absolut dan menyertakan gaya bahasa", () => {
    const prompt = buildSerial7Prompt({ namaProduk: "X", deskripsi: "Produk contoh panjang." });
    expect(prompt).toContain("dijamin");
    expect(prompt).toContain("GAYA BAHASA (WAJIB");
  });
});
