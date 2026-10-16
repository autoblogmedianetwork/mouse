import { describe, expect, it } from "vitest";
import { ambilPersona } from "@/lib/ai/persona";
import { PENGATURAN_AWAL, type Ide, type Pengaturan } from "@/lib/ai/schemas";
import {
  buildGenerateStatusPrompt,
  instruksiKategori,
  PROMPT_VERSION,
} from "./generate-status.v4";
import {
  PROMPT_VERSION as VERSI_V3,
  buildGenerateStatusPrompt as buildV3,
} from "./generate-status.v3";

const ide: Ide = {
  judul: "Kenapa beralih ke cloud hosting",
  deskripsi: "Perbandingan performa untuk pemula.",
  jembatan: "Hosting ini punya uptime tinggi dan cPanel mudah.",
  format_label: "Tutorial",
};

function input(
  platform: "threads" | "x" = "threads",
  kategori?: string,
  pengaturan: Partial<Pengaturan> = {},
) {
  return {
    namaProduk: "Hostinger Cloud",
    ringkasan: "Web hosting cepat dengan garansi uptime 99.9%.",
    fitur: ["NVMe SSD", "Free SSL", "Dukungan 24/7"],
    ide,
    pengaturan: { ...PENGATURAN_AWAL, persona: "ahli", ...pengaturan } as Pengaturan,
    link: "https://contoh.test/hostinger",
    platform,
    kategori,
  };
}

describe("prompt 03 v4", () => {
  it("memakai penanda versi v4", () => {
    expect(PROMPT_VERSION).toBe("generate-status.v4");
  });

  it("menyesuaikan sudut pandang untuk kategori hosting dan saas", () => {
    const promptHosting = buildGenerateStatusPrompt(input("threads", "hosting"));
    expect(promptHosting).toContain("EDUKASI dan PERBANDINGAN spesifikasi");
    expect(promptHosting).toContain("HINDARI hard-selling seperti promo harga murah");

    const promptSaaS = buildGenerateStatusPrompt(input("threads", "SaaS"));
    expect(promptSaaS).toContain("EDUKASI dan PERBANDINGAN spesifikasi");
  });

  it("menyesuaikan sudut pandang untuk kategori kursus", () => {
    const prompt = buildGenerateStatusPrompt(input("threads", "kursus"));
    expect(prompt).toContain("PENINGKATAN SKILL");
    expect(prompt).toContain("kurikulum praktis");
  });

  it("menyesuaikan sudut pandang untuk kategori marketplace", () => {
    const prompt = buildGenerateStatusPrompt(input("threads", "marketplace"));
    expect(prompt).toContain("REVIEW PRODUK");
    expect(prompt).toContain("kepraktisan pemakaian harian");
  });

  it("tetap mematuhi batas karakter platform", () => {
    const threadsPrompt = buildGenerateStatusPrompt(input("threads"));
    expect(threadsPrompt).toContain("MAKSIMAL 500 karakter");

    const xPrompt = buildGenerateStatusPrompt(input("x"));
    expect(xPrompt).toContain("MAKSIMAL 280 karakter");
  });

  it("tidak mengubah perilaku prompt v3", () => {
    expect(VERSI_V3).toBe("generate-status.v3");
    const promptV3 = buildV3(input("threads"));
    expect(promptV3).toContain("kreator konten affiliate Shopee");
  });
});
