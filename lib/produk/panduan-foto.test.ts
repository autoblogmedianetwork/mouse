import { describe, expect, it } from "vitest";
import {
  fiturLayakTampil,
  namaUntukPanduan,
  panduanFotoCandid,
  type ProdukUntukPanduan,
} from "./panduan-foto";

const produk: ProdukUntukPanduan = {
  nama_internal: "Tas kanvas uji",
  nama: "Tas Kanvas Tahan Air 2 Kantong",
  varian: "Hitam",
  fitur: ["Tali bahu empuk", "Lapisan dalam anti basah"],
  target_audiens: ["mahasiswa", "pekerja komuter"],
};

describe("namaUntukPanduan", () => {
  it("memakai nama listing lebih dulu", () => {
    expect(namaUntukPanduan(produk)).toBe("Tas Kanvas Tahan Air 2 Kantong");
  });

  it("jatuh ke nama internal lalu teks netral", () => {
    expect(namaUntukPanduan({ nama_internal: "Tas uji" })).toBe("Tas uji");
    expect(namaUntukPanduan({})).toBe("produk ini");
  });
});

describe("fiturLayakTampil", () => {
  it("membuang fitur berisi link atau harga", () => {
    const hasil = fiturLayakTampil([
      "Tali empuk",
      "Lihat https://contoh.test/produk",
      "Harga Rp 120000",
      "Dua kantong",
    ]);
    expect(hasil).toEqual(["Tali empuk", "Dua kantong"]);
  });

  it("membatasi tiga fitur dan memangkas spasi", () => {
    const hasil = fiturLayakTampil([" a ", "b", "c", "d"]);
    expect(hasil).toEqual(["a", "b", "c"]);
  });

  it("aman untuk nilai kosong", () => {
    expect(fiturLayakTampil(null)).toEqual([]);
    expect(fiturLayakTampil(undefined)).toEqual([]);
    expect(fiturLayakTampil(["", "   "])).toEqual([]);
  });
});

describe("panduanFotoCandid", () => {
  it("menyusun langkah dari data produk", () => {
    const panduan = panduanFotoCandid(produk);
    const gabung = [panduan.ringkas, ...panduan.langkah].join(" ");
    expect(gabung).toContain("Tas Kanvas Tahan Air 2 Kantong");
    expect(gabung).toContain("mahasiswa");
    expect(gabung).toContain("Tali bahu empuk");
    expect(gabung).toContain("Hitam");
    expect(panduan.langkah.length).toBeGreaterThanOrEqual(4);
  });

  it("tidak memuat link atau harga", () => {
    const gabung = [panduanFotoCandid(produk).ringkas, ...panduanFotoCandid(produk).langkah].join(" ");
    expect(gabung).not.toMatch(/https?:\/\//i);
    expect(gabung).not.toMatch(/\brp\s?\d/i);
  });

  it("tetap memberi panduan tanpa data fitur dan varian", () => {
    const panduan = panduanFotoCandid({ nama_internal: "Produk polos" });
    expect(panduan.langkah.length).toBeGreaterThanOrEqual(4);
    expect(panduan.langkah.join(" ")).toContain("Produk polos");
    expect(panduan.ringkas).toContain("Produk polos");
  });
});
