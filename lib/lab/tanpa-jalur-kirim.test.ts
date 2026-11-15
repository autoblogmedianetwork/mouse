/**
 * Penjaga Fase 4: semua alat Lab hanya boleh MENGEMBALIKAN DRAF.
 *
 * Kalau suatu saat ada yang menambahkan jalur kirim ke salah satu route Lab
 * (mis. memanggil provider posting atau /api/posting/kirim), test ini gagal —
 * jadi "hanya draf" bukan sekadar janji di dokumentasi, tapi terkunci di uji.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

/** Semua route alat Lab. Tambah di sini kalau ada alat baru. */
const ROUTE_LAB = [
  "ab-hook",
  "battle",
  "ghostwriter",
  "kembaran-jujur",
  "lab-uji",
  "lawan-bots",
  "mirror",
  "nyanyian",
  "paralel",
];

/** Penanda bahwa sebuah route bisa mengirim (bukan hanya membuat draf). */
const PENANDA_KIRIM = [
  "posting/kirim",
  "posting/provider",
  "posting/antrian",
  "ambilProvider",
  "penyediaEfektif",
  "periksaKirim",
  "catatPost",
];

describe("alat Lab tidak punya jalur kirim", () => {
  for (const nama of ROUTE_LAB) {
    it(`app/api/${nama}/route.ts hanya membuat draf`, () => {
      const jalur = join(ROOT, "app", "api", nama, "route.ts");
      const isi = readFileSync(jalur, "utf8");
      for (const penanda of PENANDA_KIRIM) {
        expect(isi).not.toContain(penanda);
      }
    });
  }

  it("setiap route Lab menyatakan dirinya draf di komentar kepala", () => {
    for (const nama of ROUTE_LAB) {
      const isi = readFileSync(join(ROOT, "app", "api", nama, "route.ts"), "utf8");
      expect(isi.toLowerCase()).toContain("draf");
    }
  });
});
