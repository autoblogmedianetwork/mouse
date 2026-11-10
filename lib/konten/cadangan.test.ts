import { describe, expect, it } from "vitest";
import { BATAS_CADANGAN_HARI, perluCadangan, usiaCadanganHari } from "./cadangan";

const HARI = 86_400_000;
const sekarang = Date.parse("2026-11-11T08:00:00.000Z");

describe("perluCadangan", () => {
  it("menyarankan cadangan bila belum pernah", () => {
    expect(perluCadangan(null, sekarang)).toBe(true);
  });

  it("tidak menyarankan bila cadangan masih baru", () => {
    const kemarin = new Date(sekarang - HARI).toISOString();
    expect(perluCadangan(kemarin, sekarang)).toBe(false);
  });

  it("menyarankan setelah lewat batas hari", () => {
    const lama = new Date(sekarang - BATAS_CADANGAN_HARI * HARI).toISOString();
    expect(perluCadangan(lama, sekarang)).toBe(true);
  });

  it("menganggap timestamp rusak sebagai belum pernah", () => {
    expect(perluCadangan("bukan tanggal", sekarang)).toBe(true);
  });
});

describe("usiaCadanganHari", () => {
  it("menghitung selisih hari bulat", () => {
    const tigaHari = new Date(sekarang - 3 * HARI).toISOString();
    expect(usiaCadanganHari(tigaHari, sekarang)).toBe(3);
  });

  it("null untuk data kosong", () => {
    expect(usiaCadanganHari(null, sekarang)).toBeNull();
  });
});
