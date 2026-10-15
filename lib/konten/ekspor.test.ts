import { describe, expect, it } from "vitest";
import { eksporJSON, eksporTXT, gabungKonten, imporJSON } from "./ekspor";
import { filterKonten, kontenSkema, type Konten } from "./skema";

function buatKonten(overrides: Partial<Konten> = {}): Konten {
  return kontenSkema.parse({
    id: overrides.id ?? "k1",
    judul: overrides.judul ?? "Kaos polos hitam",
    statuses: overrides.statuses ?? ["Status pertama", "Status kedua"],
    status: overrides.status ?? "draft",
    letak_link: overrides.letak_link ?? "balasan",
    created_at: "2026-10-09T10:00:00.000Z",
    updated_at: overrides.updated_at ?? "2026-10-09T10:00:00.000Z",
    ...overrides,
  });
}

describe("eksporJSON → imporJSON", () => {
  it("round-trip menghasilkan data yang sama (exit criteria Fase 4)", () => {
    const list = [
      buatKonten(),
      buatKonten({ id: "k2", judul: "Kaos putih", status: "siap_posting", statuses: ["Halo"] }),
      buatKonten({ id: "k3", judul: "Kemeja", arsip: true, arsip_at: "2026-10-01T00:00:00.000Z" }),
    ];
    const hasil = imporJSON(eksporJSON(list));
    expect(hasil).toEqual([...list].sort((a, b) => a.id.localeCompare(b.id)));
  });

  it("membuang field berlebih tanpa gagal (default Zod diterapkan)", () => {
    const k = buatKonten();
    const raw = JSON.stringify({
      app: "autothreads",
      versi: 1,
      diekspor_pada: "2026-10-09T00:00:00.000Z",
      konten: [{ ...k, kolom_lama: "x" }],
    });
    const hasil = imporJSON(raw);
    expect(hasil).toHaveLength(1);
    expect(hasil[0]).toEqual(k);
  });

  it("menolak file bukan cadangan Heaviliate", () => {
    expect(() => imporJSON('{"foo": 1}')).toThrow(/cadangan Heaviliate/);
    expect(() => imporJSON("bukan json")).toThrow(/JSON valid/);
  });

  it("menolak entri yang melanggar batas 500 karakter", () => {
    const k = buatKonten();
    const raw = JSON.stringify({
      app: "autothreads",
      versi: 1,
      konten: [{ ...k, statuses: ["x".repeat(501)] }],
    });
    expect(() => imporJSON(raw)).toThrow(/500 karakter/);
  });
});

describe("gabungKonten", () => {
  it("updated_at lebih baru menang", () => {
    const lama = buatKonten({ updated_at: "2026-10-01T00:00:00.000Z", judul: "Lama" });
    const baru = buatKonten({ updated_at: "2026-10-09T00:00:00.000Z", judul: "Baru" });
    const hasil = gabungKonten([lama], [baru]);
    expect(hasil).toHaveLength(1);
    expect(hasil[0].judul).toBe("Baru");
  });
});

describe("eksporTXT", () => {
  it("menampilkan judul dan status berurutan", () => {
    const txt = eksporTXT([buatKonten()]);
    expect(txt).toContain("=== Kaos polos hitam ===");
    expect(txt.indexOf("[1]")).toBeLessThan(txt.indexOf("[2]"));
  });
});

describe("filterKonten", () => {
  const now = Date.parse("2026-10-09T12:00:00.000Z");
  const list = [
    buatKonten({ id: "a", judul: "Kaos flanel", updated_at: "2026-10-09T00:00:00.000Z" }),
    buatKonten({
      id: "b",
      judul: "Celana jeans",
      status: "siap_posting",
      updated_at: "2026-10-05T00:00:00.000Z",
    }),
    buatKonten({
      id: "c",
      judul: "Topi",
      status: "terkirim",
      updated_at: "2026-08-01T00:00:00.000Z",
    }),
  ];

  it("cari teks di judul", () => {
    const hasil = filterKonten(list, { q: "jeans", status: "semua", rentang: "semua" }, now);
    expect(hasil.map((k) => k.id)).toEqual(["b"]);
  });

  it("cari teks di isi status", () => {
    const hasil = filterKonten(list, { q: "Status kedua", status: "semua", rentang: "semua" }, now);
    expect(hasil).toHaveLength(3);
  });

  it("filter status", () => {
    const hasil = filterKonten(list, { q: "", status: "siap_posting", rentang: "semua" }, now);
    expect(hasil.map((k) => k.id)).toEqual(["b"]);
  });

  it("filter rentang tanggal", () => {
    const hasil = filterKonten(list, { q: "", status: "semua", rentang: "7d" }, now);
    expect(hasil.map((k) => k.id)).toEqual(["a", "b"]);
  });

  it("urut terbaru dulu", () => {
    const hasil = filterKonten(list, { q: "", status: "semua", rentang: "semua" }, now);
    expect(hasil.map((k) => k.id)).toEqual(["a", "b", "c"]);
  });
});
