import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Tahap 3+4 AUDIT-RESPONSIF (penjaga regresi):
 * - Tidak boleh ada lagi tabel dengan min-w tetap yang meluber di HP 360px.
 * - Delapan tabel wajib lewat TabelResponsif (tabel di sm+, kartu di HP).
 * - Tombol kecil (h-7/h-8) wajib punya versi 44px (h-11) di layar kecil.
 */

const DAFTAR_TABEL = [
  "app/(dashboard)/kalender/kalender-klien.tsx",
  "app/(dashboard)/link/tabel-link.tsx",
  "features/performa/performa-konten.tsx",
  "features/riset/bagian-peluang.tsx",
  "app/(dashboard)/riwayat/tabel-riwayat.tsx",
  "features/impor/panel-impor.tsx",
  "features/analitik/daftar-produk-belum-diposting.tsx",
  "features/performa/peta-panen.tsx",
];

const TOMBOL_KECIL = [
  "features/katalog/katalog-produk.tsx",
  "features/video/alur-video.tsx",
  "features/posting/carousel-slide-editor.tsx",
];

function jalurTsxAkhiran(dir: string, hasil: string[] = []): string[] {
  for (const nama of readdirSync(dir)) {
    const penuh = join(dir, nama);
    if (statSync(penuh).isDirectory()) jalurTsxAkhiran(penuh, hasil);
    else if (nama.endsWith(".tsx")) hasil.push(penuh);
  }
  return hasil;
}

describe("tabel responsif (Tahap 3)", () => {
  it("delapan tabel lebar memakai TabelResponsif", () => {
    for (const berkas of DAFTAR_TABEL) {
      const isi = readFileSync(berkas, "utf8");
      expect(isi, `${berkas} harus memakai TabelResponsif`).toContain("TabelResponsif");
    }
  });

  it("tidak ada lagi <table> dengan min-w tetap di app dan features", () => {
    for (const dir of ["app", "features"]) {
      for (const berkas of jalurTsxAkhiran(dir)) {
        const isi = readFileSync(berkas, "utf8");
        const cocok = isi.match(/<table[^>]*className="[^"]*min-w-\[/);
        expect(cocok, `${berkas} masih punya tabel min-w tetap`).toBeNull();
      }
    }
  });

  it("TabelResponsif memakai hidden sm:block untuk tabel dan sm:hidden untuk kartu", () => {
    const isi = readFileSync("components/tabel-responsif.tsx", "utf8");
    expect(isi).toContain('className="hidden overflow-x-auto sm:block"');
    expect(isi).toContain('"space-y-3 sm:hidden"');
    // ADR 0013: kartu siku, tanpa rounded
    expect(isi).not.toMatch(/rounded-/);
  });

  it("kedua tampilan dibangun dari array baris yang sama (tidak ada kolom hilang)", () => {
    const isi = readFileSync("components/tabel-responsif.tsx", "utf8");
    // tabel dan kartu keduanya memetakan `baris.map`
    const jumlahPemetaan = (isi.match(/baris\.map\(/g) ?? []).length;
    expect(jumlahPemetaan).toBe(2);
    // kartu memakai label kolom yang sama
    expect(isi).toContain("kolom[i + 1]");
  });
});

describe("target sentuh 44px (Tahap 4)", () => {
  it("tombol h-8/h-7 punya versi h-11 di layar kecil", () => {
    for (const berkas of TOMBOL_KECIL) {
      const isi = readFileSync(berkas, "utf8");
      expect(isi, `${berkas} harus punya h-11 untuk sentuh`).toContain("h-11");
      expect(isi).toMatch(/h-11[^"]*sm:h-/);
    }
  });
});
