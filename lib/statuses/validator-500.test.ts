import { describe, expect, it } from "vitest";
import { MAX_STATUS_LENGTH, charLength, validateStatus, validateStatusList } from "./validator-500";
import { splitIntoStatuses } from "./pemisah";

describe("validateStatus", () => {
  it("accepts text within the limit", () => {
    const text = "a".repeat(MAX_STATUS_LENGTH);
    expect(validateStatus(text)).toEqual({ ok: true, length: 500 });
  });

  it("rejects text over the limit", () => {
    const text = "a".repeat(MAX_STATUS_LENGTH + 1);
    const result = validateStatus(text);
    expect(result.ok).toBe(false);
    expect(result.length).toBe(501);
    expect(result.error).toContain("501");
  });

  it("rejects empty text", () => {
    expect(validateStatus("").ok).toBe(false);
    expect(validateStatus("   ").ok).toBe(false);
  });

  it("counts code points, not UTF-16 units", () => {
    // Each emoji is one code point but two UTF-16 units.
    const emojiOnly = "\u{1F600}".repeat(MAX_STATUS_LENGTH);
    expect(charLength(emojiOnly)).toBe(500);
    expect(validateStatus(emojiOnly).ok).toBe(true);
  });
});

describe("validateStatusList", () => {
  it("accepts a fully valid thread", () => {
    const result = validateStatusList(["Satu", "Dua", "Tiga"]);
    expect(result.ok).toBe(true);
    expect(result.invalidIndexes).toEqual([]);
  });

  it("reports the indexes of invalid statuses", () => {
    const result = validateStatusList(["ok", "x".repeat(501), "also ok", ""]);
    expect(result.ok).toBe(false);
    expect(result.invalidIndexes).toEqual([1, 3]);
  });
});

describe("custom limit (fitur 9: X 280)", () => {
  it("validateStatus honours a custom limit", () => {
    expect(validateStatus("a".repeat(280), 280).ok).toBe(true);
    const over = validateStatus("a".repeat(281), 280);
    expect(over.ok).toBe(false);
    expect(over.error).toContain("280");
  });

  it("validateStatusList honours a custom limit", () => {
    const result = validateStatusList(["ok", "x".repeat(281)], 280);
    expect(result.ok).toBe(false);
    expect(result.invalidIndexes).toEqual([1]);
  });

  it("default limit stays 500", () => {
    expect(validateStatus("a".repeat(500)).ok).toBe(true);
    expect(validateStatus("a".repeat(501)).ok).toBe(false);
  });
});

describe("splitIntoStatuses", () => {
  it("returns a single status for short text", () => {
    expect(splitIntoStatuses("Pesan pendek.")).toEqual(["Pesan pendek."]);
  });

  it("splits to a custom limit when given one (fitur 9)", () => {
    const text = "Kalimat contoh yang cukup panjang untuk dipecah. ".repeat(20).trim();
    const statuses = splitIntoStatuses(text, 280);
    expect(statuses.length).toBeGreaterThan(1);
    for (const status of statuses) {
      expect(charLength(status)).toBeLessThanOrEqual(280);
    }
    expect(statuses.join(" ")).toBe(text);
  });

  it("returns empty array for empty input", () => {
    expect(splitIntoStatuses("   ")).toEqual([]);
  });

  it("splits by paragraphs when they fit", () => {
    const p1 = "Paragraf satu. ".repeat(20).trim(); // ~320 chars
    const p2 = "Paragraf dua. ".repeat(20).trim(); // ~280 chars
    const result = splitIntoStatuses(p1 + "\n\n" + p2);
    expect(result).toHaveLength(2);
    for (const status of result) {
      expect(charLength(status)).toBeLessThanOrEqual(500);
    }
  });

  it("keeps every character of the input (minus collapsed whitespace)", () => {
    const p1 = "Satu ".repeat(100); // 500 incl trailing space
    const p2 = "Dua ".repeat(100);
    const result = splitIntoStatuses(p1.trim() + "\n\n" + p2.trim());
    const joined = result.join(" ");
    expect(joined.replace(/\s+/g, " ")).toBe(
      (p1.trim() + " " + p2.trim()).replace(/\s+/g, " ")
    );
  });

  it("splits a long paragraph by sentences", () => {
    const sentence = "Kalimat ini cukup panjang untuk diuji pemisahannya. ";
    const result = splitIntoStatuses(sentence.repeat(60).trim());
    expect(result.length).toBeGreaterThan(1);
    for (const status of result) {
      expect(charLength(status)).toBeLessThanOrEqual(500);
      expect(status.endsWith(".")).toBe(true);
    }
  });

  it("splits a long sentence by words", () => {
    const words = " ".concat("kata ".repeat(400)).trim();
    const result = splitIntoStatuses(words);
    expect(result.length).toBeGreaterThan(1);
    for (const status of result) {
      expect(charLength(status)).toBeLessThanOrEqual(500);
    }
  });

  it("hard-splits a single unbreakable token", () => {
    const token = "x".repeat(1200);
    const result = splitIntoStatuses(token);
    expect(result.length).toBeGreaterThan(1);
    expect(result.join("")).toBe(token);
    for (const status of result) {
      expect(charLength(status)).toBeLessThanOrEqual(500);
    }
  });

  it("never produces a status over the limit for a huge mixed input", () => {
    const input = (
      "Produk bagus sekali. ".repeat(50) +
      "\n\n" +
      "Bahan premium nyaman. ".repeat(50) +
      "\n\n" +
      "Harga bersahabat ".repeat(40)
    ).trim();
    const result = splitIntoStatuses(input);
    for (const status of result) {
      expect(validateStatus(status).ok).toBe(true);
    }
  });
});
