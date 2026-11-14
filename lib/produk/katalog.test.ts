import { describe, expect, it } from "vitest";
import {
  duplikatProduk,
  hapusMassal,
  ubahArsipMassal,
  type ProdukRingkas,
} from "./store";

const produkA: ProdukRingkas = {
  id: "a",
  nama_internal: "Tas Kanvas",
  harga: "150000",
  url_referensi: "https://s.shopee.co.id/abc",
  gambar_url: "https://img.example/a.jpg",
  saved_at: "2026-11-01T00:00:00.000Z",
};
const produkB: ProdukRingkas = { id: "b", nama_internal: "Sandal" };
const daftar = [produkA, produkB];

describe("duplikatProduk", () => {
  it("membuat salinan dengan id baru, nama + (salinan), dan tanpa arsip", () => {
    const { list, salinan } = duplikatProduk(daftar, "a");
    expect(salinan).not.toBeNull();
    expect(salinan!.id).not.toBe("a");
    expect(salinan!.nama_internal).toBe("Tas Kanvas (salinan)");
    expect(salinan!.arsip).toBe(false);
    expect(salinan!.harga).toBe("150000");
    expect(salinan!.gambar_url).toBe("https://img.example/a.jpg");
    expect(list).toHaveLength(3);
    expect(list[0].id).toBe(salinan!.id);
  });

  it("mengembalikan salinan null bila id tidak ada", () => {
    const { list, salinan } = duplikatProduk(daftar, "tidak-ada");
    expect(salinan).toBeNull();
    expect(list).toHaveLength(2);
  });
});

describe("ubahArsipMassal", () => {
  it("menyembunyikan banyak produk sekaligus", () => {
    const hasil = ubahArsipMassal(daftar, ["a", "b"], true);
    expect(hasil.map((p) => p.arsip)).toEqual([true, true]);
  });

  it("menayangkan kembali hanya yang dipilih", () => {
    const terarsip = ubahArsipMassal(daftar, ["a", "b"], true);
    const hasil = ubahArsipMassal(terarsip, ["a"], false);
    expect(hasil[0].arsip).toBe(false);
    expect(hasil[1].arsip).toBe(true);
  });
});

describe("hapusMassal", () => {
  it("menghapus banyak produk sekaligus", () => {
    const hasil = hapusMassal(daftar, ["a", "b"]);
    expect(hasil).toHaveLength(0);
  });

  it("menyisakan yang tidak dipilih", () => {
    const hasil = hapusMassal(daftar, ["a"]);
    expect(hasil.map((p) => p.id)).toEqual(["b"]);
  });
});
