import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { bacaBerkas, bacaTeks } from "./parse";

const berkasUji = (nama: string, tipe = "text/csv") =>
  new File([readFileSync(new URL(`../../tests/fixtures/${nama}`, import.meta.url))], nama, { type: tipe });

describe("laporan Shopee Affiliate", () => {
  it("membaca kolom Indonesia, kutip di dalam sel, dan komisi negatif", async () => {
    const hasil = await bacaBerkas(berkasUji("shopee-komisi.csv"));

    expect(hasil.marketplace).toBe("shopee");
    expect(hasil.total_baris).toBe(4);
    expect(hasil.ditolak).toEqual([]);
    expect(hasil.baris).toHaveLength(4);
    expect(hasil.kolom_kurang).toEqual([]);

    const pertama = hasil.baris[0];
    expect(pertama.produk).toBe("Tas Kanvas Wanita Premium, Motif Bunga");
    expect(pertama.id_pesanan).toBe("240915ABC123");
    expect(pertama.komisi).toBe(12285);
    expect(pertama.harga).toBe(189000);
    expect(pertama.tanggal).toBe("2026-09-15");
    expect(pertama.status_kode).toBe("selesai");
    expect(pertama.tingkat_komisi).toBe(6.5);
    expect(pertama.sub_id).toBe("threads-01");

    const tertunda = hasil.baris[1];
    expect(tertunda.produk).toBe('Blender Portable 400ml "Travel"');
    expect(tertunda.status_kode).toBe("menunggu");
    expect(tertunda.jumlah).toBe(2);

    const retur = hasil.baris[2];
    expect(retur.produk).toBe("Sepatu Sneakers Pria Size 42");
    expect(retur.komisi).toBe(-21125);
    expect(retur.status_kode).toBe("batal");

    expect(hasil.baris[3].produk).toBe("Lampu Meja Belajar LED");
    expect(hasil.baris[3].komisi).toBe(15600);
  });
});

describe("laporan TikTok Shop Affiliate", () => {
  it("membaca header Inggris, pemisah titik koma, dan baris tanpa komisi", async () => {
    const hasil = await bacaBerkas(berkasUji("tiktok-orders.csv"));

    expect(hasil.marketplace).toBe("tiktok");
    expect(hasil.pemisah).toBe(";");
    expect(hasil.baris).toHaveLength(3);
    expect(hasil.ditolak).toHaveLength(1);
    expect(hasil.ditolak[0].nomor).toBe(4);
    expect(hasil.ditolak[0].alasan).toContain("komisi dan klik");

    const pertama = hasil.baris[0];
    expect(pertama.id_pesanan).toBe("5778abc001");
    expect(pertama.varian).toBe("SKU-OVR-BLK-L");
    expect(pertama.jumlah).toBe(2);
    expect(pertama.tanggal).toBe("2026-09-20");
    expect(pertama.status_kode).toBe("selesai");

    expect(hasil.baris[2].status_kode).toBe("batal");
  });
});

describe("laporan Tokopedia Affiliate", () => {
  it("melewati baris judul, memakai pemisah tab, dan menolak baris tanpa komisi", async () => {
    const hasil = await bacaBerkas(berkasUji("tokopedia-komisi.tsv", "text/tab-separated-values"));

    expect(hasil.marketplace).toBe("tokopedia");
    expect(hasil.pemisah).toBe("\t");
    expect(hasil.baris_dilewati).toBe(1);
    expect(hasil.baris).toHaveLength(2);
    expect(hasil.ditolak).toHaveLength(1);

    const pertama = hasil.baris[0];
    expect(pertama.id_pesanan).toBe("TP-2026-0001");
    expect(pertama.tanggal).toBe("2026-09-05");
    expect(pertama.harga).toBe(75000);
    expect(pertama.komisi).toBe(4500);

    expect(hasil.baris[1].jumlah).toBe(2);
    expect(hasil.baris[1].komisi).toBe(9000);
  });
});

describe("laporan analitik dengan kolom klik", () => {
  it("menerima baris yang hanya punya klik, tanpa komisi", async () => {
    const hasil = await bacaBerkas(berkasUji("tiktok-analitik.csv"));

    expect(hasil.marketplace).toBe("tiktok");
    expect(hasil.baris).toHaveLength(3);
    expect(hasil.ditolak).toEqual([]);

    expect(hasil.baris[0].jenis).toBe("penjualan");
    expect(hasil.baris[0].klik).toBe(184);
    expect(hasil.baris[0].komisi).toBe(12285);

    const tanpaKomisi = hasil.baris[2];
    expect(tanpaKomisi.produk).toBe("Topi Baseball");
    expect(tanpaKomisi.jenis).toBe("klik");
    expect(tanpaKomisi.klik).toBe(41);
    expect(tanpaKomisi.komisi).toBe(0);
    expect(tanpaKomisi.harga).toBe(0);
  });

  it("menerima baris tanpa komisi maupun klik sebagai gagal", () => {
    const hasil = bacaTeks("Nama Produk;Komisi;Klik\nTas Kanvas;;");
    expect(hasil.baris).toEqual([]);
    expect(hasil.ditolak[0].alasan).toContain("komisi dan klik");
  });

  it("cukup memakai nama produk dan kolom klik saja", () => {
    const hasil = bacaTeks("Nama Produk;Klik\nTas Kanvas;120");
    expect(hasil.kolom_kurang).toEqual([]);
    expect(hasil.baris[0].klik).toBe(120);
    expect(hasil.baris[0].jenis).toBe("klik");
  });
});

describe("laporan .xlsx", () => {
  it("membaca ekspor .xlsx lewat jalur berkas", async () => {
    const hasil = await bacaBerkas(
      berkasUji("tiktok-orders.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    );

    expect(hasil.marketplace).toBe("tiktok");
    expect(hasil.pemisah).toBe("xlsx");
    expect(hasil.baris).toHaveLength(3);
    expect(hasil.ditolak).toEqual([]);

    const kedua = hasil.baris[1];
    expect(kedua.id_pesanan).toBe("5778abc002");
    expect(kedua.produk).toBe("Celana Chino Slim");
    expect(kedua.varian).toBe("");
    expect(kedua.tanggal).toBe("2026-09-21");
    expect(kedua.komisi).toBe(21125);
    expect(kedua.tingkat_komisi).toBe(6.5);
  });

  it("menolak .xls lama dengan pesan yang bisa ditindaklanjuti", async () => {
    const file = berkasUji("shopee-komisi.csv");
    const xls = new File([await file.arrayBuffer()], "laporan.xls");
    await expect(bacaBerkas(xls)).rejects.toThrow(/Save As/);
  });
});

describe("jalur tempel dan pemetaan manual", () => {
  it("menyediakan pemetaan kolom manual saat header tidak dikenal", () => {
    const hasil = bacaTeks("Kolom A;Kolom B;Kolom C\nTas Kanvas;1000;Selesai", {
      petaManual: { produk: 0, komisi: 1, status_pesanan: 2 },
    });
    expect(hasil.marketplace).toBe("lainnya");
    expect(hasil.baris).toHaveLength(1);
    expect(hasil.baris[0].produk).toBe("Tas Kanvas");
    expect(hasil.baris[0].komisi).toBe(1000);
    expect(hasil.baris[0].status_kode).toBe("selesai");
  });

  it("melaporkan kolom wajib yang hilang tanpa menggagalkan seluruh impor", () => {
    const hasil = bacaTeks("Nama Produk;Tanggal\nTas;01/09/2026");
    expect(hasil.kolom_kurang).toEqual(["komisi"]);
    expect(hasil.baris).toEqual([]);
    expect(hasil.total_baris).toBe(1);
  });

  it("menghormati pilihan marketplace manual", () => {
    const hasil = bacaTeks("Nama Produk;Komisi\nTas;1000", { marketplace: "tokopedia" });
    expect(hasil.marketplace).toBe("tokopedia");
    expect(hasil.alasan_deteksi).toContain("Dipilih manual");
  });

  it("memberi id baris yang stabil agar impor ulang tidak menggandakan", () => {
    const teks = "Nama Produk;ID Pesanan;Komisi\nTas;A1;1000";
    const a = bacaTeks(teks).baris[0];
    const b = bacaTeks(teks).baris[0];
    expect(a.id).toBe(b.id);
  });
});
