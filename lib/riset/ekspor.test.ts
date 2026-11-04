import { describe, expect, it } from "vitest";
import { csvPeluang, csvRiset, keCsv } from "./ekspor";
import type { Peluang, Riset } from "./skema";

const riset: Riset = {
  id: "r1",
  niche: "Rumah tangga & perlengkapan dapur",
  audiens: "Ibu rumah tangga muda",
  ringkasan: "Polanya soal waktu.",
  masalah: [
    {
      masalah: 'Dapur sempit, "susah" gerak',
      situasi: "Saat masak rame-rame",
      produk_contoh: ["Rak bumbu gantung", "Wadah beras"],
      alasan: "Hemat ruang, baris\nkedua",
    },
  ],
  prompt_version: "riset-audience.v1",
  model: null,
  created_at: "2026-11-05T00:00:00Z",
};

const peluang: Peluang = {
  id: "p1",
  riset_id: "r1",
  urutan: 2,
  kategori: "Penyimpanan dapur",
  alasan: "Banyak sudut cerita.",
  masalah_terkait: "Dapur sempit",
  contoh_produk: ["Rak bumbu"],
  prioritas: "tinggi",
  kesulitan_konten: "rendah",
  dipilih: false,
  produk_id: null,
};

describe("keCsv", () => {
  it("memisahkan kolom dengan koma dan baris dengan CRLF", () => {
    expect(keCsv([["a", "b"], ["c", "d"]])).toBe("a,b\r\nc,d");
  });

  it("membungkus sel yang memuat koma, kutip, atau baris baru", () => {
    expect(keCsv([["Satu, dua", 'kata "kunci"', "baris\nbaru"]])).toBe(
      '"Satu, dua","kata ""kunci""","baris\nbaru"',
    );
  });

  it("menulis null dan undefined sebagai sel kosong", () => {
    expect(keCsv([[null, undefined, 0]])).toBe(",,0");
  });
});

describe("csvRiset", () => {
  it("menulis header tetap dan satu baris per masalah", () => {
    const hasil = csvRiset(riset);
    const baris = hasil.split("\r\n");
    expect(baris[0]).toBe("niche,audiens,masalah,situasi,produk_contoh,alasan");
    expect(baris).toHaveLength(2);
    expect(baris[1]).toContain("Rumah tangga & perlengkapan dapur");
    expect(baris[1]).toContain('"Dapur sempit, ""susah"" gerak"');
  });

  it("menggabungkan contoh produk dengan titik koma, bukan koma", () => {
    expect(csvRiset(riset)).toContain("Rak bumbu gantung; Wadah beras");
  });
});

describe("csvPeluang", () => {
  it("mengurutkan baris menurut urutan walau input tidak urut", () => {
    const lain: Peluang = { ...peluang, id: "p0", urutan: 1, kategori: "Pertama", dipilih: true };
    const baris = csvPeluang([peluang, lain]).split("\r\n");
    expect(baris[0]).toBe(
      "urutan,kategori,prioritas,kesulitan_konten,masalah_terkait,contoh_produk,alasan,dipilih",
    );
    expect(baris[1].startsWith("1,Pertama")).toBe(true);
    expect(baris[1].endsWith("ya")).toBe(true);
    expect(baris[2].startsWith("2,Penyimpanan dapur")).toBe(true);
    expect(baris[2].endsWith("belum")).toBe(true);
  });
});
