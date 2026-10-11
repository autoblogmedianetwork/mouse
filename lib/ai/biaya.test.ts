/** Cost widget maths (UI-Spec 3.9, PRD F10). */
import { describe, expect, it } from "vitest";
import { ringkasBiaya, type CatatanBiaya } from "./biaya";

const SEKARANG = new Date("2026-10-12T15:00:00.000Z");
/** Relative timestamps keep the test correct in every timezone. */
const jamLalu = (n: number) => new Date(SEKARANG.getTime() - n * 3_600_000).toISOString();

describe("ringkasBiaya", () => {
  it("menandai belum ada catatan", () => {
    expect(ringkasBiaya([], SEKARANG)).toEqual({
      hariIniUsd: null,
      bulanIniUsd: null,
      adaCatatan: false,
    });
  });

  it("menjumlahkan hari ini dan bulan ini", () => {
    const list: CatatanBiaya[] = [
      { ts: jamLalu(1), usd: 0.01 },
      { ts: jamLalu(2), usd: 0.02 },
      { ts: "2026-10-05T00:00:00.000Z", usd: 0.1 },
      { ts: "2026-08-20T00:00:00.000Z", usd: 1 },
    ];
    const hasil = ringkasBiaya(list, SEKARANG);
    expect(hasil.adaCatatan).toBe(true);
    expect(hasil.hariIniUsd).toBeCloseTo(0.03);
    expect(hasil.bulanIniUsd).toBeCloseTo(0.13);
  });

  it("mengabaikan baris rusak", () => {
    const list = [
      { ts: "bukan-tanggal", usd: 5 },
      { ts: jamLalu(1), usd: Number.NaN },
      { ts: jamLalu(1), usd: 0.04 },
    ] as unknown as CatatanBiaya[];
    const hasil = ringkasBiaya(list, SEKARANG);
    expect(hasil.hariIniUsd).toBeCloseTo(0.04);
    expect(hasil.bulanIniUsd).toBeCloseTo(0.04);
  });
});
