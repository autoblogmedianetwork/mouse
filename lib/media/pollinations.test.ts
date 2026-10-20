import { describe, expect, it } from "vitest";
import {
  POLLINATIONS_BASE_URL,
  buildPollinationsUrl,
  rekomendasiPromptVisual,
} from "./pollinations";

describe("buildPollinationsUrl", () => {
  it("membentuk URL dengan parameter default 1080x1350 dan nologo=true", () => {
    const url = buildPollinationsUrl({ prompt: "workspace minimalist" });
    expect(url).toContain(POLLINATIONS_BASE_URL);
    expect(url).toContain("workspace%20minimalist");
    expect(url).toContain("width=1080");
    expect(url).toContain("height=1350");
    expect(url).toContain("nologo=true");
  });

  it("mendukung kustomisasi ukuran rasio 1:1 (1080x1080) dan seed", () => {
    const url = buildPollinationsUrl({
      prompt: "coffee table setup",
      width: 1080,
      height: 1080,
      seed: 42,
    });
    expect(url).toContain("width=1080");
    expect(url).toContain("height=1080");
    expect(url).toContain("seed=42");
  });

  it("fallback ke prompt aesthetic jika prompt kosong", () => {
    const url = buildPollinationsUrl({ prompt: "   " });
    expect(url).toContain("aesthetic%20minimalist%20background");
  });
});

describe("rekomendasiPromptVisual", () => {
  it("menghasilkan prompt problem/struggle untuk cover", () => {
    const promptCover = rekomendasiPromptVisual("cover", "meja kerja berantakan", "Organizer Meja");
    expect(promptCover).toContain("meja kerja berantakan");
    expect(promptCover).toContain("cinematic lighting");
    expect(promptCover).toContain("no text");
  });

  it("menghasilkan prompt aesthetic desk untuk CTA", () => {
    const promptCta = rekomendasiPromptVisual("cta", "Cek Link", "Tas Kuliah");
    expect(promptCta).toContain("minimalist aesthetic desk setup");
    expect(promptCta).toContain("clean workspace");
  });

  it("menghasilkan prompt konsep bersih untuk slide isi", () => {
    const promptIsi = rekomendasiPromptVisual("isi", "Bahan Tahan Air", "Tas Kuliah");
    expect(promptIsi).toContain("Bahan Tahan Air");
    expect(promptIsi).toContain("modern minimalist");
  });
});
