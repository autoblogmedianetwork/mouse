import { describe, expect, it } from "vitest";
import {
  MIN_PRODUK_BATCH,
  MAKS_PRODUK_BATCH,
  buatBatch,
  buatDraftDariProduk,
  mulaiReview,
  ringkasanBatch,
  tandaiDireview,
  validasiBatch,
} from "./batch-produk";

describe("validasiBatch", () => {
  const tersedia = new Set(["p1", "p2", "p3", "p4"]);

  it("menolak kurang dari minimum", () => {
    expect(validasiBatch(["p1", "p2"], tersedia)).toBe(
      `Pilih minimal ${MIN_PRODUK_BATCH} produk.`,
    );
  });

  it("menolak lebih dari maksimum", () => {
    expect(validasiBatch(["p1", "p2", "p3", "p4", "p5", "p6"], tersedia)).toBe(
      `Maksimal ${MAKS_PRODUK_BATCH} produk per batch.`,
    );
  });

  it("menolak duplikat dan produk yang tidak ada", () => {
    expect(validasiBatch(["p1", "p1", "p2", "p3"], tersedia)).toBe(
      "Produk yang dipilih tidak boleh duplikat.",
    );
    expect(validasiBatch(["p1", "p2", "p3", "px"], tersedia)).toBe(
      "Ada produk yang tidak ditemukan di pustaka produk.",
    );
  });

  it("menerima pilihan yang valid", () => {
    expect(validasiBatch(["p1", "p2", "p3"], tersedia)).toBeNull();
  });
});

describe("buatDraftDariProduk", () => {
  it("membuat draft dengan status draft dan placeholder yang valid", () => {
    const d = buatDraftDariProduk(
      { id: "p1", nama_internal: "Tas Kanvas", varian: "Hitam" },
      "batch-1",
      "2026-11-10T00:00:00.000Z",
    );
    expect(d.status).toBe("draft");
    expect(d.produk_nama).toBe("Tas Kanvas");
    expect(d.judul).toBe("Tas Kanvas — Hitam");
    expect(d.statuses[0].length).toBeLessThanOrEqual(500);
    expect(d.otomatis).toBe(false);
  });
});

describe("alur review batch", () => {
  it("mulaiReview mengubah antri menjadi proses", () => {
    const { batch } = buatBatch(["p1", "p2", "p3"], new Map());
    expect(batch.status).toBe("antri");
    const proses = mulaiReview(batch);
    expect(proses.status).toBe("proses");
    expect(proses.indeks_review).toBe(0);
  });

  it("tandaiDireview maju hingga selesai", () => {
    const { batch } = buatBatch(["p1", "p2", "p3"], new Map());
    let b = mulaiReview(batch);
    b = tandaiDireview(b);
    expect(b.status).toBe("proses");
    expect(b.indeks_review).toBe(1);
    b = tandaiDireview(b);
    b = tandaiDireview(b);
    expect(b.status).toBe("selesai");
    expect(b.indeks_review).toBe(3);
    expect(b.selesai_pada).not.toBeNull();
  });

  it("tandaiDireview tidak mengubah batch yang bukan proses", () => {
    const { batch } = buatBatch(["p1", "p2", "p3"], new Map());
    const sama = tandaiDireview(batch);
    expect(sama).toBe(batch);
  });

  it("ringkasanBatch menghitung status", () => {
    const { batch: a } = buatBatch(["p1", "p2", "p3"], new Map());
    const { batch: b } = buatBatch(["p4", "p5", "p6"], new Map());
    const selesai = { ...b, status: "selesai" as const };
    const r = ringkasanBatch([a, selesai]);
    expect(r.total).toBe(2);
    expect(r.antri).toBe(1);
    expect(r.selesai).toBe(1);
  });
});
