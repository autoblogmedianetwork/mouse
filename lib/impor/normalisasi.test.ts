import { describe, expect, it } from "vitest";
import {
  bersihkanTeks,
  formatRupiah,
  kanonikStatus,
  parseAngka,
  parsePersen,
  parseTanggal,
} from "./normalisasi";

describe("parseAngka", () => {
  it("membaca format Indonesia dan Inggris", () => {
    expect(parseAngka("Rp1.234.567")).toBe(1234567);
    expect(parseAngka("1,234.56")).toBe(1234.56);
    expect(parseAngka("1.234,56")).toBe(1234.56);
    expect(parseAngka("Rp 189.000,00")).toBe(189000);
  });

  it("membedakan desimal dari pemisah ribuan", () => {
    expect(parseAngka("6,5")).toBe(6.5);
    expect(parseAngka("1.234")).toBe(1234);
    expect(parseAngka("12,345")).toBe(12345);
    expect(parseAngka("0.5")).toBe(0.5);
  });

  it("membaca nilai negatif untuk retur", () => {
    expect(parseAngka("-Rp21.125")).toBe(-21125);
    expect(parseAngka("(12.000)")).toBe(-12000);
    expect(parseAngka("1.500-")).toBe(-1500);
  });

  it("mengembalikan null bila tidak ada angka", () => {
    expect(parseAngka("")).toBeNull();
    expect(parseAngka("-")).toBeNull();
    expect(parseAngka("tidak ada")).toBeNull();
    expect(parseAngka(null)).toBeNull();
  });

  it("meneruskan angka numerik apa adanya", () => {
    expect(parseAngka(189000)).toBe(189000);
    expect(parseAngka(Number.NaN)).toBeNull();
  });
});

describe("parsePersen", () => {
  it("membaca persen dengan dan tanpa tanda", () => {
    expect(parsePersen("6,5%")).toBe(6.5);
    expect(parsePersen("12%")).toBe(12);
    expect(parsePersen("6.5")).toBe(6.5);
  });

  it("mengubah pecahan 0-1 menjadi persen", () => {
    expect(parsePersen(0.065)).toBe(6.5);
  });

  it("mengembalikan null untuk sel kosong", () => {
    expect(parsePersen("")).toBeNull();
  });
});

describe("parseTanggal", () => {
  it("membaca ISO dengan waktu", () => {
    expect(parseTanggal("2026-09-20")).toBe("2026-09-20");
    expect(parseTanggal("2026-09-20 14:03:00")).toBe("2026-09-20");
  });

  it("membaca dd/mm/yyyy khas laporan Indonesia", () => {
    expect(parseTanggal("05/09/2026")).toBe("2026-09-05");
    expect(parseTanggal("17-09-2026")).toBe("2026-09-17");
    expect(parseTanggal("1.10.2026")).toBe("2026-10-01");
  });

  it("membalik urutan saat angka pertama jelas bulan", () => {
    expect(parseTanggal("09/25/2026")).toBe("2026-09-25");
  });

  it("membaca nama bulan Indonesia dan Inggris", () => {
    expect(parseTanggal("1 Okt 2026")).toBe("2026-10-01");
    expect(parseTanggal("13 October 2026")).toBe("2026-10-13");
  });

  it("menerima angka serial Excel", () => {
    expect(parseTanggal(46281)).toBe("2026-09-16");
  });

  it("menolak tanggal yang tidak masuk akal", () => {
    expect(parseTanggal("31/02/2026")).toBeNull();
    expect(parseTanggal("")).toBeNull();
    expect(parseTanggal("bukan tanggal")).toBeNull();
  });
});

describe("kanonikStatus", () => {
  it("mengelompokkan status Indonesia dan Inggris", () => {
    expect(kanonikStatus("Selesai")).toBe("selesai");
    expect(kanonikStatus("Settled")).toBe("selesai");
    expect(kanonikStatus("Menunggu Pembayaran")).toBe("menunggu");
    expect(kanonikStatus("Pending")).toBe("menunggu");
    expect(kanonikStatus("Dibatalkan")).toBe("batal");
    expect(kanonikStatus("Refunded")).toBe("batal");
    expect(kanonikStatus("")).toBe("lainnya");
    expect(kanonikStatus("entah")).toBe("lainnya");
  });
});

describe("bersihkanTeks dan formatRupiah", () => {
  it("merapikan spasi dan karakter tak terlihat", () => {
    expect(bersihkanTeks("  Tas   Kanvas \u200B")).toBe("Tas Kanvas");
    expect(bersihkanTeks(null)).toBe("");
  });

  it("memformat rupiah tanpa desimal", () => {
    expect(formatRupiah(1234567)).toBe("Rp1.234.567");
    expect(formatRupiah(-21125)).toBe("-Rp21.125");
  });
});
