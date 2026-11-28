import { describe, expect, it } from "vitest";
import { PROMPT_VERSION, buildBedahPostinganPrompt } from "./bedah-postingan.v1";
import { bedahPostinganSkema } from "@/lib/ai/schemas";

describe("buildBedahPostinganPrompt", () => {
  it("memuat postingan user dan versi v1", () => {
    const prompt = buildBedahPostinganPrompt({
      postingan: "Rice cooker ini saya pakai 2 tahun, masih ajib.",
    });
    expect(PROMPT_VERSION).toBe("bedah-postingan.v1");
    expect(prompt).toContain("Rice cooker ini saya pakai 2 tahun");
    expect(prompt).toContain("MEMBEDAH");
  });

  it("memuat aturan anti-plagiat dan larangan sebut nama", () => {
    const prompt = buildBedahPostinganPrompt({ postingan: "a".repeat(50) });
    expect(prompt).toContain("5 kata berturut-turut");
    expect(prompt).toContain("JANGAN menyebut nama");
  });

  it("memuat daftar jenis hook dan CTA yang harus dipilih AI", () => {
    const prompt = buildBedahPostinganPrompt({ postingan: "a".repeat(50) });
    expect(prompt).toContain("masalah_relatif");
    expect(prompt).toContain("cek_bio");
    expect(prompt).toContain("tidak_ada");
  });
});

describe("bedahPostinganSkema", () => {
  it("menerima bedah lengkap yang valid", () => {
    const hasil = bedahPostinganSkema.safeParse({
      hook: { jenis: "pertanyaan", penjelasan: "dibuka pertanyaan singkat" },
      cta: { ada: true, jenis: "tanya_di_komentar", penjelasan: "mengundang komentar" },
      panjang_karakter: 320,
      jumlah_bagian: 3,
      struktur: ["masalah", "pengalaman", "ajakan"],
      pelajaran: ["Hook pertanyaan singkat cocok untuk produk harian"],
      kejujuran: "baik",
      peringatan: "",
    });
    expect(hasil.success).toBe(true);
  });

  it("menolak jenis hook di luar daftar dan pelajaran kosong", () => {
    const salah = bedahPostinganSkema.safeParse({
      hook: { jenis: "clickbait", penjelasan: "x" },
      cta: { ada: false, jenis: "tidak_ada", penjelasan: "" },
      panjang_karakter: 100,
      jumlah_bagian: 1,
      struktur: ["masalah"],
      pelajaran: [],
      kejujuran: "baik",
      peringatan: "",
    });
    expect(salah.success).toBe(false);
  });
});
