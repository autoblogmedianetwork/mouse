import { describe, expect, it } from "vitest";
import { PROMPT_VERSION, buildUtasPanjangPrompt } from "./utas-panjang.v1";
import { utasPanjangSkema } from "@/lib/ai/schemas";

describe("buildUtasPanjangPrompt", () => {
  it("memuat nama produk, fakta, dan versi v1", () => {
    const prompt = buildUtasPanjangPrompt({
      produkNama: "Rice cooker 1.8L",
      fakta: "Saya pakai 2 tahun, panci anti lengket masih bagus.",
      panjangTarget: "6000",
    });
    expect(PROMPT_VERSION).toBe("utas-panjang.v1");
    expect(prompt).toContain("Rice cooker 1.8L");
    expect(prompt).toContain("Saya pakai 2 tahun");
    expect(prompt).toContain("5.000-6.000");
  });

  it("target 10.000 menyebut batas maksimal", () => {
    const prompt = buildUtasPanjangPrompt({
      produkNama: "X",
      fakta: "a".repeat(30),
      panjangTarget: "10000",
    });
    expect(prompt).toContain("MAKSIMAL 10.000");
  });

  it("memuat aturan jujur: kekurangan wajib dan larangan janji pasti", () => {
    const prompt = buildUtasPanjangPrompt({
      produkNama: "X",
      fakta: "a".repeat(30),
      panjangTarget: "3000",
    });
    expect(prompt).toContain("Kekurangan");
    expect(prompt).toContain("dilarang");
  });

  it("menyisipkan gaya bicara user bila ada", () => {
    const prompt = buildUtasPanjangPrompt({
      produkNama: "X",
      fakta: "a".repeat(30),
      panjangTarget: "3000",
      gayaBicara: "Sering memakai kata 'lumayan'.",
    });
    expect(prompt).toContain("lumayan");
  });
});

describe("utasPanjangSkema", () => {
  it("menerima utas valid", () => {
    const hasil = utasPanjangSkema.safeParse({
      teks: "a".repeat(250),
      struktur: ["pembuka", "detail", "penutup"],
      catatan: "",
    });
    expect(hasil.success).toBe(true);
  });

  it("menolak teks di atas 10.000 karakter", () => {
    const hasil = utasPanjangSkema.safeParse({
      teks: "a".repeat(10001),
      struktur: ["pembuka", "detail", "penutup"],
      catatan: "",
    });
    expect(hasil.success).toBe(false);
  });

  it("menolak struktur kurang dari 3 bagian", () => {
    const hasil = utasPanjangSkema.safeParse({
      teks: "a".repeat(250),
      struktur: ["pembuka"],
      catatan: "",
    });
    expect(hasil.success).toBe(false);
  });
});
