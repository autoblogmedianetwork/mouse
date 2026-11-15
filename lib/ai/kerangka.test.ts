import { describe, expect, it } from "vitest";
import { BAGIAN, KERANGKA_IDS, KETERANGAN_KERANGKA, LABEL_KERANGKA, instruksiKerangka } from "./kerangka";

describe("kerangka cerita (Mini Story Telling)", () => {
  it("terdaftar sebagai pilihan kerangka", () => {
    expect(KERANGKA_IDS).toContain("cerita");
    expect(LABEL_KERANGKA.cerita).toContain("Mini Story Telling");
    expect(KETERANGAN_KERANGKA.cerita).toBeTruthy();
  });

  it("memiliki empat bagian: situasi awal, momen pakai, kesimpulan jujur, CTA lembut", () => {
    const bagian = BAGIAN.cerita.split("\n").filter((b) => b.startsWith("- "));
    expect(bagian).toHaveLength(4);
    expect(BAGIAN.cerita).toContain("Situasi awal");
    expect(BAGIAN.cerita).toContain("Momen pakai");
    expect(BAGIAN.cerita).toContain("Kesimpulan jujur");
    expect(BAGIAN.cerita).toContain("CTA lembut");
  });

  it("instruksiKerangka menyusun judul dan aturan umum", () => {
    const teks = instruksiKerangka("cerita");
    expect(teks).toContain("KERANGKA PENULISAN: Cerita — Mini Story Telling");
    expect(teks).toContain("Jangan menyebut nama bagiannya");
    expect(teks).toContain("- Situasi awal");
  });

  it("kerangka bebas tetap tanpa blok", () => {
    expect(instruksiKerangka("bebas")).toBe("");
  });
});
