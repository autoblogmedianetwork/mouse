import { describe, expect, it } from "vitest";
import { toggleFavorit, urutkanFavorit } from "./favorit";

describe("toggleFavorit", () => {
  it("menambah id baru ke depan", () => {
    expect(toggleFavorit(["a"], "b")).toEqual(["b", "a"]);
  });

  it("menghapus id yang sudah favorit", () => {
    expect(toggleFavorit(["a", "b"], "a")).toEqual(["b"]);
  });
});

describe("urutkanFavorit", () => {
  it("menaruh favorit di atas dan mempertahankan urutan asli", () => {
    const produk = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(urutkanFavorit(produk, ["c", "a"]).map((p) => p.id)).toEqual(["a", "c", "b"]);
  });

  it("tidak mengubah daftar saat tidak ada favorit", () => {
    const produk = [{ id: "a" }, { id: "b" }];
    expect(urutkanFavorit(produk, [])).toEqual(produk);
  });
});
