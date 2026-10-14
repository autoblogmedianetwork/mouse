import { describe, expect, it } from "vitest";
import { ambilPersona } from "@/lib/ai/persona";
import { BATAS_JUMLAH, PENGATURAN_AWAL, type Ide, type Pengaturan } from "@/lib/ai/schemas";
import { buildGenerateStatusPrompt, PROMPT_VERSION } from "./generate-status.v2";
import {
  PROMPT_VERSION as VERSI_V1,
  buildGenerateStatusPrompt as buildV1,
} from "./generate-status.v1";

const ide: Ide = {
  judul: "Tiga hal yang jarang dibahas",
  deskripsi: "Sudut pandang pemakaian harian.",
  jembatan: "Produk ini menyelesaikan bagian tersulitnya.",
  format_label: "Listicle",
};

function input(pengaturan: Partial<Pengaturan> = {}) {
  return {
    namaProduk: "Produk Uji",
    ringkasan: "Ringkasan produk uji.",
    fitur: ["Fitur A", "Fitur B"],
    ide,
    pengaturan: { ...PENGATURAN_AWAL, persona: "sahabat", ...pengaturan } as Pengaturan,
    link: "https://contoh.test/produk",
  };
}

describe("prompt 03 v2", () => {
  it("memakai penanda versi v2", () => {
    expect(PROMPT_VERSION).toBe("generate-status.v2");
  });

  it("mengirim persona beserta deskripsi nadanya", () => {
    const sahabat = ambilPersona("sahabat");
    const prompt = buildGenerateStatusPrompt(input());
    expect(prompt).toContain(`- Persona: ${sahabat.judul}`);
    expect(prompt).toContain(sahabat.deskripsi_nada);
  });

  it("mengganti persona mengubah blok persona di prompt", () => {
    const ahli = ambilPersona("ahli");
    const prompt = buildGenerateStatusPrompt(input({ persona: "ahli" }));
    expect(prompt).toContain(ahli.deskripsi_nada);
    expect(prompt).not.toContain(ambilPersona("sahabat").deskripsi_nada);
  });

  it("tetap menjaga batas 500 karakter per status", () => {
    expect(buildGenerateStatusPrompt(input())).toContain("Setiap status MAKSIMAL 500 karakter");
  });

  it("memakai rentang jumlah status dari pengaturan", () => {
    const batas = BATAS_JUMLAH.pendek;
    const prompt = buildGenerateStatusPrompt(input({ jumlah_status: "pendek" }));
    expect(prompt).toContain(`${batas.min}-${batas.max} status`);
  });

  it("menaruh link hanya pada letak yang diminta", () => {
    const diStatusTerakhir = buildGenerateStatusPrompt(input({ letak_link: "status_terakhir" }));
    expect(diStatusTerakhir).toContain("https://contoh.test/produk");

    const balasan = buildGenerateStatusPrompt(input({ letak_link: "balasan" }));
    expect(balasan).toContain("[LINK]");
    expect(balasan).not.toContain("https://contoh.test/produk");

    const tanpaLink = buildGenerateStatusPrompt(input({ letak_link: "tanpa_link" }));
    expect(tanpaLink).toContain("jangan sisipkan link apa pun");
    expect(tanpaLink).not.toContain("https://contoh.test/produk");
  });

  it("menerima persona dari draf lama yang masih berupa label", () => {
    const prompt = buildGenerateStatusPrompt(
      input({ persona: "Ahli" as unknown as Pengaturan["persona"] }),
    );
    expect(prompt).toContain(ambilPersona("ahli").deskripsi_nada);
  });

  it("tidak mengubah v1", () => {
    expect(VERSI_V1).toBe("generate-status.v1");
    const promptV1 = buildV1(input());
    expect(promptV1).toContain("- Persona: sahabat");
    expect(promptV1).not.toContain(ambilPersona("sahabat").deskripsi_nada);
  });
});
