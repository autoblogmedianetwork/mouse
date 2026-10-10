import { describe, expect, it } from "vitest";
import { deteksiMarketplace, normalisasiHeader, petakanKolom } from "./marketplace";

const HEADER_SHOPEE = [
  "Nama Produk",
  "ID Pesanan",
  "Status Pesanan",
  "Tanggal Pesanan",
  "Jumlah",
  "Harga",
  "Komisi",
  "Tingkat Komisi",
  "Sub_id",
];
const HEADER_TIKTOK = [
  "Order ID",
  "Product Name",
  "SKU ID",
  "Quantity",
  "Order Amount",
  "Commission",
  "Commission Rate",
  "Order Status",
  "Order created time",
];
const HEADER_TOKOPEDIA = [
  "No. Pesanan",
  "Tanggal Dibuat",
  "Nama Produk",
  "Status Pesanan",
  "Jumlah",
  "Total Pembayaran",
  "Total Komisi",
];

describe("normalisasiHeader", () => {
  it("membuang tanda baca, spasi, dan huruf besar", () => {
    expect(normalisasiHeader("No. Pesanan")).toBe("nopesanan");
    expect(normalisasiHeader("Sub_id")).toBe("subid");
    expect(normalisasiHeader("Order created time")).toBe("ordercreatedtime");
    expect(normalisasiHeader("\uFEFFKomisi")).toBe("komisi");
  });
});

describe("deteksiMarketplace", () => {
  it("mengenali kolom khas tiap marketplace", () => {
    expect(deteksiMarketplace(HEADER_SHOPEE).kode).toBe("shopee");
    expect(deteksiMarketplace(HEADER_TIKTOK).kode).toBe("tiktok");
    expect(deteksiMarketplace(HEADER_TOKOPEDIA).kode).toBe("tokopedia");
  });

  it("memakai nama berkas sebagai petunjuk tambahan", () => {
    const generik = ["Tanggal", "Produk", "Komisi"];
    expect(deteksiMarketplace(generik, "laporan-tokopedia.xlsx").kode).toBe("tokopedia");
    expect(deteksiMarketplace(generik, "spr-export.csv").kode).toBe("shopee");
  });

  it("jatuh ke format generik saat kolom tidak dikenali", () => {
    const hasil = deteksiMarketplace(["Foo", "Bar", "Baz"]);
    expect(hasil.kode).toBe("lainnya");
    expect(hasil.skor).toBe(0);
    expect(hasil.alasan).toContain("tidak menyerupai");
  });

  it("memberi peringkat kandidat untuk pemilihan manual", () => {
    const hasil = deteksiMarketplace(HEADER_TIKTOK, "export.csv");
    expect(hasil.kandidat[0].kode).toBe("tiktok");
    expect(hasil.kandidat[0].skor).toBeGreaterThan(hasil.kandidat[1].skor);
  });
});

describe("petakanKolom", () => {
  it("memetakan kolom Shopee termasuk Sub_id", () => {
    const { peta, dikenali, kurang, takDikenali } = petakanKolom(HEADER_SHOPEE, "shopee");
    expect(peta.produk).toBe(0);
    expect(peta.id_pesanan).toBe(1);
    expect(peta.komisi).toBe(6);
    expect(peta.sub_id).toBe(8);
    expect(kurang).toEqual([]);
    expect(dikenali).toBe(9);
    expect(takDikenali).toEqual([]);
  });

  it("memetakan kolom TikTok Shop dengan nama Inggris", () => {
    const { peta, kurang } = petakanKolom(HEADER_TIKTOK, "tiktok");
    expect(peta.varian).toBe(2);
    expect(peta.komisi).toBe(5);
    expect(peta.tanggal).toBe(8);
    expect(kurang).toEqual([]);
  });

  it("memetakan kolom Tokopedia", () => {
    const { peta, kurang } = petakanKolom(HEADER_TOKOPEDIA, "tokopedia");
    expect(peta.id_pesanan).toBe(0);
    expect(peta.harga).toBe(5);
    expect(peta.komisi).toBe(6);
    expect(kurang).toEqual([]);
  });

  it("melaporkan kolom yang tidak dikenal", () => {
    const { takDikenali } = petakanKolom([...HEADER_SHOPEE, "Catatan Seller"], "shopee");
    expect(takDikenali).toEqual(["Catatan Seller"]);
  });

  it("menandai kolom wajib yang belum ketemu", () => {
    const { kurang } = petakanKolom(["Nama Produk", "Tanggal"], "lainnya");
    expect(kurang).toEqual(["komisi"]);
  });
});
