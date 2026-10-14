import { describe, expect, it } from "vitest";
import { clipboardTersedia, salinKeClipboard, teksStatus, teksUtasLengkap } from "./salin";

describe("teksStatus", () => {
  it("membuang spasi di ujung", () => {
    expect(teksStatus("  halo  ")).toBe("halo");
  });
});

describe("teksUtasLengkap", () => {
  it("memisahkan status dengan satu baris kosong dan menjaga urutan", () => {
    expect(teksUtasLengkap(["satu", "dua", "tiga"])).toBe("satu\n\ndua\n\ntiga");
  });

  it("melewati status kosong tanpa menyisakan pemisah ganda", () => {
    expect(teksUtasLengkap(["satu", "   ", "", "dua"])).toBe("satu\n\ndua");
  });

  it("memangkas spasi tiap status", () => {
    expect(teksUtasLengkap(["  satu ", "dua  "])).toBe("satu\n\ndua");
  });

  it("mengembalikan string kosong kalau tidak ada status terisi", () => {
    expect(teksUtasLengkap([])).toBe("");
    expect(teksUtasLengkap(["", "  "])).toBe("");
  });

  it("satu status tetap disalin apa adanya tanpa pemisah", () => {
    expect(teksUtasLengkap(["hanya ini"])).toBe("hanya ini");
  });
});

describe("salinKeClipboard", () => {
  it("menolak teks kosong", async () => {
    await expect(salinKeClipboard("")).resolves.toBe(false);
  });

  it("mengembalikan false di lingkungan tanpa clipboard dan tanpa DOM", async () => {
    expect(clipboardTersedia()).toBe(false);
    await expect(salinKeClipboard("teks")).resolves.toBe(false);
  });
});
