import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Penjaga judul bagian Lab.
 *
 * Dari 18 bagian Lab, 15 memakai judul polos. Tiga kartu Lab Iklan sempat
 * memakai emoji di judulnya dan itu membuatnya terbaca seperti tempelan dari
 * aplikasi lain. Aplikasi ini memang punya satu-dua emoji di tempat lain
 * (mis. penanda hasil kemenangan), tetapi judul bagian bukan tempatnya.
 */
const DIR = join(process.cwd(), "features", "lab");
const berkas = readdirSync(DIR).filter((f) => f.endsWith(".tsx"));

function mengandungPiktograf(teks: string): string | null {
  for (const ch of teks) {
    const cp = ch.codePointAt(0) ?? 0;
    if (cp >= 0x1f300 && cp <= 0x1faff) return ch;
    if (cp >= 0x2600 && cp <= 0x26ff) return ch;
    if (cp >= 0x2700 && cp <= 0x27bf) return ch;
  }
  return null;
}

describe("judul bagian Lab", () => {
  it("tidak ada emoji di dalam <h2> maupun <h3>", () => {
    const pelanggaran: string[] = [];
    for (const nama of berkas) {
      const isi = readFileSync(join(DIR, nama), "utf8");
      for (const m of isi.matchAll(/<h[23][^>]*>([^<]*)</g)) {
        const emoji = mengandungPiktograf(m[1]);
        if (emoji) pelanggaran.push(`${nama}: "${m[1].trim()}" (${emoji})`);
      }
    }
    expect(pelanggaran, `judul beremoji:\n${pelanggaran.join("\n")}`).toEqual([]);
  });
});
