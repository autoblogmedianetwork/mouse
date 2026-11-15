import { describe, expect, it } from "vitest";
import { buildGenerateStatusPrompt, PROMPT_VERSION } from "./generate-status.v8";
import { buildGenerateStatusPrompt as buildV7 } from "./generate-status.v7";
import { PENGATURAN_AWAL, type Ide, type Pengaturan } from "../schemas";

const ide: Ide = {
  judul: "Nasi Hangat Sepanjang Hari",
  deskripsi: "Rice cooker 1,8 liter menjaga nasi hangat sampai 12 jam.",
  jembatan: "Cocok untuk warung yang ramai saat jam makan.",
  format_label: "Problem-Solution",
};

const input = {
  namaProduk: "Rice Cooker 1,8 L",
  ringkasan: "Menjaga nasi hangat sampai 12 jam, kapasitas 1,8 liter.",
  fitur: ["Kapasitas 1,8 liter", "Warm sampai 12 jam"],
  ide,
  pengaturan: PENGATURAN_AWAL,
  kategori: "marketplace",
};

const HOOK_LAMA = [
  "pertanyaan",
  "masalah_relatif",
  "pernyataan_mengejutkan",
  "curiosity_gap",
  "before_after",
  "contrarian",
  "bawaan",
] as const;

const HOOK_BARU = [
  "educative",
  "fomo_lembut",
  "negative_stop",
  "urgensi_rasional",
  "pengalaman_nyata",
] as const;

const FRASA_BARU: Record<(typeof HOOK_BARU)[number], string> = {
  educative: "EDUCATIVE",
  fomo_lembut: "FOMO LEMBUT",
  negative_stop: "NEGATIVE/STOP",
  urgensi_rasional: "URGENSI RASIONAL",
  pengalaman_nyata: "REAL EXPERIENCE",
};

describe("generate-status.v8", () => {
  it("menyatakan versinya sendiri", () => {
    expect(PROMPT_VERSION).toBe("generate-status.v8");
  });

  it("hook lama: output identik dengan v7 (regresi nol perilaku)", () => {
    for (const hook of HOOK_LAMA) {
      const masukan = {
        ...input,
        pengaturan: { ...PENGATURAN_AWAL, gaya_hook: hook } as Pengaturan,
      };
      expect(buildGenerateStatusPrompt(masukan)).toBe(buildV7(masukan));
    }
  });

  it("hook baru: instruksi formulanya masuk prompt", () => {
    for (const hook of HOOK_BARU) {
      const masukan = {
        ...input,
        pengaturan: { ...PENGATURAN_AWAL, gaya_hook: hook } as Pengaturan,
      };
      const prompt = buildGenerateStatusPrompt(masukan);
      expect(prompt).toContain(FRASA_BARU[hook]);
    }
  });

  it("tetap menyusun blok sesuai urutan v7: anti-terjemahan paling akhir", () => {
    const prompt = buildGenerateStatusPrompt(input);
    expect(prompt.endsWith(buildV7(input).slice(-1))).toBe(true);
    const v7 = buildV7(input);
    // Struktur sama: v8 tanpa blok hook baru = v7 (hook bawaan).
    expect(prompt).toBe(v7);
  });

  it("kerangka cerita (Mini Story Telling) ikut masuk prompt", () => {
    const masukan = {
      ...input,
      pengaturan: { ...PENGATURAN_AWAL, kerangka: "cerita" } as Pengaturan,
    };
    const prompt = buildGenerateStatusPrompt(masukan);
    expect(prompt).toContain("KERANGKA PENULISAN: Cerita — Mini Story Telling");
    expect(prompt).toContain("Situasi awal");
    expect(prompt).toContain("Momen pakai");
    expect(prompt).toContain("CTA lembut");
  });
});
