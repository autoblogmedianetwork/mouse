import { describe, expect, it } from "vitest";
import { BANK_BALASAN, jumlahTemplateBalasan } from "./bank-balasan";

describe("Bank Balasan", () => {
  it("memuat minimal 5 situasi dengan template", () => {
    expect(BANK_BALASAN.length).toBeGreaterThanOrEqual(5);
    for (const s of BANK_BALASAN) {
      expect(s.templat.length, s.id).toBeGreaterThanOrEqual(1);
      for (const t of s.templat) {
        expect(t.length, s.id).toBeGreaterThan(20);
        expect(t.length, s.id).toBeLessThanOrEqual(500);
      }
    }
  });

  it("semua template memakai suara Pak Slem (saya, tanpa menggurui)", () => {
    for (const s of BANK_BALASAN) {
      for (const t of s.templat) {
        expect(t.toLowerCase(), s.id).toContain("saya");
        // tidak menggurui: larangan "kamu harus" dan kata kasar
        expect(t, s.id).not.toMatch(/kamu harus|wajib beli|bodoh/i);
      }
    }
  });

  it("template ditanya-harga mengarahkan ke balasan, bukan DM tersembunyi", () => {
    const situasi = BANK_BALASAN.find((s) => s.id === "ditanya-harga");
    expect(situasi).toBeDefined();
    for (const t of situasi!.templat) {
      expect(t.toLowerCase()).toMatch(/balasan|link/);
    }
  });

  it("jumlahTemplateBalasan konsisten dengan data", () => {
    expect(jumlahTemplateBalasan()).toBe(
      BANK_BALASAN.reduce((n, s) => n + s.templat.length, 0),
    );
    expect(jumlahTemplateBalasan()).toBeGreaterThanOrEqual(8);
  });
});
