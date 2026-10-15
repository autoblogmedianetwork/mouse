import { describe, expect, it } from "vitest";
import { ambilPersona } from "@/lib/ai/persona";
import { PENGATURAN_AWAL, type Ide, type Pengaturan } from "@/lib/ai/schemas";
import { buildGenerateStatusPrompt, PROMPT_VERSION } from "./generate-status.v3";
import {
  PROMPT_VERSION as VERSI_V2,
  buildGenerateStatusPrompt as buildV2,
} from "./generate-status.v2";

const ide: Ide = {
  judul: "Tiga hal yang jarang dibahas",
  deskripsi: "Sudut pandang pemakaian harian.",
  jembatan: "Produk ini menyelesaikan bagian tersulitnya.",
  format_label: "Listicle",
};

function input(platform: "threads" | "x" = "threads", pengaturan: Partial<Pengaturan> = {}) {
  return {
    namaProduk: "Produk Uji",
    ringkasan: "Ringkasan produk uji.",
    fitur: ["Fitur A", "Fitur B"],
    ide,
    pengaturan: { ...PENGATURAN_AWAL, persona: "sahabat", ...pengaturan } as Pengaturan,
    link: "https://contoh.test/produk",
    platform,
  };
}

describe("prompt 03 v3", () => {
  it("memakai penanda versi v3", () => {
    expect(PROMPT_VERSION).toBe("generate-status.v3");
  });

  it("default platformnya Threads dengan batas 500", () => {
    const prompt = buildGenerateStatusPrompt(input());
    expect(prompt).toContain("MAKSIMAL 500 karakter");
    expect(prompt).toContain("Platform tujuan: threads");
  });

  it("platform x menurunkan batas ke 280", () => {
    const prompt = buildGenerateStatusPrompt(input("x"));
    expect(prompt).toContain("MAKSIMAL 280 karakter");
    expect(prompt).toContain("Platform tujuan: x");
  });

  it("platform x memakai gaya ringkas", () => {
    const prompt = buildGenerateStatusPrompt(input("x"));
    expect(prompt).toContain("ringkas");
  });

  it("tetap mengirim persona beserta deskripsi nadanya", () => {
    const prompt = buildGenerateStatusPrompt(input());
    expect(prompt).toContain(ambilPersona("sahabat").deskripsi_nada);
  });

  it("menaruh link hanya pada letak yang diminta", () => {
    const diTerakhir = buildGenerateStatusPrompt(
      input("threads", { letak_link: "status_terakhir" }),
    );
    expect(diTerakhir).toContain("https://contoh.test/produk");

    const balasan = buildGenerateStatusPrompt(input("threads", { letak_link: "balasan" }));
    expect(balasan).toContain("[LINK]");
    expect(balasan).not.toContain("https://contoh.test/produk");
  });

  it("tidak mengubah v2", () => {
    expect(VERSI_V2).toBe("generate-status.v2");
    const promptV2 = buildV2(input());
    expect(promptV2).toContain("Setiap status MAKSIMAL 500 karakter");
    expect(promptV2).not.toContain("Platform tujuan");
  });
});
