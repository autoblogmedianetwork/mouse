import { describe, expect, it } from "vitest";
import { CTA_BAWAAN, gabungCta } from "./cta";

describe("CTA_BAWAAN", () => {
  it("memuat minimal 4 CTA dengan suara Pak Slem", () => {
    expect(CTA_BAWAAN.length).toBeGreaterThanOrEqual(4);
    for (const c of CTA_BAWAAN) {
      expect(c.teks).toContain("saya");
      expect(c.teks.length).toBeLessThanOrEqual(200);
      expect(c.label.length).toBeGreaterThan(2);
    }
  });

  it("tidak ada CTA yang menjual keras atau menggurui", () => {
    for (const c of CTA_BAWAAN) {
      expect(c.teks).not.toMatch(/beli sekarang!!|wajib beli|buruan sebelum habis/i);
    }
  });
});

describe("gabungCta", () => {
  it("menggabungkan dengan baris kosong pemisah", () => {
    const hasil = gabungCta("Nasi hangat sepanjang hari.", CTA_BAWAAN[0].teks);
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.teks).toBe(`Nasi hangat sepanjang hari.\n\n${CTA_BAWAAN[0].teks}`);
    expect(hasil.panjang).toBe(hasil.teks.length);
  });

  it("menolak bila gabungan melebihi 500 karakter", () => {
    const hasil = gabungCta("a".repeat(490), CTA_BAWAAN[0].teks);
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) {
      expect(hasil.galat).toContain("melebihi batas 500");
    }
  });

  it("teks tepat 500 diterima", () => {
    const ctaPendek = "Cek balasan ya.";
    const sisa = 500 - ctaPendek.length - 2;
    const hasil = gabungCta("a".repeat(sisa), ctaPendek);
    expect(hasil.ok).toBe(true);
  });

  it("menolak input kosong", () => {
    expect(gabungCta("", CTA_BAWAAN[0].teks).ok).toBe(false);
    expect(gabungCta("teks", "  ").ok).toBe(false);
  });
});
