import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ATURAN_BAHASA } from "./gaya-bahasa";

/**
 * Guard blok "LARANGAN POLA TULISAN AI" (adaptasi humanizer, MIT,
 * github.com/blader/humanizer) di ATURAN_BAHASA — modul bersama yang
 * dipakai SEMUA prompt. Aditif: aturan lama wajib tetap utuh.
 */
const sumber = readFileSync(join(process.cwd(), "lib", "ai", "gaya-bahasa.ts"), "utf-8");

describe("ATURAN_BAHASA — blok larangan pola AI (humanizer)", () => {
  it("memuat larangan pola AI utama", () => {
    expect(ATURAN_BAHASA).toContain("LARANGAN POLA TULISAN AI");
    expect(ATURAN_BAHASA).toContain("bukan sekadar");
    expect(ATURAN_BAHASA).toContain("kalimat penutup satu baris");
    expect(ATURAN_BAHASA).toContain("pada dasarnya");
    expect(ATURAN_BAHASA).toContain("pembuka panggung");
    expect(ATURAN_BAHASA).toContain("bombastis");
  });

  it("memuat pagar khusus konten afiliasi: atribusi kabur, basa promosi, pengisi", () => {
    expect(ATURAN_BAHASA).toContain("atribusi kabur");
    expect(ATURAN_BAHASA).toContain("basa promosi");
    expect(ATURAN_BAHASA).toContain("pengisi basa-basi");
  });

  it("aturan lama tetap utuh (aditif, tidak mengganti)", () => {
    expect(ATURAN_BAHASA).toContain("Dalam dunia yang");
    expect(ATURAN_BAHASA).toContain("merupakan");
    expect(ATURAN_BAHASA).toContain("bikin");
    expect(ATURAN_BAHASA).toContain("BUKAN alasan mengarang klaim");
  });

  it("blok baru ada di sumber file (bukan string lain)", () => {
    expect(sumber).toContain("humanizer");
  });
});
