import { describe, expect, it } from "vitest";
import type { HasilAtribusi, RingkasanDimensi } from "./atribusi";
import { insightAtribusi, rekomendasiDariPerforma } from "./rekomendasi";

const dimensi = (
  kunci: string,
  label: string,
  konten: number,
  komisi_cair: number,
  klik = 10,
): RingkasanDimensi => ({
  kunci,
  label,
  konten,
  komisi: komisi_cair,
  komisi_cair,
  pesanan: konten,
  klik,
  konversi: 0.1,
});

const hasil = (per_hook: RingkasanDimensi[], per_letak_link: RingkasanDimensi[]): HasilAtribusi =>
  ({
    per_konten: [],
    per_angle: [],
    per_hook,
    per_letak_link,
    belum_terpetakan: [],
    tanpa_subid: { baris: 0, komisi: 0, klik: 0 },
    konten_tanpa_data: 0,
    teratas: [],
    total: { komisi: 0, klik: 0, pesanan: 0, baris_terpetakan: 4 },
  }) as unknown as HasilAtribusi;

describe("rekomendasi dari performa (Fase 3, task 3-E)", () => {
  it("data tipis -> satu catatan jujur, bukan rekomendasi kosong", () => {
    const keluar = rekomendasiDariPerforma(
      hasil([dimensi("bawaan", "Bawaan", 1, 50_000)], [dimensi("balasan", "Balasan", 1, 20_000)]),
    );
    expect(keluar).toHaveLength(1);
    expect(keluar[0].dimensi).toBe("umum");
    expect(keluar[0].teks).toContain("belum cukup");
  });

  it("pemenang per gaya pembuka dipilih dari komisi cair", () => {
    const keluar = rekomendasiDariPerforma(
      hasil(
        [
          dimensi("bawaan", "Bawaan", 3, 50_000),
          dimensi("pertanyaan", "Pertanyaan Reflektif", 2, 120_000),
        ],
        [],
      ),
    );
    expect(keluar).toHaveLength(1);
    expect(keluar[0].dimensi).toBe("gaya pembuka");
    expect(keluar[0].teks).toContain("Pertanyaan Reflektif");
    expect(keluar[0].teks).toContain("120.000");
  });

  it("dua dimensi cukup data -> dua rekomendasi", () => {
    const keluar = rekomendasiDariPerforma(
      hasil(
        [dimensi("bawaan", "Bawaan", 3, 50_000), dimensi("curiosity", "Curiosity Gap", 4, 90_000)],
        [dimensi("status_terakhir", "Di status terakhir", 5, 70_000), dimensi("balasan", "Balasan", 2, 10_000)],
      ),
    );
    expect(keluar).toHaveLength(2);
    expect(keluar.map((r) => r.dimensi)).toEqual(["gaya pembuka", "posisi link"]);
    expect(keluar[1].teks).toContain("Di status terakhir");
  });

  it("komisi cair nol tidak pernah jadi pemenang", () => {
    const keluar = rekomendasiDariPerforma(
      hasil(
        [dimensi("bawaan", "Bawaan", 3, 0), dimensi("curiosity", "Curiosity Gap", 3, 0)],
        [],
      ),
    );
    expect(keluar[0].dimensi).toBe("umum");
  });
});

describe("insight atribusi otomatis (power-up Analitik)", () => {
  it("menyebut penyumbang komisi terbesar dengan persen", () => {
    const keluar = insightAtribusi(
      hasil(
        [
          dimensi("pertanyaan", "Pertanyaan Reflektif", 3, 120_000),
          dimensi("bawaan", "Bawaan", 2, 30_000),
        ],
        [],
      ),
    );
    expect(keluar.some((t) => t.includes("80%") && t.includes("Pertanyaan Reflektif"))).toBe(true);
    // Bawaan punya komisi, jadi tidak ditandai kosong.
    expect(keluar.some((t) => t.includes("Bawaan") && t.includes("belum menghasilkan"))).toBe(false);
  });

  it("nilai tanpa komisi ditandai pertimbangkan ganti variasi", () => {
    const keluar = insightAtribusi(
      hasil(
        [
          dimensi("pertanyaan", "Pertanyaan Reflektif", 3, 120_000),
          dimensi("curiosity", "Curiosity Gap", 4, 0),
        ],
        [],
      ),
    );
    expect(keluar.some((t) => t.includes("Curiosity Gap") && t.includes("belum menghasilkan"))).toBe(true);
  });

  it("semua kosong -> catatan jujur, bukan diam", () => {
    const keluar = insightAtribusi(hasil([dimensi("bawaan", "Bawaan", 2, 0)], []));
    expect(keluar).toHaveLength(1);
    expect(keluar[0]).toContain("belum ada komisi");
  });
});
