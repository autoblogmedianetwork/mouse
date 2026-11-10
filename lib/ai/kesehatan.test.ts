import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cek kesehatan harus membaca provider aktif di database, bukan env.
 * generateJSON dan katalog di-mock supaya test ini tidak membakar kredit AI.
 */
const m = vi.hoisted(() => ({
  providerAktif: vi.fn(),
  generateJSON: vi.fn(),
}));

vi.mock("./provider-store", () => ({ providerAktif: m.providerAktif }));

vi.mock("./generate-json", () => ({
  generateJSON: m.generateJSON,
  resolveApiKey: () => "kunci-env",
  resolveBaseURL: () => "https://env.example/v1",
  resolveModel: () => "model-env",
}));

import { periksaKesehatanAI } from "./kesehatan";

function katalogOk(id: string) {
  return new Response(JSON.stringify({ data: [{ id }] }), { status: 200 });
}

beforeEach(() => {
  m.providerAktif.mockReset();
  m.generateJSON.mockReset();
  m.generateJSON.mockResolvedValue({
    ok: true,
    data: { balasan: "ok" },
    attempts: 1,
    model: "model-db",
  });
  vi.stubGlobal("fetch", vi.fn(async () => katalogOk("model-db")));
});

describe("periksaKesehatanAI", () => {
  it("memakai provider database untuk katalog dan chat", async () => {
    m.providerAktif.mockResolvedValue({
      id: "p1",
      nama: "SUMO",
      baseUrl: "https://ai.sumopod.com",
      model: "model-db",
      isActive: true,
      apiKey: "kunci-db",
    });

    const hasil = await periksaKesehatanAI();

    expect(m.generateJSON).toHaveBeenCalledTimes(1);
    expect(m.generateJSON.mock.calls[0][2]).toMatchObject({
      apiKey: "kunci-db",
      baseURL: "https://ai.sumopod.com",
      model: "model-db",
    });
    expect(hasil.ok).toBe(true);
    expect(hasil.sumber).toBe("database");
    expect(hasil.namaProvider).toBe("SUMO");
    expect(hasil.baseUrl).toBe("https://ai.sumopod.com");
  });

  it("jatuh ke env bila tidak ada provider aktif", async () => {
    m.providerAktif.mockResolvedValue(null);

    const hasil = await periksaKesehatanAI();

    expect(m.generateJSON.mock.calls[0][2]).toMatchObject({
      apiKey: "kunci-env",
      baseURL: "https://env.example/v1",
      model: "model-env",
    });
    expect(hasil.sumber).toBe("env");
    expect(hasil.namaProvider).toBeNull();
  });
});
