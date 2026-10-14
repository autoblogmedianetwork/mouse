import { describe, expect, it } from "vitest";
import { isAvailable, pilihSuaraIndonesia, teksUntukDibaca } from "./suara-browser";

describe("teksUntukDibaca", () => {
  it("menggabungkan status terisi satu per baris dan menjaga urutan", () => {
    expect(teksUntukDibaca(["satu", "dua", "tiga"])).toBe("satu\ndua\ntiga");
  });

  it("melewati status kosong dan memangkas spasi", () => {
    expect(teksUntukDibaca([" satu ", "", "   ", "dua"])).toBe("satu\ndua");
  });

  it("mengembalikan string kosong tanpa status", () => {
    expect(teksUntukDibaca([])).toBe("");
    expect(teksUntukDibaca([" ", ""])).toBe("");
  });
});

describe("pilihSuaraIndonesia", () => {
  it("memilih suara berbahasa Indonesia", () => {
    const daftar = [
      { nama: "English US", lang: "en-US" },
      { nama: "Indonesian", lang: "id-ID" },
    ];
    expect(pilihSuaraIndonesia(daftar)?.lang).toBe("id-ID");
  });

  it("menerima kode bahasa id tanpa wilayah", () => {
    expect(pilihSuaraIndonesia([{ nama: "ID", lang: "id" }])?.nama).toBe("ID");
  });

  it("jatuh ke suara pertama kalau tidak ada bahasa Indonesia", () => {
    const daftar = [
      { nama: "English", lang: "en-US" },
      { nama: "Japanese", lang: "ja-JP" },
    ];
    expect(pilihSuaraIndonesia(daftar)?.nama).toBe("English");
  });

  it("mengembalikan null untuk daftar kosong", () => {
    expect(pilihSuaraIndonesia([])).toBeNull();
  });
});

describe("isAvailable", () => {
  it("false di lingkungan tanpa speechSynthesis (mis. Node)", () => {
    expect(isAvailable()).toBe(false);
  });
});
