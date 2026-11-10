import { describe, expect, it } from "vitest";
import { MAKS_TAG, cocokTag, parseTag, semuaTag } from "./tag";

describe("parseTag", () => {
  it("memecah koma, merapikan, dan menurunkan huruf", () => {
    expect(parseTag("Ramah Pemula, komisi besar,")).toEqual(["ramah pemula", "komisi besar"]);
  });

  it("membuang duplikat dan membatasi jumlah tag", () => {
    const hasil = parseTag("a, a, b, c, d, e, f, g");
    expect(hasil).toEqual(["a", "b", "c", "d", "e"]);
    expect(hasil).toHaveLength(MAKS_TAG);
  });

  it("membuang tanda # dan spasi ganda", () => {
    expect(parseTag("#  komisi   besar ")).toEqual(["komisi besar"]);
  });
});

describe("semuaTag & cocokTag", () => {
  const produk = [
    { tag: ["ramah pemula", "murah"] },
    { tag: ["murah", "komisi besar"] },
    {},
  ];

  it("mengumpulkan tag unik terurut", () => {
    expect(semuaTag(produk)).toEqual(["komisi besar", "murah", "ramah pemula"]);
  });

  it("filter AND: semua tag harus ada", () => {
    expect(cocokTag(produk[0], ["murah"])).toBe(true);
    expect(cocokTag(produk[0], ["murah", "komisi besar"])).toBe(false);
    expect(cocokTag(produk[2], [])).toBe(true);
  });
});
