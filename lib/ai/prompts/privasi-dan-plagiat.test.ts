/**
 * Uji prompt versi baru: privasi review pasar, anti-plagiat mirror &
 * analisa gaya. Ketiganya memakai aturan "jangan menyalin" yang berbeda-beda,
 * jadi batasnya diuji eksplisit supaya tidak kabur lagi.
 */
import { describe, expect, it } from "vitest";
import {
  buildReviewPasarPrompt,
  PROMPT_VERSION as REVIEW_VERSI,
} from "./review-pasar.v2";
import { buildMirrorPrompt, PROMPT_VERSION as MIRROR_VERSI } from "./mirror.v2";
import {
  buildAnalisaGayaPrompt,
  PROMPT_VERSION as ANALISA_VERSI,
} from "./analisa-gaya.v2";

describe("review-pasar v2 — privasi pembeli", () => {
  const p = buildReviewPasarPrompt({
    niche: "peralatan dapur",
    audiens: "ibu rumah tangga",
    reviewMentah: "Barangnya bagus tapi lembek. Pengiriman lama. (Budi, Bandung)",
  });

  it("versi naik ke v2", () => {
    expect(REVIEW_VERSI).toBe("review-pasar.v2");
  });

  it("mewajibkan parafrase, bukan kutipan", () => {
    expect(p.toLowerCase()).toContain("parafrase");
    expect(p).toContain("DILARANG menyalin");
  });

  it("membatasi salinan 8 kata berturut-turut", () => {
    expect(p).toContain("8 kata berturut-turut");
  });

  it("meminta data pribadi dibuang", () => {
    expect(p.toLowerCase()).toContain("data pribadi");
    expect(p.toLowerCase()).toContain("nomor pesanan");
  });

  it("membatasi kosakata jadi potongan pendek, bukan kutipan utuh", () => {
    expect(p).toContain("MAKSIMAL 6 KATA");
  });
});

describe("mirror v2 — anti-plagiat", () => {
  const p = buildMirrorPrompt({ kontenKompetitor: "Contoh konten kreator lain yang cukup panjang." });

  it("versi naik ke v2", () => {
    expect(MIRROR_VERSI).toBe("mirror.v2");
  });

  it("membatasi salinan 5 kata berturut-turut", () => {
    expect(p).toContain("5 kata berturut-turut");
  });

  it("memisahkan pola yang boleh dari isi yang dilarang", () => {
    expect(p).toContain("Yang BOLEH diambil");
    expect(p).toContain("Yang DILARANG diambil");
  });

  it("melarang memakai nama kreator asli", () => {
    expect(p.toLowerCase()).toContain("nama kreator");
  });
});

describe("analisa-gaya v2 — anti-plagiat", () => {
  const p = buildAnalisaGayaPrompt({
    postMentah: "Post satu.\n\nPost dua.\n\nPost tiga.",
  });

  it("versi naik ke v2", () => {
    expect(ANALISA_VERSI).toBe("analisa-gaya.v2");
  });

  it("membatasi salinan 5 kata berturut-turut", () => {
    expect(p).toContain("5 kata berturut-turut");
  });

  it("catchphrase dibatasi 5 kata", () => {
    expect(p).toContain("MAKSIMAL 5 KATA");
  });

  it("menganjurkan mengosongkan bila ragu", () => {
    expect(p).toContain("KOSONGKAN");
  });
});
