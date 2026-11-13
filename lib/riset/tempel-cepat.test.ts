import { describe, expect, it } from "vitest";
import {
  nilaiTempelan,
  skorPermintaan,
  skorPotensiKomisi,
  uraiAngka,
  uraiTempelan,
} from "./tempel-cepat";

describe("uraiAngka", () => {
  it("membaca satuan rb/jt dan ribuan bertitik", () => {
    expect(uraiAngka("89rb")).toBe(89_000);
    expect(uraiAngka("2,3rb")).toBe(2_300);
    expect(uraiAngka("1,2 jt")).toBe(1_200_000);
    expect(uraiAngka("89.000")).toBe(89_000);
    expect(uraiAngka("89000")).toBe(89_000);
    expect(uraiAngka("tidak ada angka")).toBeNull();
  });
});

describe("uraiTempelan", () => {
  it("membaca contoh tempelan Shopee lengkap", () => {
    const teks = `Baju Anak Lengan Panjang Katun Premium
Rp89.000
2,3rb terjual · ⭐4.8
https://s.shopee.co.id/abc123`;
    const p = uraiTempelan(teks);
    expect(p.nama).toContain("Baju Anak");
    expect(p.harga).toBe(89_000);
    expect(p.terjual).toBe(2_300);
    expect(p.rating).toBe(4.8);
    expect(p.link).toContain("shopee");
    expect(p.marketplace).toContain("Shopee");
  });

  it("membaca format ringkas satu baris", () => {
    const p = uraiTempelan("Tumbler Stainless 6 Jam Rp150.000 1,2jt terjual 4.9 tokopedia.com/x");
    expect(p.harga).toBe(150_000);
    expect(p.terjual).toBe(1_200_000);
    expect(p.rating).toBe(4.9);
  });

  it("teks kosong / tanpa data tidak melempar error", () => {
    const p = uraiTempelan("");
    expect(p.nama).toBe("");
    expect(p.harga).toBeNull();
    expect(p.terjual).toBeNull();
    expect(p.link).toBe("");
  });
});

describe("skor permintaan & potensi komisi", () => {
  it("terjual besar -> 5, rating tinggi menambah, rating rendah mengurangi", () => {
    expect(skorPermintaan(2_300, 4.8).nilai).toBe(5);
    expect(skorPermintaan(500, null).nilai).toBe(4);
    expect(skorPermintaan(50, null).nilai).toBe(2);
    expect(skorPermintaan(50, 3.5).nilai).toBe(1); // rating rendah menurunkan
    expect(skorPermintaan(null, null).nilai).toBe(0);
  });

  it("potensi komisi mengikuti harga x rate", () => {
    expect(skorPotensiKomisi(89_000, 10).nilai).toBe(3); // 8.900
    expect(skorPotensiKomisi(600_000, 10).nilai).toBe(5); // 60.000
    expect(skorPotensiKomisi(10_000, 10).nilai).toBe(1); // 1.000
    expect(skorPotensiKomisi(null, 10).nilai).toBe(0);
  });
});

describe("nilaiTempelan", () => {
  it("total 2 pilar, ambang layak 8/10, komisi & target dihitung", () => {
    const p = uraiTempelan("Baju Anak Katun Rp89.000 2,3rb terjual 4.8 https://s.shopee.co.id/a");
    const h = nilaiTempelan(p, { ratePersen: 10, targetBulan: 1_000_000 });
    expect(h.maks).toBe(10);
    expect(h.total).toBeGreaterThanOrEqual(8);
    expect(h.layak).toBe(true);
    expect(h.komisiPerPenjualan).toBe(8_900);
    // 1.000.000 / 8.900 = 113 penjualan
    expect(h.penjualanUntukTarget).toBe(113);
  });

  it("data kurang -> tidak layak + catatan jelas", () => {
    const h = nilaiTempelan(uraiTempelan("Produk tanpa data"));
    expect(h.layak).toBe(false);
    expect(h.catatan.length).toBeGreaterThan(0);
    expect(h.catatan.join(" ")).toContain("Harga");
  });
});

describe("rating desimal (Shopee 4,9)", () => {
  it("membaca 4,9 dengan koma", () => {
    expect(uraiTempelan("Produk Bagus Rp50.000 100 terjual 4,9").rating).toBe(4.9);
  });
  it("membaca 4.9 dengan titik", () => {
    expect(uraiTempelan("Produk Bagus Rp50.000 100 terjual 4.9").rating).toBe(4.9);
  });
  it("membaca rating bertanda bintang bulat", () => {
    expect(uraiTempelan("Produk Rp50.000 ⭐5").rating).toBe(5);
  });
  it("rating desimal memengaruhi skor permintaan", () => {
    expect(skorPermintaan(500, 4.9).nilai).toBe(5);
    expect(skorPermintaan(500, 3.9).nilai).toBe(3);
  });
});
