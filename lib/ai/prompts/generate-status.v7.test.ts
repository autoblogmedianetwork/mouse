import { describe, expect, it } from "vitest";
import { buildGenerateStatusPrompt, PROMPT_VERSION, ATURAN_ANTI_TERJEMAHAN } from "./generate-status.v7";
import { buildGenerateStatusPrompt as buildV6 } from "./generate-status.v6";
import { PENGATURAN_AWAL, type Ide } from "../schemas";

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

describe("generate-status.v7", () => {
  it("declares its own version without touching v6", () => {
    expect(PROMPT_VERSION).toBe("generate-status.v7");
  });

  it("keeps every v6 instruction and appends the anti-calque block last", () => {
    const prompt = buildGenerateStatusPrompt(input);
    expect(prompt.startsWith(buildV6(input))).toBe(true);
    expect(prompt.endsWith(ATURAN_ANTI_TERJEMAHAN)).toBe(true);
  });

  it("bans the rhetorical opener and the cliché phrases seen in weak output", () => {
    for (const frasa of [
      '"Pernah ...?"',
      "di tengah keramaian",
      "penuh tantangan",
      "ada solusi yang",
      "bikin semua lebih nyaman",
    ]) {
      expect(ATURAN_ANTI_TERJEMAHAN).toContain(frasa);
    }
  });

  it("demands one concrete detail and a length ceiling", () => {
    expect(ATURAN_ANTI_TERJEMAHAN).toContain("harga, ukuran, isi, bahan, atau jumlah");
    expect(ATURAN_ANTI_TERJEMAHAN).toContain("300 karakter");
    expect(ATURAN_ANTI_TERJEMAHAN).toContain("Jangan mengarang angka");
  });

  it("ships before/after examples, which small models follow better than bans", () => {
    expect(ATURAN_ANTI_TERJEMAHAN).toContain("Sebelum:");
    expect(ATURAN_ANTI_TERJEMAHAN).toContain("Sesudah:");
    const contoh = ATURAN_ANTI_TERJEMAHAN.match(/Sesudah:/g) ?? [];
    expect(contoh.length).toBeGreaterThanOrEqual(3);
  });
});
