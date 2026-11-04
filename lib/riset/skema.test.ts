import { describe, expect, it } from "vitest";
import { peluangProdukSkema, risetAudiensSkema } from "@/lib/ai/schemas";
import { barisKePeluang, barisKeRiset, urutkanPeluang } from "./skema";

const masalah = {
  masalah: "Dapur sempit",
  situasi: "Saat masak",
  produk_contoh: ["Rak bumbu gantung"],
  alasan: "Hemat ruang",
};

describe("risetAudiensSkema", () => {
  it("menerima tepat 10 masalah", () => {
    const hasil = risetAudiensSkema.safeParse({
      ringkasan: "Polanya soal ruang.",
      masalah: Array.from({ length: 10 }, () => masalah),
    });
    expect(hasil.success).toBe(true);
  });

  it("menolak hasil yang jumlahnya bukan 10", () => {
    const hasil = risetAudiensSkema.safeParse({
      ringkasan: "Polanya soal ruang.",
      masalah: [masalah, masalah],
    });
    expect(hasil.success).toBe(false);
  });

  it("mengisi situasi dan alasan yang hilang dengan string kosong", () => {
    const hasil = risetAudiensSkema.safeParse({
      ringkasan: "Ringkas.",
      masalah: Array.from({ length: 10 }, () => ({
        masalah: "Masalah",
        produk_contoh: ["Produk"],
      })),
    });
    expect(hasil.success).toBe(true);
    if (hasil.success) expect(hasil.data.masalah[0].situasi).toBe("");
  });

  it("menolak masalah tanpa contoh produk", () => {
    const hasil = risetAudiensSkema.safeParse({
      ringkasan: "Ringkas.",
      masalah: Array.from({ length: 10 }, () => ({ masalah: "Masalah", produk_contoh: [] })),
    });
    expect(hasil.success).toBe(false);
  });
});

describe("peluangProdukSkema", () => {
  const item = {
    kategori: "Penyimpanan dapur",
    alasan: "Mudah diceritakan.",
    masalah_terkait: "Dapur sempit",
    contoh_produk: ["Rak bumbu"],
    prioritas: "tinggi",
    kesulitan_konten: "rendah",
  };

  it("menerima tepat 20 kategori", () => {
    expect(
      peluangProdukSkema.safeParse({
        peluang: Array.from({ length: 20 }, () => item),
      }).success,
    ).toBe(true);
  });

  it("menolak 19 kategori", () => {
    expect(
      peluangProdukSkema.safeParse({
        peluang: Array.from({ length: 19 }, () => item),
      }).success,
    ).toBe(false);
  });

  it("menolak prioritas di luar daftar", () => {
    expect(
      peluangProdukSkema.safeParse({
        peluang: Array.from({ length: 20 }, () => ({ ...item, prioritas: "urgent" })),
      }).success,
    ).toBe(false);
  });
});

describe("barisKeRiset", () => {
  it("membuang baris yang tidak punya id atau created_at", () => {
    expect(barisKeRiset({ niche: "x" })).toBeNull();
  });

  it("mempertahankan baris valid dengan masalah jsonb", () => {
    const hasil = barisKeRiset({
      id: "r1",
      niche: "Dapur",
      audiens: "Ibu",
      ringkasan: "Ringkas",
      masalah: [masalah],
      prompt_version: "riset-audience.v1",
      model: null,
      created_at: "2026-11-05T00:00:00Z",
    });
    expect(hasil?.masalah).toHaveLength(1);
  });
});

describe("barisKePeluang", () => {
  it("menurunkan prioritas asing ke sedang, bukan membuang baris", () => {
    const hasil = barisKePeluang({
      id: "p1",
      riset_id: "r1",
      urutan: "3",
      kategori: "Rak",
      alasan: "Alasan",
      masalah_terkait: null,
      contoh_produk: ["Rak bumbu"],
      prioritas: "super",
      kesulitan_konten: "rendah",
      dipilih: false,
      produk_id: null,
    });
    expect(hasil?.prioritas).toBe("sedang");
    expect(hasil?.urutan).toBe(3);
  });
});

describe("urutkanPeluang", () => {
  it("menaruh prioritas tinggi lebih dulu, lalu urutan terkecil", () => {
    const dasar = {
      id: "x",
      riset_id: "r1",
      kategori: "K",
      alasan: "",
      masalah_terkait: null,
      contoh_produk: [],
      kesulitan_konten: "rendah" as const,
      dipilih: false,
      produk_id: null,
    };
    const hasil = urutkanPeluang([
      { ...dasar, id: "a", urutan: 1, prioritas: "rendah" },
      { ...dasar, id: "b", urutan: 2, prioritas: "tinggi" },
      { ...dasar, id: "c", urutan: 3, prioritas: "tinggi" },
    ]);
    expect(hasil.map((p) => p.id)).toEqual(["b", "c", "a"]);
  });
});
