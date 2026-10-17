import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  susunScenesDariStatuses,
  isHyperFramesAvailable,
  kirimRenderHyperFrames,
  DEFAULT_HYPERFRAMES_URL,
} from "./hyperframes";

describe("HyperFrames adapter", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("susunScenesDariStatuses", () => {
    it("mengembalikan scene default bila status kosong", () => {
      const scenes = susunScenesDariStatuses([], "https://example.com/foto.jpg");
      expect(scenes).toHaveLength(1);
      expect(scenes[0].tipe).toBe("hook");
      expect(scenes[0].mediaUrl).toBe("https://example.com/foto.jpg");
    });

    it("memecah 1 status menjadi 1 scene hook", () => {
      const scenes = susunScenesDariStatuses(["Lampu LED anti nyamuk ini juara"]);
      expect(scenes).toHaveLength(1);
      expect(scenes[0].teksUtama).toBe("Lampu LED anti nyamuk ini juara");
      expect(scenes[0].durasiDetik).toBe(5);
    });

    it("memecah beberapa status menjadi hook, isi, dan cta", () => {
      const statusList = [
        "Status 1: Hook memikat penonton",
        "Status 2: Fitur lampu UV dan jaring listrik",
        "Status 3: Suara hening tidak ganggu tidur",
        "Status 4: Kekurangan kabel agak pendek tapi worth it. Cek bio #affiliate",
      ];
      const scenes = susunScenesDariStatuses(statusList, "https://example.com/foto.jpg");
      expect(scenes).toHaveLength(4);
      expect(scenes[0].tipe).toBe("hook");
      expect(scenes[1].tipe).toBe("isi");
      expect(scenes[2].tipe).toBe("isi");
      expect(scenes[3].tipe).toBe("cta");
      expect(scenes[0].durasiDetik).toBe(3);
      expect(scenes[3].durasiDetik).toBe(4);
    });
  });

  describe("isHyperFramesAvailable", () => {
    it("mengembalikan true jika endpoint /health mengembalikan 200 OK", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
        }),
      );

      const available = await isHyperFramesAvailable(DEFAULT_HYPERFRAMES_URL);
      expect(available).toBe(true);
    });

    it("mengembalikan false jika service tidak terhubung", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
      );

      const available = await isHyperFramesAvailable(DEFAULT_HYPERFRAMES_URL);
      expect(available).toBe(false);
    });
  });

  describe("kirimRenderHyperFrames", () => {
    it("mengembalikan videoUrl ketika render sukses", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ videoUrl: "http://localhost:7002/output/video-123.mp4" }),
        }),
      );

      const res = await kirimRenderHyperFrames({
        judul: "Video Demo",
        produkNama: "Lampu LED",
        rasio: "9:16",
        scenes: [],
      });

      expect(res.ok).toBe(true);
      expect(res.videoUrl).toBe("http://localhost:7002/output/video-123.mp4");
    });
  });
});
