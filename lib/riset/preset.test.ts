import { describe, expect, it } from "vitest";
import {
  KARTU_PERSONA,
  PILIHAN_MINAT,
  PILIHAN_PERILAKU,
  PILIHAN_USIA,
  bangunDeskripsiAudiens,
} from "./preset";

describe("preset riset audiens (Fase 3, task 3-B)", () => {
  it("punya minimal 10 kartu persona dengan deskripsi cukup panjang", () => {
    expect(KARTU_PERSONA.length).toBeGreaterThanOrEqual(10);
    for (const kartu of KARTU_PERSONA) {
      expect(kartu.id).toMatch(/^[a-z-]+$/);
      expect(kartu.deskripsi.length).toBeGreaterThan(40);
    }
  });

  it("id persona unik", () => {
    const ids = KARTU_PERSONA.map((k) => k.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("pilihan chip tidak kosong", () => {
    expect(PILIHAN_USIA.length).toBeGreaterThanOrEqual(5);
    expect(PILIHAN_MINAT.length).toBeGreaterThanOrEqual(10);
    expect(PILIHAN_PERILAKU.length).toBeGreaterThanOrEqual(5);
  });

  it("bangunDeskripsiAudiens kosong bila belum memilih apa pun", () => {
    expect(bangunDeskripsiAudiens({ minat: [], perilaku: [] })).toBe("");
  });

  it("susun urut: usia, gender, minat, perilaku", () => {
    const hasil = bangunDeskripsiAudiens({
      usia: "25–34 tahun",
      gender: "wanita",
      minat: ["skincare", "hemat ongkir"],
      perilaku: ["pembaca review dulu"],
    });
    expect(hasil).toBe(
      "Usia 25–34 tahun, wanita, minat: skincare, hemat ongkir, perilaku: pembaca review dulu",
    );
  });

  it("gender 'semua' tidak ditulis", () => {
    const hasil = bangunDeskripsiAudiens({
      gender: "semua",
      minat: ["gadget"],
      perilaku: [],
    });
    expect(hasil).toBe("minat: gadget");
  });
});
