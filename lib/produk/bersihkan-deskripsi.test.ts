import { describe, expect, it } from "vitest";
import {
  MAX_CLEAN_DESCRIPTION_LENGTH,
  charLength,
  cleanDescription,
} from "./bersihkan-deskripsi";

describe("cleanDescription", () => {
  it("removes http and https links", () => {
    const input =
      "Deskripsi produk https://shopee.co.id/abc?param=1 dan https://s.shopee.co.id/xYz teks setelah link";
    const result = cleanDescription(input);
    expect(result).not.toContain("shopee.co.id");
    expect(result).toContain("Deskripsi produk");
    expect(result).toContain("teks setelah link");
  });

  it("removes bare www links", () => {
    const result = cleanDescription("Kunjungi www.tokoserbaada.id sekarang");
    expect(result).not.toContain("www.");
    expect(result).toContain("Kunjungi");
  });

  it("removes hashtag spam", () => {
    const result = cleanDescription("Kaos oversize #kaos #ootd #racunshopee nyaman dipakai");
    expect(result).not.toContain("#");
    expect(result).toContain("Kaos oversize");
    expect(result).toContain("nyaman dipakai");
  });

  it("collapses runs of 3+ emoji down to 2", () => {
    const input = "Promo \u{1F525}\u{1F525}\u{1F525}\u{1F525} spesial hari ini";
    const result = cleanDescription(input);
    expect(result).toContain("\u{1F525}\u{1F525}");
    expect(result).not.toContain("\u{1F525}\u{1F525}\u{1F525}");
  });

  it("keeps up to 2 consecutive emoji untouched", () => {
    const input = "Bagus \u{2728}\u{2728} banget";
    expect(cleanDescription(input)).toBe(input);
  });

  it("removes repeated lines keeping the first occurrence", () => {
    const input = ["Stok terbatas!", "Bahan premium", "Stok terbatas!", "Bahan premium", "Harga bersahabat"].join("\n");
    const result = cleanDescription(input);
    expect(result).toBe("Stok terbatas!\nBahan premium\nHarga bersahabat");
  });

  it("removes repeated lines case-insensitively", () => {
    const input = ["GRATIS ONGKIR", "Detail bagus", "gratis onkir"].join("\n");
    // "gratis onkir" differs from "GRATIS ONGKIR" so both survive; use an exact case variant
    const input2 = ["GRATIS ONGKIR", "Detail bagus", "Gratis Ongkir"].join("\n");
    expect(cleanDescription(input2)).toBe("GRATIS ONGKIR\nDetail bagus");
    expect(cleanDescription(input)).toBe(input);
  });

  it("collapses 3+ blank lines into one blank line", () => {
    const input = "Baris satu\n\n\n\n\nBaris dua";
    expect(cleanDescription(input)).toBe("Baris satu\n\nBaris dua");
  });

  it("collapses multiple spaces inside a line", () => {
    const input = "Ukuran   S,   M,   L  tersedia";
    expect(cleanDescription(input)).toBe("Ukuran S, M, L tersedia");
  });

  it("truncates to at most 3000 characters", () => {
    const input = "kata ".repeat(1000); // 5000 chars
    const result = cleanDescription(input);
    expect(charLength(result)).toBeLessThanOrEqual(MAX_CLEAN_DESCRIPTION_LENGTH);
  });

  it("truncates at a word boundary (no partial word)", () => {
    const input = "awal " + "x".repeat(2995) + " akhir kalimat";
    const result = cleanDescription(input);
    expect(result.endsWith("x")).toBe(true);
    expect(result).not.toMatch(/\sx{0,2}akhir kalimat$/);
  });

  it("is idempotent", () => {
    const input = " Promo!! \nhttps://a.co.id/1 \n#spam #spam2 \n\n\nDuplikat \nDuplikat \n\u{1F525}\u{1F525}\u{1F525} ";
    expect(cleanDescription(cleanDescription(input))).toBe(cleanDescription(input));
  });

  it("normalizes CRLF line endings", () => {
    const input = "Baris satu\r\nBaris dua";
    expect(cleanDescription(input)).toBe("Baris satu\nBaris dua");
  });

  it("returns empty string for empty input", () => {
    expect(cleanDescription("")).toBe("");
    expect(cleanDescription("   \n  ")).toBe("");
  });

  it("keeps a realistic Shopee-style description intact except spam", () => {
    const input = [
      "Kaos Polos Premium Cotton Combed 30s",
      "https://shopee.co.id/kaos-premium-i.123.456",
      "",
      "Bahan: cotton combed 30s, adem dan tidak melawas",
      "",
      "",
      "Size: S M L XL XXL",
      "#kaospolos #grosirkaos",
    ].join("\n");
    const result = cleanDescription(input);
    expect(result).toBe(
      "Kaos Polos Premium Cotton Combed 30s\n\nBahan: cotton combed 30s, adem dan tidak melawas\n\nSize: S M L XL XXL"
    );
  });
});

describe("charLength", () => {
  it("counts code points, not UTF-16 units", () => {
    // \u{1F525} is one code point but two UTF-16 units
    expect(charLength("\u{1F525}")).toBe(1);
    expect(charLength("abc")).toBe(3);
  });
});
