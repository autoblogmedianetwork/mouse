import { describe, expect, it } from "vitest";
import { badgeUntukLevel, levelDariXp, tambahXp, xpKeLevelBerikutnya } from "./gamifikasi";

describe("levelDariXp", () => {
  it("0 xp = level 1", () => expect(levelDariXp(0)).toBe(1));
  it("100 xp = level 2", () => expect(levelDariXp(100)).toBe(2));
  it("250 xp = level 3", () => expect(levelDariXp(250)).toBe(3));
});

describe("xpKeLevelBerikutnya", () => {
  it("sisa menuju level berikut", () => {
    const r = xpKeLevelBerikutnya(30);
    expect(r.level).toBe(1);
    expect(r.xpDiLevel).toBe(30);
    expect(r.sisa).toBe(70);
  });
});

describe("badgeUntukLevel", () => {
  it("level 1 tanpa badge", () => expect(badgeUntukLevel(1)).toEqual([]));
  it("level 5 punya badge", () => expect(badgeUntukLevel(5)).toContain("Pembuat Konten"));
});

describe("tambahXp", () => {
  it("menambah xp dan riwayat", () => {
    const p = tambahXp({ xp: 10, riwayat: [] }, "buat konten", 20);
    expect(p.xp).toBe(30);
    expect(p.riwayat).toHaveLength(1);
  });

  it("tidak negatif", () => {
    const p = tambahXp({ xp: 5, riwayat: [] }, "minus", -100);
    expect(p.xp).toBe(0);
  });
});
