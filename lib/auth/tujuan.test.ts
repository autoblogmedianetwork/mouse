import { describe, expect, it } from "vitest";
import { tautanMasuk, tujuanAman } from "./tujuan";

describe("tujuanAman", () => {
  it("falls back to the dashboard when nothing is given", () => {
    expect(tujuanAman(null)).toBe("/");
    expect(tujuanAman(undefined)).toBe("/");
    expect(tujuanAman("")).toBe("/");
    expect(tujuanAman("   ")).toBe("/");
  });

  it("keeps internal paths including query strings", () => {
    expect(tujuanAman("/riset")).toBe("/riset");
    expect(tujuanAman("/posting/baru?prefill=abc")).toBe("/posting/baru?prefill=abc");
    expect(tujuanAman("  /antrian  ")).toBe("/antrian");
  });

  it("rejects anything that could leave the app", () => {
    expect(tujuanAman("//evil.example")).toBe("/");
    expect(tujuanAman("/\\evil.example")).toBe("/");
    expect(tujuanAman("https://evil.example")).toBe("/");
    expect(tujuanAman("javascript:alert(1)")).toBe("/");
    expect(tujuanAman("masuk")).toBe("/");
  });

  it("rejects control characters", () => {
    expect(tujuanAman("/riset\nSet-Cookie: x=1")).toBe("/");
  });
});

describe("tautanMasuk", () => {
  it("omits the parameter when the destination is the dashboard", () => {
    expect(tautanMasuk("/")).toBe("/masuk");
    expect(tautanMasuk("//evil.example")).toBe("/masuk");
  });

  it("encodes the destination path", () => {
    expect(tautanMasuk("/posting/baru?prefill=a b")).toBe(
      "/masuk?tujuan=%2Fposting%2Fbaru%3Fprefill%3Da%20b",
    );
  });
});
