import { describe, expect, it } from "vitest";
import { PENGATURAN_AWAL, naskahVideoSkema, type Ide, type Pengaturan } from "./schemas";
import { buildNaskahVideoPrompt, PROMPT_VERSION } from "./prompts/naskah-video.v1";
import { ambilPersona } from "./persona";

const ide: Ide = {
  judul: "Tas kanvas untuk kuliah",
  deskripsi: "Kapasitas dan bahan tahan air.",
  jembatan: "Muat laptop dan tahan hujan.",
  format_label: "Problem-Solution",
};

function input(pengaturan: Partial<Pengaturan> = {}) {
  return {
    namaProduk: "Tas Kanvas Uji",
    ringkasan: "Tas kanvas dengan bahan tahan air.",
    fitur: ["Tahan air", "Muat laptop 14 inci"],
    ide,
    pengaturan: { ...PENGATURAN_AWAL, persona: "ahli", ...pengaturan } as Pengaturan,
  };
}

describe("prompt 09 naskah video v1", () => {
  it("memakai penanda versi v1", () => {
    expect(PROMPT_VERSION).toBe("naskah-video.v1");
  });

  it("memuat struktur tiga bagian dan durasi 30 sampai 60 detik", () => {
    const prompt = buildNaskahVideoPrompt(input());
    expect(prompt).toContain("hook_visual");
    expect(prompt).toContain("fungsi_produk");
    expect(prompt).toContain("cta");
    expect(prompt).toContain("30 sampai 60 detik");
    expect(prompt).toContain("3 detik pertama");
  });

  it("mengirim persona dan data produk", () => {
    const prompt = buildNaskahVideoPrompt(input());
    expect(prompt).toContain(ambilPersona("ahli").deskripsi_nada);
    expect(prompt).toContain("Tas Kanvas Uji");
    expect(prompt).toContain("Tahan air");
  });

  it("instruksi tambahan ikut masuk, kosong tidak menambah baris", () => {
    const dengan = buildNaskahVideoPrompt(input({ instruksi: "sebut warna" }));
    expect(dengan).toContain("sebut warna");
    const tanpa = buildNaskahVideoPrompt(input());
    expect(tanpa).not.toContain("Instruksi tambahan dari user:");
  });
});

describe("skema naskahVideoSkema", () => {
  const valid = {
    hook_visual: "[close-up produk] Tasnya langsung kelihatan kokoh.",
    fungsi_produk: "Bahan tahan air dan muat laptop 14 inci.",
    cta: "Cek link affiliate di bio, ya.",
    durasi_total_detik: 45,
  };

  it("menerima jawaban valid", () => {
    expect(naskahVideoSkema.safeParse(valid).success).toBe(true);
  });

  it("menolak bagian kosong", () => {
    expect(naskahVideoSkema.safeParse({ ...valid, cta: "" }).success).toBe(false);
  });

  it("menolak bagian yang melebihi 500 karakter (aturan #10)", () => {
    const panjang = "x".repeat(501);
    expect(naskahVideoSkema.safeParse({ ...valid, hook_visual: panjang }).success).toBe(false);
    const pas = "x".repeat(500);
    expect(naskahVideoSkema.safeParse({ ...valid, hook_visual: pas }).success).toBe(true);
  });

  it("menolak durasi di luar 30 sampai 60 detik", () => {
    expect(naskahVideoSkema.safeParse({ ...valid, durasi_total_detik: 25 }).success).toBe(false);
    expect(naskahVideoSkema.safeParse({ ...valid, durasi_total_detik: 61 }).success).toBe(false);
    expect(naskahVideoSkema.safeParse({ ...valid, durasi_total_detik: 45.5 }).success).toBe(false);
  });
});
