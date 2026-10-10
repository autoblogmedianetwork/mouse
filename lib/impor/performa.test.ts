import { describe, expect, it } from "vitest";
import { buatIdBaris, gabungPerforma, kunciBaris, ringkasPerforma, saringPeriode } from "./performa";
import type { BarisPerforma } from "./skema";

function baris(ubah: Partial<BarisPerforma>): BarisPerforma {
  const dasar: BarisPerforma = {
    id: "",
    marketplace: "shopee",
    jenis: "penjualan",
    id_pesanan: "A1",
    produk: "Tas Kanvas",
    varian: "",
    tanggal: "2026-09-15",
    jumlah: 1,
    harga: 100_000,
    komisi: 6_000,
    tingkat_komisi: 6,
    status_pesanan: "Selesai",
    status_kode: "selesai",
    sub_id: "",
    klik: 0,
    sumber: "uji.csv",
    diimpor_pada: "2026-10-01T00:00:00.000Z",
  };
  const gabung = { ...dasar, ...ubah };
  return { ...gabung, id: buatIdBaris(kunciBaris(gabung)) };
}

describe("kunciBaris", () => {
  it("memakai ID pesanan bila ada", () => {
    expect(kunciBaris({ marketplace: "shopee", id_pesanan: "A1", produk: "Tas", komisi: 1 })).toBe(
      "shopee|a1|tas",
    );
  });

  it("menyusun kunci dari produk, tanggal, dan komisi tanpa ID pesanan", () => {
    expect(
      kunciBaris({ marketplace: "tiktok", id_pesanan: "", produk: "Tas", tanggal: "2026-09-15", komisi: 6000 }),
    ).toBe("tiktok|-|tas|2026-09-15|6000");
  });

  it("mengabaikan huruf besar-kecil dan spasi berlebih", () => {
    expect(kunciBaris({ marketplace: "shopee", id_pesanan: " a1 ", produk: " TAS " })).toBe("shopee|a1|tas");
  });
});

describe("buatIdBaris", () => {
  it("stabil untuk kunci yang sama dan berbeda untuk kunci lain", () => {
    expect(buatIdBaris("shopee|a1|tas")).toBe(buatIdBaris("shopee|a1|tas"));
    expect(buatIdBaris("shopee|a1|tas")).not.toBe(buatIdBaris("shopee|a2|tas"));
  });
});

describe("gabungPerforma", () => {
  it("menambahkan baris baru dan memperbarui baris dengan kunci sama", () => {
    const lama = [baris({}), baris({ id_pesanan: "A2", produk: "Sepatu" })];
    const baru = [
      baris({ status_pesanan: "Selesai", status_kode: "selesai", komisi: 6_500 }),
      baris({ id_pesanan: "A3", produk: "Topi" }),
    ];

    const hasil = gabungPerforma(lama, baru);
    expect(hasil.baris).toHaveLength(3);
    expect(hasil.ditambah).toBe(1);
    expect(hasil.diperbarui).toBe(1);
    expect(hasil.baris.find((b) => b.id_pesanan === "A1")?.komisi).toBe(6_500);
  });

  it("tidak menggandakan saat berkas yang sama diimpor dua kali", () => {
    const barisAwal = [baris({}), baris({ id_pesanan: "A2" })];
    const pertama = gabungPerforma([], barisAwal);
    const kedua = gabungPerforma(pertama.baris, barisAwal);
    expect(kedua.baris).toHaveLength(2);
    expect(kedua.ditambah).toBe(0);
    expect(kedua.diperbarui).toBe(2);
  });
});

describe("ringkasPerforma", () => {
  const data = [
    baris({ id_pesanan: "A1", produk: "Tas Kanvas", komisi: 12_285, harga: 189_000, tanggal: "2026-09-15" }),
    baris({ id_pesanan: "A2", produk: "Tas Kanvas", komisi: 10_270, harga: 158_000, tanggal: "2026-09-16" }),
    baris({
      id_pesanan: "A3",
      produk: "Sepatu",
      komisi: -21_125,
      harga: 325_000,
      status_kode: "batal",
      status_pesanan: "Dibatalkan",
      tanggal: "2026-09-17",
    }),
    baris({
      id_pesanan: "T1",
      produk: "Blender",
      marketplace: "tiktok",
      komisi: 9_000,
      harga: 150_000,
      status_kode: "menunggu",
      status_pesanan: "Menunggu Konfirmasi",
      tanggal: "2026-10-02",
    }),
  ];

  it("memisahkan komisi cair, tertunda, dan batal", () => {
    const ringkas = ringkasPerforma(data);
    expect(ringkas.komisi_selesai).toBe(22_555);
    expect(ringkas.komisi_tertunda).toBe(9_000);
    expect(ringkas.komisi_batal).toBe(-21_125);
    expect(ringkas.komisi).toBe(10_430);
    expect(ringkas.gmv).toBe(822_000);
    expect(ringkas.persen_komisi).toBeCloseTo(1.2689, 4);
  });

  it("menghitung pesanan dan produk unik", () => {
    const ringkas = ringkasPerforma(data);
    // A3 dibatalkan, jadi tidak dihitung sebagai pesanan walau barisnya ada.
    expect(ringkas.pesanan).toBe(3);
    expect(ringkas.pesanan_batal).toBe(1);
    expect(ringkas.baris_klik).toBe(0);
    expect(ringkas.produk).toBe(3);
    expect(ringkas.baris).toBe(4);
  });

  it("memecah per marketplace dan mengurutkan dari komisi terbesar", () => {
    const ringkas = ringkasPerforma(data);
    expect(ringkas.per_marketplace.map((m) => m.marketplace)).toEqual(["tiktok", "shopee"]);
    expect(ringkas.per_marketplace[0].komisi).toBe(9_000);
    expect(ringkas.per_marketplace[1].komisi).toBe(1_430);
    expect(ringkas.per_marketplace[1].pesanan).toBe(2);
  });

  it("membuat peringkat produk dan tren bulanan", () => {
    const ringkas = ringkasPerforma(data);
    expect(ringkas.teratas[0].produk).toBe("Tas Kanvas");
    expect(ringkas.teratas[0].komisi).toBe(22_555);
    expect(ringkas.teratas[2].produk).toBe("Sepatu");
    expect(ringkas.bulanan.map((b) => b.bulan)).toEqual(["2026-09", "2026-10"]);
    expect(ringkas.bulanan[0].komisi).toBe(1_430);
  });

  it("mencatat rentang tanggal yang tersedia", () => {
    const ringkas = ringkasPerforma(data);
    expect(ringkas.awal).toBe("2026-09-15");
    expect(ringkas.akhir).toBe("2026-10-02");
  });

  it("aman untuk data kosong", () => {
    const ringkas = ringkasPerforma([]);
    expect(ringkas.komisi).toBe(0);
    expect(ringkas.persen_komisi).toBe(0);
    expect(ringkas.awal).toBeNull();
  });
});

describe("ringkasPerforma dengan kolom klik", () => {
  const data = [
    baris({ id_pesanan: "A1", produk: "Tas Kanvas", komisi: 12_285, harga: 189_000, klik: 184 }),
    baris({ id_pesanan: "A2", produk: "Sepatu", komisi: 6_000, harga: 100_000, klik: 60 }),
    baris({
      id_pesanan: "",
      produk: "Topi Baseball",
      komisi: 0,
      harga: 0,
      klik: 41,
      jenis: "klik",
      status_kode: "lainnya",
      status_pesanan: "",
    }),
  ];

  it("menjumlahkan klik dari baris penjualan dan baris klik", () => {
    expect(ringkasPerforma(data).klik).toBe(285);
  });

  it("tidak menghitung baris klik sebagai pesanan, produk, GMV, atau tren", () => {
    const ringkas = ringkasPerforma(data);
    expect(ringkas.baris).toBe(3);
    expect(ringkas.baris_penjualan).toBe(2);
    expect(ringkas.baris_klik).toBe(1);
    expect(ringkas.pesanan).toBe(2);
    expect(ringkas.produk).toBe(3);
    expect(ringkas.gmv).toBe(289_000);
    expect(ringkas.bulanan[0].pesanan).toBe(2);
  });

  it("menghitung konversi klik ke pesanan dalam persen", () => {
    const ringkas = ringkasPerforma(data);
    expect(ringkas.konversi).toBeCloseTo((2 / 285) * 100, 4);
  });

  it("menyimpan klik per marketplace dan per produk", () => {
    const ringkas = ringkasPerforma(data);
    expect(ringkas.per_marketplace[0].klik).toBe(285);
    expect(ringkas.teratas.find((p) => p.produk === "Topi Baseball")?.klik).toBe(41);
    expect(ringkas.teratas.find((p) => p.produk === "Tas Kanvas")?.klik).toBe(184);
  });

  it("konversi nol bila tidak ada klik sama sekali", () => {
    expect(ringkasPerforma([baris({})]).konversi).toBe(0);
  });
});

describe("saringPeriode", () => {
  const data = [
    baris({ id_pesanan: "A1", tanggal: "2026-09-15" }),
    baris({ id_pesanan: "A2", tanggal: "2026-10-05" }),
  ];

  it("menyaring bulan berjalan", () => {
    const hasil = saringPeriode(data, 1, new Date("2026-10-11T00:00:00Z"));
    expect(hasil.map((b) => b.id_pesanan)).toEqual(["A2"]);
  });

  it("menyaring dua bulan terakhir", () => {
    const hasil = saringPeriode(data, 2, new Date("2026-10-11T00:00:00Z"));
    expect(hasil).toHaveLength(2);
  });

  it("mengembalikan semua baris tanpa filter", () => {
    expect(saringPeriode(data, null)).toHaveLength(2);
  });
});
