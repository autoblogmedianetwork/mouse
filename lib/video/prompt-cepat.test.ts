/** Mode cepat: satu prompt untuk Gemini Omni di Google Flow (ADR 0019). */
import { describe, expect, it } from "vitest";
import { LANGKAH_PROMPT_CEPAT, PROMPT_CEPAT_VERSI, susunPromptCepat } from "./prompt-cepat";
import { NEGATIVE_PROMPT } from "./prompt-flow";

describe("susunPromptCepat", () => {
  it("memakai penanda versi sendiri", () => {
    expect(PROMPT_CEPAT_VERSI).toBe("foto-ke-video-cepat.v1");
  });

  it("memuat ketentuan inti alur Flow", () => {
    const prompt = susunPromptCepat({
      namaProduk: "Rice Cooker 1,8 L",
      deskripsi: "Warm 12 jam",
      durasiDetik: 10,
      jumlahScene: 6,
    });
    expect(prompt).toContain("storyboard 10 detik");
    expect(prompt).toContain("aspek rasio 9:16");
    expect(prompt).toContain("6 scene");
    expect(prompt).toContain("Fokus ke barang 100% sama seperti gambar");
    expect(prompt).toContain("Ukuran produk di frame wajar");
    expect(prompt).toContain("bubble text");
    expect(prompt).toContain("sound effect");
    expect(prompt).toContain("Voice-over Bahasa Indonesia kasual");
  });

  it("tidak menampilkan orang sama sekali", () => {
    const prompt = susunPromptCepat({ namaProduk: "X", deskripsi: "Y" });
    expect(prompt).toContain("Jangan tampilkan wajah atau tubuh orang sama sekali.");
    expect(prompt).not.toContain("model wanita");
    expect(prompt).not.toContain("referensi wajah");
  });

  it("selalu membawa negative prompt lengkap", () => {
    const prompt = susunPromptCepat({ namaProduk: "X", deskripsi: "Y" });
    expect(prompt).toContain(`Negative prompt: ${NEGATIVE_PROMPT}`);
    expect(prompt).toContain("no shopping cart icon");
    expect(prompt).toContain('no text "klik keranjang"');
    expect(prompt).toContain('no text "check out"');
    expect(prompt).toContain('no text "stok habis"');
    expect(prompt).toContain("no human face");
  });

  it("menjepit jumlah scene ke batas 3–6", () => {
    expect(susunPromptCepat({ namaProduk: "X", deskripsi: "Y", jumlahScene: 9 })).toContain(
      "6 scene",
    );
    expect(susunPromptCepat({ namaProduk: "X", deskripsi: "Y", jumlahScene: 1 })).toContain(
      "3 scene",
    );
  });

  it("memasukkan informasi produk dan instruksi tambahan", () => {
    const prompt = susunPromptCepat({
      namaProduk: "Rice Cooker",
      varian: "Putih",
      deskripsi: "Warm 12 jam",
      instruksiTambahan: "Latar dapur kayu",
    });
    expect(prompt).toContain("- Nama: Rice Cooker");
    expect(prompt).toContain("- Varian: Putih");
    expect(prompt).toContain("- Deskripsi: Warm 12 jam");
    expect(prompt).toContain("Instruksi tambahan: Latar dapur kayu");
  });

  it("menandai kolom kosong, bukan mengosongkannya", () => {
    const prompt = susunPromptCepat({ namaProduk: "", deskripsi: "" });
    expect(prompt).toContain("- Nama: (tidak diisi)");
    expect(prompt).toContain("- Deskripsi: (tidak diisi)");
  });
});

describe("LANGKAH_PROMPT_CEPAT", () => {
  it("menyebut unggah foto produk dan storyboard di Flow", () => {
    const teks = LANGKAH_PROMPT_CEPAT.join(" ");
    expect(teks).toContain("unggah foto produk");
    expect(teks).toContain("gambar storyboard");
    expect(teks).toContain("disclosure affiliate");
  });
});
