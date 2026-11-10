import { describe, expect, it } from "vitest";
import {
  KEY_DRAFT,
  KEY_KONTEN,
  adalahDraftDummy,
  adalahKontenDummy,
  bersihkanDataContoh,
  hitungDataContoh,
} from "./pembersih-dummy";

function penyimpananAwal(isi: Record<string, string>) {
  const data = new Map(Object.entries(isi));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    isi: data,
  };
}

const kontenAsli = {
  id: "k1",
  judul: "Review tumbler pagi",
  produk_nama: "Tumbler Stainless",
};
const kontenContoh = {
  id: "contoh-tumbler-stainless",
  judul: "Contoh: Tumbler Stainless 500ml",
  produk_nama: "Contoh: Tumbler",
};

describe("deteksi data contoh", () => {
  it("mengenali penanda SAMPEL DUMMY dan awalan Contoh:", () => {
    expect(adalahKontenDummy(kontenContoh)).toBe(true);
    expect(adalahKontenDummy({ id: "x", judul: "Produk SAMPEL DUMMY" })).toBe(true);
    expect(adalahKontenDummy(kontenAsli)).toBe(false);
  });

  it("mengenali draft produk contoh, bukan draft sungguhan", () => {
    expect(
      adalahDraftDummy({ produk: { id: "contoh-tumbler-stainless", nama_internal: "Contoh: X" } }),
    ).toBe(true);
    expect(adalahDraftDummy({ produk: { id: "p1", nama_internal: "Tumbler" } })).toBe(false);
    expect(adalahDraftDummy({})).toBe(false);
  });
});

describe("hitungDataContoh", () => {
  it("menghitung konten contoh dan draft contoh tanpa mengubah isi", () => {
    const storage = penyimpananAwal({
      [KEY_KONTEN]: JSON.stringify([kontenAsli, kontenContoh]),
      [KEY_DRAFT]: JSON.stringify({ produk: { id: "contoh-x", nama_internal: "Contoh: X" } }),
    });

    expect(hitungDataContoh(storage)).toEqual({ konten: 1, draft: true, total: 2 });
    expect(storage.getItem(KEY_KONTEN)).toContain("Review tumbler pagi");
  });
});

describe("bersihkanDataContoh", () => {
  it("menghapus hanya entri contoh dan mempertahankan konten asli", () => {
    const storage = penyimpananAwal({
      [KEY_KONTEN]: JSON.stringify([kontenAsli, kontenContoh]),
      [KEY_DRAFT]: JSON.stringify({ produk: { id: "contoh-x", nama_internal: "Contoh: X" } }),
    });

    const hasil = bersihkanDataContoh(storage);

    expect(hasil).toEqual({ kontenDihapus: 1, draftDihapus: true });
    expect(JSON.parse(storage.getItem(KEY_KONTEN) ?? "[]")).toEqual([kontenAsli]);
    expect(storage.getItem(KEY_DRAFT)).toBeNull();
  });

  it("tidak menghapus draft sungguhan", () => {
    const storage = penyimpananAwal({
      [KEY_DRAFT]: JSON.stringify({ produk: { id: "p1", nama_internal: "Serum pagi" } }),
    });

    expect(bersihkanDataContoh(storage)).toEqual({ kontenDihapus: 0, draftDihapus: false });
    expect(storage.getItem(KEY_DRAFT)).not.toBeNull();
  });

  it("aman terhadap penyimpanan rusak", () => {
    const storage = penyimpananAwal({ [KEY_KONTEN]: "{bukan json" });
    expect(bersihkanDataContoh(storage)).toEqual({ kontenDihapus: 0, draftDihapus: false });
  });
});
