import { describe, expect, it } from "vitest";
import type { BarisPerforma } from "@/lib/impor/skema";
import { blokDariJam, hitungPetaPanen, indeksHari, LABEL_HARI } from "./peta-panen";

function baris(ubah: Partial<BarisPerforma>): BarisPerforma {
  const dasar: BarisPerforma = {
    id: "",
    marketplace: "shopee",
    jenis: "penjualan",
    id_pesanan: "A1",
    produk: "Tas Kanvas",
    varian: "",
    tanggal: "2026-11-09",
    jam: null,
    jumlah: 1,
    harga: 189_000,
    komisi: 18_900,
    tingkat_komisi: null,
    status_pesanan: "Selesai",
    status_kode: "selesai",
    sub_id: "at-1a2b3c",
    klik: 0,
    sumber: "laporan.csv",
    diimpor_pada: "2026-11-10T00:00:00.000Z",
  };
  return { ...dasar, ...ubah };
}

describe("indeksHari", () => {
  it("memakai Senin = 0 tanpa bergeser zona waktu", () => {
    expect(indeksHari("2026-11-09")).toBe(0);
    expect(indeksHari("2026-11-14")).toBe(5);
    expect(indeksHari("2026-11-08")).toBe(6);
    expect(LABEL_HARI[indeksHari("2026-11-08") as number]).toBe("Minggu");
  });

  it("menolak tanggal yang tidak ada", () => {
    expect(indeksHari("2026-02-31")).toBeNull();
    expect(indeksHari("bukan tanggal")).toBeNull();
  });
});

describe("blokDariJam", () => {
  it("memetakan 24 jam ke enam blok 4 jam", () => {
    expect(blokDariJam(0)).toBe(0);
    expect(blokDariJam(3)).toBe(0);
    expect(blokDariJam(4)).toBe(1);
    expect(blokDariJam(14)).toBe(3);
    expect(blokDariJam(23)).toBe(5);
  });
});

describe("hitungPetaPanen", () => {
  it("mengelompokkan komisi per hari dan menghitung grid jam saat ada jamnya", () => {
    const hasil = hitungPetaPanen([
      baris({ id_pesanan: "A1", tanggal: "2026-11-09", jam: 14, komisi: 10_000 }),
      baris({ id_pesanan: "A2", tanggal: "2026-11-09", jam: 15, komisi: 5_000 }),
      baris({ id_pesanan: "A3", tanggal: "2026-11-11", jam: 9, komisi: 20_000 }),
    ]);

    expect(hasil.total.baris).toBe(3);
    expect(hasil.total.komisi).toBe(35_000);
    expect(hasil.per_hari[0].label).toBe("Senin");
    expect(hasil.per_hari[0].komisi).toBe(15_000);
    expect(hasil.per_hari[0].pesanan).toBe(2);
    expect(hasil.per_hari[2].komisi).toBe(20_000);
    expect(hasil.per_hari[1].baris).toBe(0);

    expect(hasil.ada_jam).toBe(true);
    expect(hasil.baris_berjam).toBe(3);
    expect(hasil.per_sel).toHaveLength(7 * 6);
    // Senin blok 12-16 (indeks 3) menampung dua pesanan sore.
    const seninSore = hasil.per_sel.find((s) => s.hari === 0 && s.blok === 3);
    expect(seninSore?.komisi).toBe(15_000);
    expect(seninSore?.pesanan).toBe(2);
    expect(hasil.maks_sel).toBe(20_000);
    expect(hasil.sel_terbaik).toMatchObject({ hari: 2, blok: 2 });
    expect(hasil.hari_terbaik?.label).toBe("Rabu");
  });

  it("tidak mengarang jam saat laporan hanya memberi tanggal", () => {
    const hasil = hitungPetaPanen([
      baris({ id_pesanan: "A1", tanggal: "2026-11-09", jam: null }),
      baris({ id_pesanan: "A2", tanggal: "2026-11-10", jam: null }),
    ]);

    expect(hasil.ada_jam).toBe(false);
    expect(hasil.baris_berjam).toBe(0);
    expect(hasil.sel_terbaik).toBeNull();
    expect(hasil.per_sel.every((s) => s.baris === 0)).toBe(true);
    expect(hasil.total.baris).toBe(2);
  });

  it("tidak menghitung pesanan batal, tetapi komisinya tetap terlihat", () => {
    const hasil = hitungPetaPanen([
      baris({ id_pesanan: "A1", tanggal: "2026-11-09", jam: 10, komisi: 10_000 }),
      baris({
        id_pesanan: "A2",
        tanggal: "2026-11-09",
        jam: 10,
        komisi: -4_000,
        status_pesanan: "Batal",
        status_kode: "batal",
      }),
    ]);

    const senin = hasil.per_hari[0];
    expect(senin.komisi).toBe(6_000);
    expect(senin.komisi_cair).toBe(10_000);
    expect(senin.pesanan).toBe(1);
    const sel = hasil.per_sel.find((s) => s.hari === 0 && s.blok === 2);
    expect(sel?.pesanan).toBe(1);
    expect(sel?.komisi_cair).toBe(10_000);
  });

  it("menghitung klik dari baris ekspor analitik tanpa pesanan", () => {
    const hasil = hitungPetaPanen([
      baris({
        id_pesanan: "",
        produk: "",
        jenis: "klik",
        tanggal: "2026-11-14",
        jam: 20,
        klik: 40,
        komisi: 0,
        status_kode: "lainnya",
      }),
    ]);

    expect(hasil.per_hari[5].klik).toBe(40);
    expect(hasil.per_hari[5].pesanan).toBe(0);
    expect(hasil.total.klik).toBe(40);
  });

  it("memisahkan baris tanpa tanggal, bukan membuangnya diam-diam", () => {
    const hasil = hitungPetaPanen([
      baris({ id_pesanan: "A1", tanggal: null, jam: null, komisi: 7_000 }),
      baris({ id_pesanan: "A2", tanggal: "2026-11-09", jam: 8, komisi: 3_000 }),
    ]);

    expect(hasil.tanpa_tanggal).toEqual({ baris: 1, komisi: 7_000 });
    expect(hasil.total.baris).toBe(1);
    expect(hasil.hari_terbaik?.label).toBe("Senin");
  });

  it("mengembalikan hari terbaik null saat tidak ada baris", () => {
    const hasil = hitungPetaPanen([]);
    expect(hasil.hari_terbaik).toBeNull();
    expect(hasil.sel_terbaik).toBeNull();
    expect(hasil.maks_sel).toBe(0);
    expect(hasil.per_hari).toHaveLength(7);
  });
});
