import { describe, expect, it } from "vitest";
import { MAX_KATA_SANDI, validasiKataSandi } from "./kata-sandi";

describe("validasiKataSandi", () => {
  it("rejects passwords below the floor", () => {
    expect(validasiKataSandi("")).toBe("Kata sandi minimal 8 karakter.");
    expect(validasiKataSandi("abc1234")).toBe("Kata sandi minimal 8 karakter.");
  });

  it("rejects passwords above what bcrypt can hash", () => {
    expect(validasiKataSandi(`${"a".repeat(MAX_KATA_SANDI)}1`)).toBe(
      "Kata sandi maksimal 72 karakter.",
    );
  });

  it("requires both letters and digits", () => {
    expect(validasiKataSandi("12345678")).toBe("Kata sandi harus memuat huruf.");
    expect(validasiKataSandi("abcdefgh")).toBe("Kata sandi harus memuat angka.");
  });

  it("accepts a mixed password, including non-latin letters", () => {
    expect(validasiKataSandi("rahasia123")).toBeNull();
    expect(validasiKataSandi("kataSandi9")).toBeNull();
    expect(validasiKataSandi("sandiñata9")).toBeNull();
    expect(validasiKataSandi("a".repeat(MAX_KATA_SANDI - 1) + "1")).toBeNull();
  });
});
