import { describe, expect, it } from "vitest";
import {
  KARTU_PERSONA,
  PILIHAN_KEBUTUHAN,
  PILIHAN_MINAT,
  PILIHAN_PERILAKU,
  PILIHAN_USIA,
  bangunDeskripsiAudiens,
  personaDimodifikasi,
} from "./preset";

describe("preset riset audiens (Fase 3, task 3-B; ditata ulang per review UI)", () => {
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

  it("semua persona membawa kombinasi chip yang valid", () => {
    for (const kartu of KARTU_PERSONA) {
      if (kartu.chips.usia) {
        expect(PILIHAN_USIA).toContain(kartu.chips.usia);
      }
      if (kartu.chips.gender) {
        expect(["wanita", "pria", "semua"]).toContain(kartu.chips.gender);
      }
      for (const m of kartu.chips.minat) expect(PILIHAN_MINAT).toContain(m);
      for (const k of kartu.chips.kebutuhan) expect(PILIHAN_KEBUTUHAN).toContain(k);
      for (const p of kartu.chips.perilaku) expect(PILIHAN_PERILAKU).toContain(p);
    }
  });

  it("kategori tidak bercampur: minat tidak berisi kebutuhan atau perilaku", () => {
    // "hemat ongkir", "produk halal", "harga sensitif", "review jujur" =
    // kebutuhan; tidak boleh ada di minat (masukan review UI).
    for (const k of PILIHAN_KEBUTUHAN) {
      expect(PILIHAN_MINAT).not.toContain(k);
      expect(PILIHAN_PERILAKU).not.toContain(k);
    }
  });

  it("pilihan chip tidak kosong", () => {
    expect(PILIHAN_USIA.length).toBeGreaterThanOrEqual(5);
    expect(PILIHAN_MINAT.length).toBeGreaterThanOrEqual(10);
    expect(PILIHAN_KEBUTUHAN.length).toBeGreaterThanOrEqual(4);
    expect(PILIHAN_PERILAKU.length).toBeGreaterThanOrEqual(5);
  });

  it("bangunDeskripsiAudiens kosong bila belum memilih apa pun", () => {
    expect(bangunDeskripsiAudiens({ minat: [], kebutuhan: [], perilaku: [] })).toBe("");
  });

  it("susun urut: usia, gender, minat, kebutuhan, perilaku", () => {
    const hasil = bangunDeskripsiAudiens({
      usia: "25–34 tahun",
      gender: "wanita",
      minat: ["skincare"],
      kebutuhan: ["hemat ongkir"],
      perilaku: ["pembaca review dulu"],
    });
    expect(hasil).toBe(
      "Usia 25–34 tahun, wanita, minat: skincare, kebutuhan: hemat ongkir, perilaku: pembaca review dulu",
    );
  });

  it("gender 'semua' tidak ditulis", () => {
    const hasil = bangunDeskripsiAudiens({
      gender: "semua",
      minat: ["gadget"],
      kebutuhan: [],
      perilaku: [],
    });
    expect(hasil).toBe("minat: gadget");
  });

  it("personaDimodifikasi: false bila chip persis sama dengan persona", () => {
    const kartu = KARTU_PERSONA[0];
    expect(
      personaDimodifikasi(kartu, {
        usia: kartu.chips.usia,
        gender: kartu.chips.gender,
        minat: kartu.chips.minat,
        kebutuhan: kartu.chips.kebutuhan,
        perilaku: kartu.chips.perilaku,
      }),
    ).toBe(false);
  });

  it("personaDimodifikasi: true bila satu chip diubah", () => {
    const kartu = KARTU_PERSONA[0];
    expect(
      personaDimodifikasi(kartu, {
        usia: kartu.chips.usia,
        gender: kartu.chips.gender,
        minat: [...kartu.chips.minat, "masak"],
        kebutuhan: kartu.chips.kebutuhan,
        perilaku: kartu.chips.perilaku,
      }),
    ).toBe(true);
  });
});
