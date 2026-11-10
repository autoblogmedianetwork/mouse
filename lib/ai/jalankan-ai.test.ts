import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

/**
 * Unit test pipeline tanpa memanggil provider sungguhan (tanpa biaya).
 * Fokus: urutan provider DB -> env fallback dan label provider di hasil.
 */
const m = vi.hoisted(() => ({
  generateJSON: vi.fn(),
  resolveApiKey: vi.fn(),
  providerKandidat: vi.fn(),
  catatGenerasi: vi.fn(),
}));

vi.mock("./generate-json", () => ({
  generateJSON: m.generateJSON,
  resolveApiKey: m.resolveApiKey,
}));

vi.mock("./provider-store", () => ({ providerKandidat: m.providerKandidat }));

vi.mock("./catat-generation", () => ({
  catatGenerasi: m.catatGenerasi,
  hitungBiayaUsd: () => null,
  keadaanAnggaran: async () => ({ boleh: true, batas: 5, terpakai: 0, statistik: null }),
}));

vi.mock("@/lib/rate-limit", () => ({ periksaRateLimit: () => ({ boleh: true }) }));

vi.mock("@/lib/supabase/server", () => ({
  klienServer: async () => ({}),
  penggunaSaatIni: async () => ({ id: "user-1" }),
}));

import { jalankanAI } from "./jalankan-ai";

const args = {
  jenis: "ide" as const,
  promptVersion: "v1",
  prompt: "uji",
  schema: z.object({}),
};

const providerDb = {
  id: "p1",
  nama: "SUMO",
  baseUrl: "https://ai.sumopod.com",
  model: "model-db",
  isActive: true,
  apiKey: "kunci-db",
};

function gagal(error: string) {
  return { ok: false as const, error, attempts: 1 };
}

function sukses(data: unknown, model = "model-db") {
  return { ok: true as const, data, attempts: 1, model };
}

beforeEach(() => {
  m.generateJSON.mockReset();
  m.resolveApiKey.mockReset();
  m.providerKandidat.mockReset();
  m.catatGenerasi.mockReset();
  m.providerKandidat.mockResolvedValue([]);
  m.resolveApiKey.mockReturnValue(undefined);
  m.catatGenerasi.mockResolvedValue(undefined);
});

describe("jalankanAI provider", () => {
  it("memakai provider aktif dari database lebih dulu", async () => {
    m.providerKandidat.mockResolvedValue([providerDb]);
    m.resolveApiKey.mockReturnValue("kunci-env");
    m.generateJSON.mockResolvedValue(sukses({}));

    const { result } = await jalankanAI(args);

    expect(m.generateJSON).toHaveBeenCalledTimes(1);
    expect(m.generateJSON.mock.calls[0][2]).toMatchObject({
      apiKey: "kunci-db",
      baseURL: "https://ai.sumopod.com",
      model: "model-db",
    });
    expect(result.provider).toBe("SUMO");
    expect(result.providerFallback).toBeUndefined();
  });

  it("jatuh ke env saat semua provider database gagal", async () => {
    m.providerKandidat.mockResolvedValue([providerDb]);
    m.resolveApiKey.mockReturnValue("kunci-env");
    m.generateJSON
      .mockResolvedValueOnce(gagal("provider mati"))
      .mockResolvedValueOnce(sukses({}, "model-env"));

    const { result } = await jalankanAI(args);

    expect(m.generateJSON).toHaveBeenCalledTimes(2);
    // Panggilan env tidak membawa kunci/baseURL provider DB.
    expect(m.generateJSON.mock.calls[1][2]).toMatchObject({ model: undefined });
    expect(m.generateJSON.mock.calls[1][2]).not.toHaveProperty("apiKey");
    expect(result.ok).toBe(true);
    expect(result.provider).toBe("env");
    expect(result.providerFallback).toBe(true);
  });

  it("tidak memanggil env bila kuncinya tidak ada; error DB dipertahankan", async () => {
    m.providerKandidat.mockResolvedValue([providerDb]);
    m.resolveApiKey.mockReturnValue(undefined);
    m.generateJSON.mockResolvedValue(gagal("provider mati"));

    const { result } = await jalankanAI(args);

    expect(m.generateJSON).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(false);
    expect(result.provider).toBe("SUMO");
    expect(result.error).toBe("provider mati");
  });

  it("menggabungkan error env saat keduanya gagal", async () => {
    m.providerKandidat.mockResolvedValue([providerDb]);
    m.resolveApiKey.mockReturnValue("kunci-env");
    m.generateJSON
      .mockResolvedValueOnce(gagal("provider mati"))
      .mockResolvedValueOnce(gagal("env mati"));

    const { result } = await jalankanAI(args);

    expect(result.provider).toBe("SUMO");
    expect(result.error).toContain("provider mati");
    expect(result.error).toContain("env mati");
  });
});
