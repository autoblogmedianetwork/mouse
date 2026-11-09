import { describe, expect, it } from "vitest";
import { pilihTerbaru } from "./draft-sync";

describe("pilihTerbaru (Fase 2-C: resolusi konflik draft lokal vs server)", () => {
  it("dua-duanya kosong -> kosong", () => {
    expect(pilihTerbaru(null, null)).toEqual({ data: null, sumber: "kosong" });
  });

  it("hanya lokal -> lokal", () => {
    const lokal = { updatedAt: "2026-11-10T01:00:00.000Z" };
    expect(pilihTerbaru(lokal, null)).toEqual({ data: lokal, sumber: "lokal" });
  });

  it("hanya server -> server (draft ikut pindah perangkat)", () => {
    const server = { updatedAt: "2026-11-10T01:00:00.000Z" };
    expect(pilihTerbaru(null, server)).toEqual({ data: server, sumber: "server" });
  });

  it("server lebih baru -> server", () => {
    const lokal = { updatedAt: "2026-11-10T01:00:00.000Z" };
    const server = { updatedAt: "2026-11-10T02:00:00.000Z" };
    expect(pilihTerbaru(lokal, server)).toEqual({ data: server, sumber: "server" });
  });

  it("lokal lebih baru -> lokal (edit di layar tidak ditimpa)", () => {
    const lokal = { updatedAt: "2026-11-10T03:00:00.000Z" };
    const server = { updatedAt: "2026-11-10T02:00:00.000Z" };
    expect(pilihTerbaru(lokal, server)).toEqual({ data: lokal, sumber: "lokal" });
  });

  it("waktu sama -> lokal menang", () => {
    const waktu = "2026-11-10T01:00:00.000Z";
    expect(pilihTerbaru({ updatedAt: waktu }, { updatedAt: waktu })).toEqual({
      data: { updatedAt: waktu },
      sumber: "lokal",
    });
  });

  it("updatedAt rusak diperlakukan sebagai 0, draft valid menang", () => {
    const lokal = { updatedAt: "2026-11-10T01:00:00.000Z" };
    const server = { updatedAt: "bukan-iso" };
    expect(pilihTerbaru(lokal, server)).toEqual({ data: lokal, sumber: "lokal" });
  });
});
