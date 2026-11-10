import { describe, expect, it } from "vitest";
import { cariGlobal, type SumberCari } from "./cari-global";

const konten = {
  id: "k1",
  judul: "Review Tumbler Pagi",
  produk_nama: "Tumbler Stainless",
  statuses: ["Air panas tetap panas.", "Cek link di bio."],
} as unknown as SumberCari["konten"][number];

const sumber: SumberCari = {
  konten: [konten],
  produk: [
    { id: "p1", nama_internal: "Tumbler Hitam", nama: "Tumbler 500ml", tag: ["dapur"] },
    { id: "p2", nama_internal: "Serum Pagi", nama: "Serum C", tag: ["skincare"] },
  ],
  bank: [
    {
      teks: "tumbler mudah bocor di tas",
      kategori: "dapur",
      sumber: "riset",
      ditambahkan: "2026-11-01",
    },
  ],
};

describe("cariGlobal", () => {
  it("mencari di konten, produk, dan bank masalah sekaligus", () => {
    const hasil = cariGlobal("tumbler", sumber);
    expect(hasil.map((h) => h.jenis)).toEqual(["konten", "produk", "masalah"]);
    expect(hasil[0]?.judul).toBe("Review Tumbler Pagi");
    expect(hasil[0]?.href).toContain("/antrian?q=");
  });

  it("mencocokkan tag produk", () => {
    const hasil = cariGlobal("skincare", sumber);
    expect(hasil).toHaveLength(1);
    expect(hasil[0]?.jenis).toBe("produk");
    expect(hasil[0]?.keterangan).toContain("#skincare");
  });

  it("mengembalikan kosong untuk kata kunci kosong", () => {
    expect(cariGlobal("   ", sumber)).toEqual([]);
  });

  it("membatasi jumlah hasil per jenis", () => {
    const banyak: SumberCari = {
      konten: Array.from({ length: 9 }, (_, i) => ({
        ...(konten as object),
        id: `k${i}`,
        judul: `Tumbler ${i}`,
      })) as SumberCari["konten"],
      produk: [],
      bank: [],
    };
    expect(cariGlobal("tumbler", banyak, 3)).toHaveLength(3);
  });
});
