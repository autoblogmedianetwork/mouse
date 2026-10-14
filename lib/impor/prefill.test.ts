import { describe, expect, it } from "vitest";
import {
  MAKS_DESKRIPSI_PREFILL,
  bersihkanPrefill,
  bookmarkletQuickCapture,
  decodePrefill,
  encodePrefill,
  hanyaAngka,
  nilaiFormDariPrefill,
  prefillSkema,
  urlTanpaPelacak,
} from "./prefill";

const contoh = {
  nama: "Tas Kanvas Tahan Air",
  harga: "Rp 129.900",
  deskripsi: "Tas kanvas dengan dua kantong.",
  url: "https://shopee.co.id/produk-i.123.456?utm_source=x#ulasan",
  sumber: "shopee.co.id",
};

describe("hanyaAngka", () => {
  it("membuang titik, koma, dan teks rupiah", () => {
    expect(hanyaAngka("Rp 129.900")).toBe("129900");
  });

  it("membatasi 13 digit", () => {
    expect(hanyaAngka("12345678901234567890")).toBe("1234567890123");
  });

  it("mengembalikan string kosong tanpa angka", () => {
    expect(hanyaAngka("hubungi penjual")).toBe("");
  });
});

describe("urlTanpaPelacak", () => {
  it("membuang query dan hash", () => {
    expect(urlTanpaPelacak("https://shopee.co.id/produk-i.1.2?utm=abc#x")).toBe(
      "https://shopee.co.id/produk-i.1.2",
    );
  });

  it("mengosongkan URL tanpa https", () => {
    expect(urlTanpaPelacak("http://shopee.co.id/produk")).toBe("");
    expect(urlTanpaPelacak("bukan url")).toBe("");
  });
});

describe("bersihkanPrefill", () => {
  it("merapikan nilai dan memotong deskripsi ke batas", () => {
    const panjang = "a".repeat(MAKS_DESKRIPSI_PREFILL + 500);
    const hasil = bersihkanPrefill({ ...contoh, deskripsi: panjang });
    expect(hasil.deskripsi?.length).toBe(MAKS_DESKRIPSI_PREFILL);
    expect(hasil.harga).toBe("129900");
    expect(hasil.url).toBe("https://shopee.co.id/produk-i.123.456");
  });

  it("membuang nilai kosong menjadi undefined", () => {
    const hasil = bersihkanPrefill({ nama: "   ", harga: "tanpa angka", url: "" });
    expect(hasil.nama).toBeUndefined();
    expect(hasil.harga).toBeUndefined();
    expect(hasil.url).toBeUndefined();
  });
});

describe("encode dan decode prefill", () => {
  it("bolak-balik tetap sama untuk teks Indonesia dan emoji", () => {
    const data = {
      nama: "Tas kanvas “anti air” 😀",
      deskripsi: "Cocok untuk jalan pagi, tali empuk.",
      harga: "129900",
    };
    expect(decodePrefill(encodePrefill(data))).toEqual(bersihkanPrefill(data));
  });

  it("menghasilkan kode yang aman di URL (base64url)", () => {
    const kode = encodePrefill(contoh);
    expect(kode).not.toMatch(/[+/=]/);
    expect(encodeURIComponent(kode)).toBe(kode);
  });

  it("menerima base64 biasa dari bookmarklet lama", () => {
    const polos = Buffer.from(JSON.stringify(contoh), "utf8").toString("base64");
    expect(decodePrefill(polos)?.nama).toBe(contoh.nama);
  });

  it("mengembalikan null untuk kode rusak atau kosong", () => {
    expect(decodePrefill("bukan-base64!!")).toBeNull();
    expect(decodePrefill("")).toBeNull();
    expect(decodePrefill(null)).toBeNull();
  });

  it("menolak kunci asing supaya token atau cookie tidak ikut terbawa", () => {
    const adaToken = Buffer.from(
      JSON.stringify({ nama: "Produk", token: "rahasia", cookie: "session=1" }),
      "utf8",
    ).toString("base64");
    expect(decodePrefill(adaToken)).toBeNull();
  });
});

describe("prefillSkema", () => {
  it("menerima hanya kunci yang dikenal", () => {
    expect(prefillSkema.safeParse({ nama: "Produk" }).success).toBe(true);
    expect(prefillSkema.safeParse({ nama: "Produk", secret: "x" }).success).toBe(false);
  });
});

describe("nilaiFormDariPrefill", () => {
  it("memetakan prefill ke nilai awal form produk", () => {
    const nilai = nilaiFormDariPrefill(bersihkanPrefill(contoh));
    expect(nilai).toEqual({
      nama_internal: "Tas Kanvas Tahan Air",
      nama: "Tas Kanvas Tahan Air",
      varian: "",
      harga: "129900",
      deskripsi: "Tas kanvas dengan dua kantong.",
      url_referensi: "https://shopee.co.id/produk-i.123.456",
    });
  });

  it("memotong nama internal ke 120 karakter", () => {
    const nilai = nilaiFormDariPrefill(bersihkanPrefill({ nama: "x".repeat(200) }));
    expect(nilai.nama_internal?.length).toBe(120);
  });
});

describe("bookmarkletQuickCapture", () => {
  const kode = bookmarkletQuickCapture("https://autothreads.test/");

  it("menunjuk halaman /posting/baru milik aplikasi", () => {
    expect(kode.startsWith("javascript:")).toBe(true);
    expect(kode).toContain("https://autothreads.test/posting/baru?prefill=");
  });

  it("tidak menyentuh cookie, localStorage, atau form login", () => {
    expect(kode).not.toContain("document.cookie");
    expect(kode).not.toContain("localStorage");
    expect(kode).not.toContain("sessionStorage");
    expect(kode).not.toContain("Authorization");
  });

  it("membuang query dan hash dari URL halaman", () => {
    expect(kode).toContain("location.origin+location.pathname");
    expect(kode).not.toContain("location.search");
    expect(kode).not.toContain("location.hash");
  });
});
