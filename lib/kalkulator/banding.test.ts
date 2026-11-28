import { describe, expect, it } from "vitest";
import { bandingkanProduk } from "./banding";

describe("bandingkanProduk", () => {
  it("produk komisi besar menang dengan konten lebih sedikit", () => {
    const hasil = bandingkanProduk(
      { nama: "Blender", harga: 200000, ratePersen: 10 }, // komisi 20rb
      { nama: "Sofa", harga: 2000000, ratePersen: 10 }, // komisi 200rb
      1000000,
      1 / 20,
    );
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.pemenang).toBe("b");
    expect(hasil.b.kontenPerBulan).toBeLessThan(hasil.a.kontenPerBulan);
    expect(hasil.alasan).toContain("lebih hemat waktu");
  });

  it("seri bila konten sama", () => {
    const hasil = bandingkanProduk(
      { nama: "A", harga: 100000, ratePersen: 10 },
      { nama: "B", harga: 100000, ratePersen: 10 },
      500000,
      1 / 20,
    );
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.pemenang).toBe("seri");
  });

  it("menolak input tidak valid", () => {
    expect(
      bandingkanProduk({ nama: "A", harga: 0, ratePersen: 10 }, { nama: "B", harga: 1, ratePersen: 1 }, 100000, 0.05).ok,
    ).toBe(false);
    expect(
      bandingkanProduk({ nama: "A", harga: 1, ratePersen: 1 }, { nama: "B", harga: 1, ratePersen: 1 }, 0, 0.05).ok,
    ).toBe(false);
    expect(
      bandingkanProduk({ nama: "A", harga: 1, ratePersen: 1 }, { nama: "B", harga: 1, ratePersen: 1 }, 100000, 0).ok,
    ).toBe(false);
  });
});
