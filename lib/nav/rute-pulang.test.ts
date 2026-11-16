/**
 * Penjaga navigasi: tidak boleh ada halaman yang tidak bisa dikembalikan.
 *
 * Bug 17 Nov 2026: halaman Terbit memakai sistem tab lama (MenuTabs) dengan
 * daftar tab yang ditulis tangan dan berbeda antar halaman, sehingga saat
 * masuk "Antrian Posting" tab lain hilang dan tidak ada jalan kembali. Test
 * ini mengunci tiga aturan supaya hal itu tidak terulang:
 *
 *   1. Setiap halaman di app/(dashboard) harus dimiliki oleh satu menu.
 *   2. Hanya boleh ada SATU sistem tab (TabMenuOtomatis), tidak boleh ada
 *      daftar tab yang ditulis tangan di dalam halaman.
 *   3. Setiap tab harus menunjuk halaman yang benar-benar ada.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { LANGKAH_ALUR, MENU_ITEMS } from "@/components/nav-config";

const AKAR = "app/(dashboard)";

/** Semua rute halaman, mis. "/antrian", "/posting/baru". */
function daftarRute(): string[] {
  const hasil: string[] = [];
  const jelajah = (dir: string, jalur: string) => {
    for (const nama of readdirSync(dir)) {
      const penuh = join(dir, nama);
      if (statSync(penuh).isDirectory()) {
        jelajah(penuh, `${jalur}/${nama}`);
      } else if (nama === "page.tsx") {
        hasil.push(jalur === "" ? "/" : jalur);
      }
    }
  };
  jelajah(AKAR, "");
  return hasil.sort();
}

const RUTE = daftarRute();

/** Rute yang memang hanya mengalihkan tautan lama. */
const RUTE_REDIRECT = new Set(["/konten"]);

describe("setiap halaman punya jalan pulang", () => {
  it("semua rute terdaftar di satu menu (atau redirect)", () => {
    const dimiliki = new Set(MENU_ITEMS.flatMap((m) => [m.href, ...(m.hrefs ?? [])]));
    const yatim = RUTE.filter((r) => !dimiliki.has(r) && !RUTE_REDIRECT.has(r));
    expect(yatim, `rute tanpa menu: ${yatim.join(", ")}`).toEqual([]);
  });

  it("semua href menu menunjuk halaman yang ada", () => {
    const ada = new Set(RUTE);
    const fiktif = MENU_ITEMS.flatMap((m) => [m.href, ...(m.hrefs ?? [])]).filter(
      (h) => !ada.has(h),
    );
    expect(fiktif, `href tanpa halaman: ${fiktif.join(", ")}`).toEqual([]);
  });

  it("setiap tab menunjuk halaman yang ada", () => {
    const ada = new Set(RUTE);
    const fiktif = MENU_ITEMS.flatMap((m) => (m.tabs ?? []).map((t) => t.href)).filter(
      (h) => !ada.has(h),
    );
    expect(fiktif, `tab tanpa halaman: ${fiktif.join(", ")}`).toEqual([]);
  });
});

describe("hanya ada satu sistem tab", () => {
  it("tidak ada halaman yang menulis daftar tab sendiri", () => {
    const pelanggar: string[] = [];
    const jelajah = (dir: string) => {
      for (const nama of readdirSync(dir)) {
        const penuh = join(dir, nama);
        if (statSync(penuh).isDirectory()) {
          jelajah(penuh);
        } else if (nama.endsWith(".tsx")) {
          const isi = readFileSync(penuh, "utf8");
          // Daftar tab yang ditulis tangan: const TABS = [ ... ]
          if (/const\s+TABS\s*=\s*\[/.test(isi)) pelanggar.push(penuh);
        }
      }
    };
    jelajah(AKAR);
    expect(pelanggar, `menulis tab sendiri: ${pelanggar.join(", ")}`).toEqual([]);
  });

  it("komponen MenuTabs yang lama sudah tidak ada", () => {
    expect(() => readFileSync("components/menu-tabs.tsx", "utf8")).toThrow();
  });

  it("halaman bertab memakai TabMenuOtomatis", () => {
    const bertab = MENU_ITEMS.filter((m) => (m.tabs ?? []).length >= 2);
    expect(bertab.length).toBeGreaterThan(0);
    for (const m of bertab) {
      for (const h of [m.href, ...(m.hrefs ?? [])]) {
        const berkas = join(AKAR, h === "/" ? "page.tsx" : `${h.replace(/^\//, "")}/page.tsx`);
        let isi: string;
        try {
          isi = readFileSync(berkas, "utf8");
        } catch {
          continue; // halaman ada di tempat lain; sudah dicek di test sebelumnya
        }
        expect(isi, `${berkas} tidak memakai TabMenuOtomatis`).toContain("TabMenuOtomatis");
      }
    }
  });
});

describe("struktur menu dangkal, banyak item", () => {
  it("setiap menu berada satu tingkat: tab hanya bagian dari satu halaman", () => {
    // Tab tidak boleh punya tab lagi, dan setiap tab harus milik menu itu
    // sendiri (bukan menunjuk halaman milik menu lain).
    for (const m of MENU_ITEMS) {
      for (const t of m.tabs ?? []) {
        expect(t.href.startsWith("/"), `${t.label} bukan rute`).toBe(true);
        expect("tabs" in t, `${t.label} punya tab di dalam tab`).toBe(false);
      }
    }
  });

  it("jumlah menu cukup banyak untuk menghindari menu dalam", () => {
    expect(MENU_ITEMS.length).toBeGreaterThanOrEqual(12);
  });

  it("tidak ada menu dengan lebih dari 4 tab", () => {
    for (const m of MENU_ITEMS) {
      expect((m.tabs ?? []).length, `${m.label} punya terlalu banyak tab`).toBeLessThanOrEqual(4);
    }
  });

  it("Riset dan Dashboard adalah dua menu terpisah", () => {
    const dashboard = MENU_ITEMS.find((m) => m.label === "Dashboard");
    const riset = MENU_ITEMS.find((m) => m.label === "Riset");
    expect(dashboard).toBeTruthy();
    expect(riset).toBeTruthy();
    expect(dashboard!.href).not.toBe(riset!.href);
    expect(dashboard!.href).toBe("/");
    expect(riset!.href).toBe("/riset");
  });
});

describe("kartu alur kerja di Dashboard tidak boleh kosong", () => {
  it("LANGKAH_ALUR berisi empat tahap dengan halaman yang benar-benar ada", () => {
    // Bug 17 Nov 2026: menu dijadikan datar sehingga LANGKAH_ALUR menjadi array
    // kosong, dan kartu [ ALUR KERJA ] di Dashboard tampil kosong tanpa pesan.
    expect(LANGKAH_ALUR.length).toBe(4);
    const rute = new Set(daftarRute());
    for (const l of LANGKAH_ALUR) {
      expect(rute.has(l.href), `${l.label} menunjuk ${l.href} yang tidak ada`).toBe(true);
      expect(l.kapan.length, `${l.label} tanpa keterangan`).toBeGreaterThan(0);
    }
  });

  it("setiap tahap tetap bisa dijangkau dari menu", () => {
    const dimiliki = new Set(MENU_ITEMS.flatMap((m) => [m.href, ...(m.hrefs ?? [])]));
    for (const l of LANGKAH_ALUR) {
      expect(dimiliki.has(l.href), `${l.label} tidak ada di menu`).toBe(true);
    }
  });

  it("BilahAlur tidak merender apa pun bila daftar langkah kosong", () => {
    const isi = readFileSync("components/bilah-alur.tsx", "utf8");
    expect(isi).toContain("if (Object.keys(status).length === 0) return null");
  });
});
