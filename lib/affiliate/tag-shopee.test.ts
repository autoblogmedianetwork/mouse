import { describe, expect, it } from "vitest";
import {
  MAKS_TAG,
  pasangTag,
  rapikanNamaProduk,
  susunTag,
  tagDariLink,
  tagValid,
} from "./tag-shopee";

describe("rapikanNamaProduk", () => {
  it("jadikan PascalCase tanpa spasi & tanda baca", () => {
    expect(rapikanNamaProduk("Lampu Nyamuk")).toBe("LampuNyamuk");
    expect(rapikanNamaProduk("Tumbler Stainless 6 Jam!", 20)).toBe("TumblerStainless6Jam");
    expect(rapikanNamaProduk("Baju Anak (Premium) Katun", 20)).toBe("BajuAnakPremiumKatun");
  });

  it("buang diakritik dan aman untuk nama kosong", () => {
    expect(rapikanNamaProduk("Café Crème")).toBe("CafeCreme");
    expect(rapikanNamaProduk("")).toBe("Produk");
    expect(rapikanNamaProduk("!!!")).toBe("Produk");
  });
});

describe("susunTag", () => {
  it("format [Platform][Jenis][Produk]", () => {
    expect(susunTag("instagram", "story", "Lampu Nyamuk")).toBe("IGStoryLampuNyamuk");
    expect(susunTag("threads", "status", "Baju Anak")).toBe("THStatusBajuAnak");
    expect(susunTag("tiktok", "video", "Tumbler")).toBe("TTVideoTumbler");
  });

  it("tidak melebihi batas dan tidak memotong awalan", () => {
    const tag = susunTag("whatsapp", "review", "Produk Dengan Nama Yang Sangat Panjang Sekali");
    expect(tag.length).toBeLessThanOrEqual(MAKS_TAG);
    expect(tag.startsWith("WAReview")).toBe(true);
    expect(tagValid(tag)).toBe(true);
  });

  it("semua kombinasi menghasilkan tag valid", () => {
    for (const p of ["threads", "instagram", "tiktok", "facebook", "whatsapp"] as const) {
      for (const j of ["status", "story", "video", "review"] as const) {
        expect(tagValid(susunTag(p, j, "Produk Uji"))).toBe(true);
      }
    }
  });
});

describe("pasangTag", () => {
  it("menambahkan tag ke link Shopee", () => {
    const hasil = pasangTag("https://shope.ee/abc123", "THStatusBaju");
    expect(hasil).toContain("tag=THStatusBaju");
  });

  it("mengganti tag lama, bukan menambah dua tag", () => {
    const hasil = pasangTag("https://shope.ee/abc?tag=LAMA", "IGStoryBaru");
    const jumlah = hasil.split("tag=").length - 1;
    expect(jumlah).toBe(1);
    expect(hasil).toContain("IGStoryBaru");
    expect(hasil).not.toContain("LAMA");
  });

  it("mengembalikan link apa adanya bila tag tidak valid", () => {
    expect(pasangTag("https://shope.ee/abc", "ada spasi")).toBe("https://shope.ee/abc");
    expect(pasangTag("https://shope.ee/abc", "")).toBe("https://shope.ee/abc");
    expect(pasangTag("bukan url", "THStatusA")).toBe("bukan url");
  });

  it("mempertahankan parameter lain di link", () => {
    const hasil = pasangTag("https://shope.ee/abc?utm_source=x&tag=lama", "THA");
    expect(hasil).toContain("utm_source=x");
    expect(hasil).toContain("tag=THA");
  });
});

describe("tagDariLink & tagValid", () => {
  it("membaca tag yang ada", () => {
    expect(tagDariLink("https://shope.ee/abc?tag=IGStoryLampu")).toBe("IGStoryLampu");
    expect(tagDariLink("https://shope.ee/abc")).toBeNull();
    expect(tagDariLink("bukan url")).toBeNull();
  });

  it("hanya menerima alfanumerik 1-30 karakter", () => {
    expect(tagValid("THStatusBaju")).toBe(true);
    expect(tagValid("ABC123")).toBe(true);
    expect(tagValid("")).toBe(false);
    expect(tagValid("ada-spasi")).toBe(false);
    expect(tagValid("a".repeat(31))).toBe(false);
  });
});
