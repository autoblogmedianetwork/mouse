import { describe, expect, it } from "vitest";
import {
  buatTimeCapsule,
  siapDibuka,
  tandaiDibuka,
  validasiTimeCapsule,
} from "./time-capsule";

describe("validasiTimeCapsule", () => {
  const sekarang = new Date("2026-01-01T00:00:00Z");
  const besok = "2026-01-02";

  it("menerima input valid", () => {
    expect(validasiTimeCapsule("Judul", "Isi", besok, sekarang)).toBeNull();
  });

  it("menolak judul kosong", () => {
    expect(validasiTimeCapsule("", "Isi", besok, sekarang)).not.toBeNull();
  });

  it("menolak tanggal hari ini", () => {
    expect(validasiTimeCapsule("Judul", "Isi", "2026-01-01", sekarang)).not.toBeNull();
  });

  it("menolak isi kosong", () => {
    expect(validasiTimeCapsule("Judul", "", besok, sekarang)).not.toBeNull();
  });
});

describe("buatTimeCapsule & siapDibuka", () => {
  it("membuat capsule dengan id", () => {
    const c = buatTimeCapsule("J", "I", "2026-02-01");
    expect(c.id.length).toBeGreaterThan(0);
    expect(c.dibuka_pada).toBeNull();
  });

  it("siapDibuka false sebelum tanggal", () => {
    const c = buatTimeCapsule("J", "I", "2026-02-01");
    expect(siapDibuka(c, new Date("2026-01-01"))).toBe(false);
  });

  it("tandaiDibuka mengisi dibuka_pada", () => {
    const c = buatTimeCapsule("J", "I", "2026-02-01");
    const next = tandaiDibuka([c], c.id, new Date("2026-02-02"));
    expect(next[0].dibuka_pada).not.toBeNull();
  });
});
