import { describe, expect, it } from "vitest";
import { rangkingAngle, sudutTerbaik, MIN_SUDUT } from "./rangking-angle";
import type { RingkasanAngle } from "./atribusi";

const angle = (p: Partial<RingkasanAngle> & { angle: string }): RingkasanAngle => ({
  angle: p.angle,
  konten: p.konten ?? 1,
  klik: p.klik ?? 0,
  pesanan: p.pesanan ?? 0,
  komisi: p.komisi ?? 0,
  komisi_cair: p.komisi_cair ?? 0,
  konversi: p.klik ? (p.komisi_cair ?? 0) / p.klik : 0,
});

describe("rangkingAngle", () => {
  it("menaruh sudut yang menghasilkan komisi di atas", () => {
    const hasil = rangkingAngle([
      angle({ angle: "hemat", konten: 3, klik: 100, komisi_cair: 0 }),
      angle({ angle: "masalah", konten: 4, klik: 80, komisi_cair: 120000 }),
    ]);
    expect(hasil[0].angle).toBe("masalah");
    expect(hasil[0].putusan).toBe("lanjutkan");
  });

  it("menghitung rupiah per klik", () => {
    const [p] = rangkingAngle([angle({ angle: "a", konten: 2, klik: 50, komisi_cair: 25000 })]);
    expect(p.rupiah_per_klik).toBe(500);
  });

  it("menyuruh ganti sudut kalau ada klik tapi tidak ada komisi di banyak konten", () => {
    const [p] = rangkingAngle([
      angle({ angle: "story", konten: MIN_SUDUT, klik: 90, komisi_cair: 0 }),
    ]);
    expect(p.putusan).toBe("ganti-sudut");
    expect(p.alasan).toContain("tidak ada komisi");
  });

  it("menyuruh uji lagi kalau konten masih sedikit", () => {
    const [p] = rangkingAngle([angle({ angle: "baru", konten: 1, klik: 12, komisi_cair: 0 })]);
    expect(p.putusan).toBe("uji-lagi");
  });

  it("menandai belum ada data kalau klik nol", () => {
    const [p] = rangkingAngle([angle({ angle: "sepi", konten: 3, klik: 0, komisi_cair: 0 })]);
    expect(p.putusan).toBe("belum-data");
  });

  it("menandai keyakinan dari jumlah konten", () => {
    const hasil = rangkingAngle([
      angle({ angle: "tipis", konten: 1, klik: 5, komisi_cair: 1000 }),
      angle({ angle: "cukup", konten: 2, klik: 5, komisi_cair: 1000 }),
      angle({ angle: "kuat", konten: 4, klik: 5, komisi_cair: 1000 }),
    ]);
    const peta = Object.fromEntries(hasil.map((p) => [p.angle, p.keyakinan]));
    expect(peta.tipis).toBe("tipis");
    expect(peta.cukup).toBe("cukup");
    expect(peta.kuat).toBe("kuat");
  });

  it("menyebut efisiensi di atas median", () => {
    const hasil = rangkingAngle([
      angle({ angle: "juara", konten: 2, klik: 10, komisi_cair: 50000 }),
      angle({ angle: "biasa", konten: 2, klik: 10, komisi_cair: 5000 }),
    ]);
    expect(hasil[0].angle).toBe("juara");
    expect(hasil[0].alasan).toContain("median");
  });

  it("tidak membuang sudut kosong, hanya memberi nama pengganti", () => {
    const hasil = rangkingAngle([angle({ angle: "  ", konten: 2, klik: 3, komisi_cair: 0 })]);
    expect(hasil[0].angle).toBe("(tanpa sudut)");
  });

  it("daftar kosong menghasilkan daftar kosong", () => {
    expect(rangkingAngle([])).toEqual([]);
  });

  it("sudutTerbaik mengembalikan yang layak dilanjutkan atau null", () => {
    expect(sudutTerbaik([])).toBeNull();
    const baik = sudutTerbaik([
      angle({ angle: "mati", konten: 3, klik: 40, komisi_cair: 0 }),
      angle({ angle: "hidup", konten: 3, klik: 40, komisi_cair: 30000 }),
    ]);
    expect(baik?.angle).toBe("hidup");
  });
});
