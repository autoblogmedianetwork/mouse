import { describe, expect, it } from "vitest";
import { cariBarisHeader, deteksiPemisah, parseCsv, parseTabel } from "./csv";

describe("deteksiPemisah", () => {
  it("mengenali koma, titik koma, dan tab", () => {
    expect(deteksiPemisah("a,b,c\n1,2,3")).toBe(",");
    expect(deteksiPemisah("a;b;c\n1;2;3")).toBe(";");
    expect(deteksiPemisah("a\tb\tc\n1\t2\t3")).toBe("\t");
  });

  it("tidak tertipu koma di dalam deskripsi produk", () => {
    const teks = [
      "Nama Produk;ID Pesanan;Komisi",
      '"Tas Kanvas, Motif Bunga";A123;12000',
      '"Sepatu, Kulit Asli";A124;21000',
    ].join("\n");
    expect(deteksiPemisah(teks)).toBe(";");
  });
});

describe("parseCsv", () => {
  it("menghormati tanda kutip dan kutip ganda yang di-escape", () => {
    const hasil = parseCsv('a,"b, c","d""e"\n1,2,3');
    expect(hasil[0]).toEqual(["a", "b, c", 'd"e']);
    expect(hasil[1]).toEqual(["1", "2", "3"]);
  });

  it("membuang BOM dan menangani akhir baris CRLF", () => {
    const hasil = parseCsv("\uFEFFNama,Komisi\r\nTas,1000\r\n");
    expect(hasil[0][0]).toBe("Nama");
    expect(hasil[1]).toEqual(["Tas", "1000"]);
  });

  it("mengabaikan baris kosong", () => {
    const hasil = parseCsv("a,b\n\n1,2\n\n");
    expect(hasil).toHaveLength(2);
  });
});

describe("cariBarisHeader", () => {
  it("memilih baris dengan kolom terbanyak, bukan baris judul", () => {
    expect(cariBarisHeader([["Laporan Komisi"], ["A", "B", "C"], ["1", "2", "3"]])).toBe(1);
  });

  it("jatuh ke baris 0 saat semua baris setara", () => {
    expect(cariBarisHeader([["A", "B"]])).toBe(0);
  });
});

describe("parseTabel", () => {
  it("menyelaraskan jumlah kolom data dengan header", () => {
    const tabel = parseTabel("A,B,C\n1,2\n3,4");
    expect(tabel.header).toEqual(["A", "B", "C"]);
    expect(tabel.baris[0]).toEqual(["1", "2", ""]);
    expect(tabel.baris[1]).toEqual(["3", "4", ""]);
  });

  it("melaporkan berapa baris dilewati sebelum header", () => {
    const tabel = parseTabel("Judul Laporan\n\nA,B\n1,2");
    // Baris kosong tidak dihitung karena parser membuangnya.
    expect(tabel.baris_dilewati).toBe(1);
    expect(tabel.header).toEqual(["A", "B"]);
  });

  it("memakai baris terlebar sebagai header, dan yang paling awal saat seri", () => {
    const laporan = parseTabel("Laporan Komisi\nNama Produk,ID Pesanan,Komisi,Tanggal\nTas,A1,1000,2026-09-15");
    expect(laporan.header).toEqual(["Nama Produk", "ID Pesanan", "Komisi", "Tanggal"]);
    expect(laporan.baris_dilewati).toBe(1);
  });
});
