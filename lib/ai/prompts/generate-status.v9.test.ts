/**
 * Uji prompt generate-status v9.
 *
 * Fokus: dua gaya hook yang menyentuh waktu/kelangkaan (fomo_lembut,
 * urgensi_rasional) WAJIB terikat fakta yang bisa dicek. Tanpa itu, keduanya
 * berisiko jadi urgensi palsu yang melanggar prinsip kepercayaan aplikasi.
 */
import { describe, expect, it } from "vitest";
import { buildGenerateStatusPrompt, PROMPT_VERSION } from "./generate-status.v9";
import { buildGenerateStatusPrompt as buildV8 } from "./generate-status.v8";
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

const dengan = (gaya_hook: Pengaturan["gaya_hook"]) =>
  buildGenerateStatusPrompt({ ...input, pengaturan: { ...PENGATURAN_AWAL, gaya_hook } });

const TREN = "akhir-akhir ini";
const REPEAT = "pantes banyak";
const VIRAL = "lagi viral";
const KEHABISAN = "sisa sedikit";
const NAIK = "harganya naik";

describe("generate-status v9", () => {
  it("versi prompt naik ke v9", () => {
    expect(PROMPT_VERSION).toBe("generate-status.v9");
  });

  it("fomo_lembut terikat fakta: melarang tren yang tidak tercatat", () => {
    const p = dengan("fomo_lembut");
    expect(p.toLowerCase()).toContain("hanya angka yang tertulis");
    expect(p).toContain("DILARANG");
    expect(p.toLowerCase()).toContain(TREN);
    expect(p.toLowerCase()).toContain(REPEAT);
    expect(p.toLowerCase()).toContain(VIRAL);
  });

  it("urgensi_rasional terikat fakta: melarang kelangkaan karangan", () => {
    const p = dengan("urgensi_rasional");
    expect(p).toContain("DILARANG");
    expect(p.toLowerCase()).toContain(KEHABISAN);
    expect(p.toLowerCase()).toContain(NAIK);
  });

  it("aturan fakta hanya muncul untuk dua hook itu", () => {
    const perluFakta = "pakai HANYA fakta yang tertulis di data penawaran";
    for (const hook of ["fomo_lembut", "urgensi_rasional"] as const) {
      expect(dengan(hook)).toContain(perluFakta);
    }
    for (const hook of ["pertanyaan", "educative", "bawaan", "pengalaman_nyata"] as const) {
      expect(dengan(hook)).not.toContain(perluFakta);
    }
  });

  it("hook lain tetap byte-identik dengan v8 (tidak ada perubahan tak sengaja)", () => {
    for (const hook of [
      "pertanyaan",
      "masalah_relatif",
      "pernyataan_mengejutkan",
      "curiosity_gap",
      "before_after",
      "contrarian",
      "bawaan",
      "educative",
      "negative_stop",
      "pengalaman_nyata",
    ] as const) {
      expect(dengan(hook)).toBe(buildV8({ ...input, pengaturan: { ...PENGATURAN_AWAL, gaya_hook: hook } }));
    }
  });
});
