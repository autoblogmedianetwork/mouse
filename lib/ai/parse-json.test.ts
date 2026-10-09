import { describe, expect, it } from "vitest";
import { parseModelJson } from "./parse-json";

describe("parseModelJson", () => {
  it("parses bare JSON", () => {
    expect(parseModelJson('{"a": 1}')).toEqual({ a: 1 });
  });

  it("parses pretty-printed JSON", () => {
    expect(parseModelJson('{\n  "a": [1, 2]\n}')).toEqual({ a: [1, 2] });
  });

  it("strips markdown fences", () => {
    expect(parseModelJson('```json\n{"a": 1}\n```')).toEqual({ a: 1 });
    expect(parseModelJson('```\n{"a": 1}\n```')).toEqual({ a: 1 });
  });

  it("strips surrounding prose", () => {
    expect(parseModelJson('Berikut hasilnya:\n{"ringkasan": "ok"}\nSemoga membantu!')).toEqual({
      ringkasan: "ok",
    });
  });

  it("parses top-level arrays", () => {
    expect(parseModelJson('[1, 2, 3]')).toEqual([1, 2, 3]);
    expect(parseModelJson('Hasilnya:\n[{"a": 1}]')).toEqual([{ a: 1 }]);
  });

  it("throws on text without JSON", () => {
    expect(() => parseModelJson("maaf, saya tidak bisa")).toThrow();
  });

  it("throws on malformed JSON", () => {
    expect(() => parseModelJson('{"a": ')).toThrow();
  });
});
