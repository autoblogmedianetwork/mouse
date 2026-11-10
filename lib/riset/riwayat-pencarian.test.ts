import { describe, expect, it } from "vitest";
import { MAKS_RIWAYAT, tambahRiwayat } from "./riwayat-pencarian";

describe("tambahRiwayat", () => {
  it("menaruh entri terbaru di depan", () => {
    const hasil = tambahRiwayat([], { niche: "dapur", audiens: "ibu muda" }, "2026-11-11T08:00:00Z");
    expect(hasil).toEqual([{ niche: "dapur", audiens: "ibu muda", dipakai: "2026-11-11T08:00:00Z" }]);
  });

  it("membuang duplikat niche+audiens dan memindahkannya ke depan", () => {
    const awal = [
      { niche: "dapur", audiens: "ibu muda", dipakai: "2026-11-01T00:00:00Z" },
      { niche: "fashion", audiens: "mahasiswa", dipakai: "2026-10-01T00:00:00Z" },
    ];
    const hasil = tambahRiwayat(awal, { niche: "Fashion", audiens: "Mahasiswa" }, "2026-11-11T00:00:00Z");
    expect(hasil).toHaveLength(2);
    expect(hasil[0]?.niche).toBe("Fashion");
  });

  it("memotong riwayat ke batas maksimum", () => {
    let list = [] as ReturnType<typeof tambahRiwayat>;
    for (let i = 0; i < MAKS_RIWAYAT + 3; i += 1) {
      list = tambahRiwayat(list, { niche: `niche-${i}`, audiens: `audiens-${i}` });
    }
    expect(list).toHaveLength(MAKS_RIWAYAT);
  });

  it("mengabaikan entri kosong", () => {
    expect(tambahRiwayat([], { niche: " ", audiens: "ibu" })).toEqual([]);
  });
});
