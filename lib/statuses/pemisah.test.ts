import { describe, expect, it } from "vitest";
import { splitIntoStatuses } from "./pemisah";
import { MAX_STATUS_LENGTH, charLength } from "./validator-500";

describe("splitIntoStatuses", () => {
  it("keeps short text as a single status", () => {
    expect(splitIntoStatuses("Halo dunia")).toEqual(["Halo dunia"]);
  });

  it("returns an empty array for empty or whitespace-only input", () => {
    expect(splitIntoStatuses("")).toEqual([]);
    expect(splitIntoStatuses("   \n  ")).toEqual([]);
  });

  it("splits long text into statuses of at most 500 characters", () => {
    const paragraph = "Ini adalah kalimat contoh yang cukup panjang. ".repeat(20);
    const text = `${paragraph}\n\n${paragraph}\n\n${paragraph}`;
    const statuses = splitIntoStatuses(text);

    expect(statuses.length).toBeGreaterThan(1);
    for (const status of statuses) {
      expect(charLength(status)).toBeLessThanOrEqual(MAX_STATUS_LENGTH);
    }
    // No content is lost: joined text (minus separators) still contains the source words.
    const joined = statuses.join(" ").replace(/\s+/g, " ").trim();
    const source = text.replace(/\s+/g, " ").trim();
    expect(joined).toBe(source);
  });

  it("prefers paragraph breaks over sentence breaks when over the limit", () => {
    const p1 = "Paragraf satu yang cukup panjang. ".repeat(10).trim();
    const p2 = "Paragraf dua yang cukup panjang. ".repeat(10).trim();
    const statuses = splitIntoStatuses(`${p1}\n\n${p2}`);

    expect(statuses).toHaveLength(2);
    expect(statuses[0]).toBe(p1);
    expect(statuses[1]).toBe(p2);
  });

  it("prefers sentence breaks over word breaks when over the limit", () => {
    const sentences = Array.from(
      { length: 12 },
      (_, i) => `Ini adalah kalimat nomor ${i} yang panjangnya lumayan.`,
    );
    const text = sentences.join(" ");
    const statuses = splitIntoStatuses(text);

    expect(statuses.length).toBeGreaterThan(1);
    for (const status of statuses) {
      expect(charLength(status)).toBeLessThanOrEqual(MAX_STATUS_LENGTH);
      // Every piece ends on a sentence boundary, never mid-word.
      expect(status).toMatch(/[.!?…]$/);
    }
    expect(statuses.join(" ")).toBe(text);
  });

  it("hard-splits a single word longer than the limit", () => {
    const longWord = "a".repeat(MAX_STATUS_LENGTH + 50);
    const statuses = splitIntoStatuses(longWord);
    expect(statuses.length).toBe(2);
    expect(charLength(statuses[0])).toBe(MAX_STATUS_LENGTH);
    expect(charLength(statuses[1])).toBe(50);
  });

  it("handles text with emoji without corrupting surrogate pairs", () => {
    const emojiLine = "🔥 Produk keren banget! ".repeat(30);
    const statuses = splitIntoStatuses(emojiLine);
    for (const status of statuses) {
      expect(charLength(status)).toBeLessThanOrEqual(MAX_STATUS_LENGTH);
      expect(status).not.toContain("\uFFFD");
    }
  });

  it("splits to a custom limit (fitur 9: X 280)", () => {
    const paragraph = "Ini adalah kalimat contoh yang cukup panjang. ".repeat(20).trim();
    const statuses = splitIntoStatuses(paragraph, 280);
    expect(statuses.length).toBeGreaterThan(1);
    for (const status of statuses) {
      expect(charLength(status)).toBeLessThanOrEqual(280);
    }
    expect(statuses.join(" ")).toBe(paragraph);
  });

  it("hard-splits a long token to a custom limit", () => {
    const longWord = "b".repeat(700);
    const statuses = splitIntoStatuses(longWord, 280);
    expect(statuses).toHaveLength(3);
    expect(statuses.join("")).toBe(longWord);
  });
});
