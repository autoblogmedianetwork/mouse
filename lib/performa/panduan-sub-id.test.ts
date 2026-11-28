import { describe, expect, it } from "vitest";
import { PANDUAN_SUB_ID, rapikanSubId, subIdValid } from "./panduan-sub-id";
import { subIdDefault } from "./atribusi";

describe("panduan sub_id", () => {
  it("kode bawaan dari atribusi lolos validasi", () => {
    const kode = subIdDefault("df0f7a2c-1111-2222-3333-444455556666");
    expect(subIdValid(kode)).toBe(true);
    expect(kode.length).toBeLessThanOrEqual(30);
  });

  it("menolak kode dengan spasi atau tanda baca asing", () => {
    expect(subIdValid("at 3f9c21")).toBe(false);
    expect(subIdValid("at/3f9c21")).toBe(false);
    expect(subIdValid("")).toBe(false);
  });

  it("menerima satu segmen dengan tanda hubung", () => {
    expect(subIdValid("at-3f9c21")).toBe(true);
  });

  it("merapikan spasi dan memotong ke 30 karakter", () => {
    expect(rapikanSubId("  at -3f9c 21 ")).toBe("at-3f9c21");
    expect(rapikanSubId("x".repeat(40))).toHaveLength(30);
  });

  it("panduan menyebut tempat menempel dan larangan pemendek link", () => {
    expect(PANDUAN_SUB_ID.tempat).toContain("Sub ID 1");
    expect(PANDUAN_SUB_ID.larangan).toContain("bit.ly");
    expect(PANDUAN_SUB_ID.larangan).toContain("6.3(o)");
    expect(PANDUAN_SUB_ID.format).toContain("5 segmen");
  });
});
