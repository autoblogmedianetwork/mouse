/** Prompt 3 v6: blok kerangka ditambahkan tanpa mengubah isi v5. */
import { describe, expect, it } from "vitest";
import { buildGenerateStatusPrompt, PROMPT_VERSION } from "./generate-status.v6";
import { buildGenerateStatusPrompt as buildV5 } from "./generate-status.v5";
import { KERANGKA_IDS, kerangkaDariNilai, instruksiKerangka } from "../kerangka";
import { PENGATURAN_AWAL, type Ide } from "../schemas";

const ide: Ide = {
  judul: "5 Manfaat Tas Kanvas",
  deskripsi: "Bahan tebal, muat laptop.",
  jembatan: "Cocok untuk komuter.",
  format_label: "Listicle",
};

const input = (kerangka: (typeof KERANGKA_IDS)[number]) => ({
  namaProduk: "Tas Kanvas Sleek",
  ringkasan: "Tas kanvas tahan air dengan kompartemen laptop.",
  fitur: ["Waterproof", "Jahitan ganda"],
  ide,
  pengaturan: { ...PENGATURAN_AWAL, kerangka },
  kategori: "marketplace",
});

describe("prompt 03 generate-status v6", () => {
  it("memakai penanda versi v6", () => {
    expect(PROMPT_VERSION).toBe("generate-status.v6");
  });

  it("dengan kerangka bebas, hasilnya sama persis dengan v5", () => {
    expect(buildGenerateStatusPrompt(input("bebas"))).toBe(buildV5(input("bebas")));
  });

  it("isi v5 (gaya bahasa dan aturan keras) tetap ada saat kerangka dipakai", () => {
    const prompt = buildGenerateStatusPrompt(input("psc"));
    expect(prompt).toContain("GAYA BAHASA (WAJIB");
    expect(prompt).toContain("Setiap status MAKSIMAL 500 karakter");
    expect(prompt).toContain("KERANGKA PENULISAN");
  });

  it("setiap kerangka selain bebas punya blok urutan sendiri", () => {
    for (const id of KERANGKA_IDS.filter((k) => k !== "bebas")) {
      const blok = instruksiKerangka(id);
      expect(blok.startsWith("KERANGKA PENULISAN:")).toBe(true);
      expect(blok).toContain("Kerangka mengatur URUTAN ISI");
    }
  });

  it("HBSC melarang social proof karangan dan menyuruh melewatinya bila data kosong", () => {
    const blok = instruksiKerangka("hbsc");
    expect(blok).toContain("Social Proof");
    expect(blok).toContain("LEWATI bagian ini");
    expect(blok).toContain("jangan mengarang angka");
  });

  it("MSSPC punya tahap pertimbangan yang bukan jualan", () => {
    const blok = instruksiKerangka("msspc");
    expect(blok).toContain("Situasi");
    expect(blok).toContain("Pertimbangan");
    expect(blok).toContain("bukan bagian jualan");
  });

  it("melarang pancingan interaksi kosong di semua kerangka", () => {
    expect(instruksiKerangka("aida")).toContain("Jangan memancing interaksi");
  });

  it("bebas menghasilkan blok kosong", () => {
    expect(instruksiKerangka("bebas")).toBe("");
  });
});

describe("kerangkaDariNilai", () => {
  it("menerima id yang dikenal", () => {
    expect(kerangkaDariNilai("msspc")).toBe("msspc");
  });

  it("menurunkan nilai asing ke bebas", () => {
    expect(kerangkaDariNilai("story")).toBe("bebas");
    expect(kerangkaDariNilai(null)).toBe("bebas");
  });
});
