import { describe, expect, it } from "vitest";
import {
  PENGATURAN_GAYA_AWAL,
  barisKeGayaPreset,
  gayaPresetSkema,
  namaPresetSkema,
} from "./gaya-preset";

describe("validator nama preset", () => {
  it("menolak nama kosong dan nama terlalu panjang", () => {
    expect(namaPresetSkema.safeParse("   ").success).toBe(false);
    expect(namaPresetSkema.safeParse("x".repeat(41)).success).toBe(false);
  });

  it("menerima nama wajar dan membuang spasi di ujung", () => {
    const parsed = namaPresetSkema.safeParse("  Dark Amber Nyaman  ");
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).toBe("Dark Amber Nyaman");
  });
});

describe("validator gaya preset", () => {
  it("menerima default dan batas rentang", () => {
    expect(gayaPresetSkema.safeParse(PENGATURAN_GAYA_AWAL).success).toBe(true);
    expect(
      gayaPresetSkema.safeParse({ skalaFont: 70, warnaAksen: "", posisiKonten: "atas", ruangKeliling: 90 })
        .success,
    ).toBe(true);
    expect(
      gayaPresetSkema.safeParse({ skalaFont: 150, warnaAksen: "#ff8800", posisiKonten: "tengah", ruangKeliling: 140 })
        .success,
    ).toBe(true);
  });

  it("menolak nilai di luar rentang, format hex salah, dan nilai posisi asing", () => {
    const dasar = PENGATURAN_GAYA_AWAL;
    expect(gayaPresetSkema.safeParse({ ...dasar, skalaFont: 69 }).success).toBe(false);
    expect(gayaPresetSkema.safeParse({ ...dasar, skalaFont: 151 }).success).toBe(false);
    expect(gayaPresetSkema.safeParse({ ...dasar, ruangKeliling: 89 }).success).toBe(false);
    expect(gayaPresetSkema.safeParse({ ...dasar, ruangKeliling: 141 }).success).toBe(false);
    expect(gayaPresetSkema.safeParse({ ...dasar, warnaAksen: "oranye" }).success).toBe(false);
    expect(gayaPresetSkema.safeParse({ ...dasar, warnaAksen: "#12345" }).success).toBe(false);
    expect(gayaPresetSkema.safeParse({ ...dasar, posisiKonten: "bawah" }).success).toBe(false);
  });
});

describe("barisKeGayaPreset", () => {
  it("memetakan baris valid menjadi preset", () => {
    expect(
      barisKeGayaPreset({
        id: "uuid-1",
        nama: "Tema Toko",
        gaya: { skalaFont: 110, warnaAksen: "", posisiKonten: "atas", ruangKeliling: 120 },
      }),
    ).toEqual({
      id: "uuid-1",
      nama: "Tema Toko",
      gaya: { skalaFont: 110, warnaAksen: "", posisiKonten: "atas", ruangKeliling: 120 },
    });
  });

  it("membuang baris dengan gaya tidak valid atau nama tidak valid", () => {
    expect(
      barisKeGayaPreset({
        id: "uuid-2",
        nama: "Rusak",
        gaya: { skalaFont: 999, warnaAksen: "", posisiKonten: "tengah", ruangKeliling: 100 },
      }),
    ).toBeNull();
    expect(
      barisKeGayaPreset({ id: "uuid-3", nama: "", gaya: PENGATURAN_GAYA_AWAL }),
    ).toBeNull();
  });
});
