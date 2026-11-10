import { describe, expect, it } from "vitest";
import { MAKS_HASHTAG, bangkitkanHashtag } from "./hashtag";

describe("bangkitkanHashtag", () => {
  it("menghasilkan paling banyak 10 tagar unik dengan awalan #", () => {
    const hasil = bangkitkanHashtag({ nama: "Tumbler Stainless 500ml", kategori: "dapur" });
    expect(hasil.length).toBeLessThanOrEqual(MAKS_HASHTAG);
    expect(hasil.length).toBeGreaterThanOrEqual(5);
    expect(new Set(hasil).size).toBe(hasil.length);
    expect(hasil.every((tag) => tag.startsWith("#"))).toBe(true);
  });

  it("memakai kata produk dan tagar kategori yang relevan", () => {
    const hasil = bangkitkanHashtag({ nama: "Serum Vitamin C", kategori: "kecantikan" });
    expect(hasil).toContain("#serum");
    expect(hasil).toContain("#skincareroutine");
  });

  it("menyaring tagar yang memuat kata klaim berisiko", () => {
    const hasil = bangkitkanHashtag({ nama: "Produk Terbaik 100% Ampuh" });
    expect(hasil.some((tag) => tag.includes("terbaik"))).toBe(false);
    expect(hasil.some((tag) => tag.includes("ampuh"))).toBe(false);
  });

  it("tetap mengembalikan tagar umum saat nama produk tidak memuat kata panjang", () => {
    const hasil = bangkitkanHashtag({ nama: "Tas" });
    expect(hasil.length).toBeGreaterThan(0);
    expect(hasil).toContain("#reviewjujur");
  });
});
