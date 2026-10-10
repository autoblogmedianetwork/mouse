import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { bacaXlsx, daftarEntriZip } from "./xlsx";

const berkas = (nama: string) => new Uint8Array(readFileSync(new URL(`../../tests/fixtures/${nama}`, import.meta.url)));

describe("daftarEntriZip", () => {
  it("menemukan entri penting di dalam .xlsx", () => {
    const entri = daftarEntriZip(berkas("tiktok-orders.xlsx")).map((e) => e.nama);
    expect(entri).toContain("xl/workbook.xml");
    expect(entri).toContain("xl/worksheets/sheet1.xml");
    expect(entri).toContain("xl/sharedStrings.xml");
  });

  it("menolak berkas yang bukan ZIP", () => {
    expect(() => daftarEntriZip(new TextEncoder().encode("bukan xlsx sama sekali"))).toThrow(/ZIP/);
  });
});

describe("bacaXlsx", () => {
  it("membaca sheet deflate, shared string, inline string, angka, tanggal, dan persen", async () => {
    const baris = await bacaXlsx(berkas("tiktok-orders.xlsx"));

    expect(baris[0]).toEqual([
      "Order ID",
      "Product Name",
      "SKU ID",
      "Quantity",
      "Order Amount",
      "Commission",
      "Order Status",
      "Order created time",
      "Commission Rate",
    ]);

    expect(baris[1][0]).toBe("5778abc001");
    expect(baris[1][1]).toBe("Kaos Polos Oversize & Nyaman");
    expect(baris[1][2]).toBe("SKU-OVR-BLK-L");
    expect(baris[1][3]).toBe("2");
    expect(baris[1][4]).toBe("189000");
    expect(baris[1][5]).toBe("12285");
    expect(baris[1][6]).toBe("Completed");
    expect(baris[1][7]).toBe("2026-09-20");
    expect(Number(baris[1][8])).toBeCloseTo(6.5, 5);
  });

  it("mengisi kolom yang dilewati dengan string kosong, bukan menggeser nilai", async () => {
    const baris = await bacaXlsx(berkas("tiktok-orders.xlsx"));
    // Baris 3 tidak punya sel C (SKU).
    expect(baris[2][2]).toBe("");
    expect(baris[2][3]).toBe("1");
    expect(baris[2][4]).toBe("325000");
    expect(baris[2][7]).toBe("2026-09-21");
    expect(baris).toHaveLength(4);
  });

  it("membaca ZIP tanpa kompresi (metode 0)", async () => {
    const baris = await bacaXlsx(berkas("shopee-stored.xlsx"));
    expect(baris[0][0]).toBe("Order ID");
    expect(baris[3][1]).toBe("Topi Baseball");
    expect(baris[3][7]).toBe("2026-09-22");
  });

  it("memberi pesan jelas saat bukan berkas xlsx", async () => {
    await expect(bacaXlsx(new TextEncoder().encode("halo"))).rejects.toThrow(/ZIP/);
  });
});
