import { describe, expect, it } from "vitest";
import { MAX_STATUS_LENGTH } from "@/lib/statuses/validator-500";
import {
  BATAS_PLATFORM,
  LABEL_MODE_OUTPUT,
  MODE_OUTPUT_IDS,
  batasKarakterMode,
  batasPlatform,
} from "./batas";

describe("batas platform (fitur 9)", () => {
  it("memuat Threads 500, X 280, WhatsApp 700, TikTok 2200 (ADR 0020)", () => {
    expect(BATAS_PLATFORM.threads).toBe(500);
    expect(BATAS_PLATFORM.x).toBe(280);
    expect(BATAS_PLATFORM.whatsapp_status).toBe(700);
    expect(BATAS_PLATFORM.tiktok_caption).toBe(2200);
  });

  it("X lebih ketat daripada Threads", () => {
    expect(batasPlatform("x")).toBeLessThan(batasPlatform("threads"));
  });

  it("fallback untuk nilai tak dikenal adalah batas Threads", () => {
    expect(batasPlatform("mastodon" as never)).toBe(MAX_STATUS_LENGTH);
  });
});

describe("batasKarakterMode", () => {
  it("mengikuti platform untuk mode teks", () => {
    expect(batasKarakterMode("threads")).toBe(500);
    expect(batasKarakterMode("x")).toBe(280);
    expect(batasKarakterMode("whatsapp_status")).toBe(700);
    expect(batasKarakterMode("tiktok_caption")).toBe(2200);
  });

  it("naskah video dan carousel memakai batas database (500), bukan 280", () => {
    expect(batasKarakterMode("naskah_video")).toBe(MAX_STATUS_LENGTH);
    expect(batasKarakterMode("carousel")).toBe(MAX_STATUS_LENGTH);
  });
});

describe("daftar mode output", () => {
  it("setiap mode punya label", () => {
    for (const mode of MODE_OUTPUT_IDS) {
      expect(LABEL_MODE_OUTPUT[mode].length).toBeGreaterThan(0);
    }
  });

  it("enam mode: threads, x, whatsapp_status, tiktok_caption, naskah_video, carousel", () => {
    expect([...MODE_OUTPUT_IDS]).toEqual([
      "threads",
      "x",
      "whatsapp_status",
      "tiktok_caption",
      "naskah_video",
      "carousel",
    ]);
  });
});
