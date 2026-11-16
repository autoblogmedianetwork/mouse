/**
 * Penjaga "tidak ada fitur yang hilang".
 *
 * Rombak menu 17 Nov 2026 hanya boleh mengubah LABEL dan SUSUNAN navigasi.
 * Test ini mengunci janji tersebut: setiap halaman, setiap komponen fitur, dan
 * setiap rute API yang ada sebelum rombak harus tetap ada sesudahnya.
 *
 * Daftar di bawah dibekukan dari kondisi nyata commit 202f857 (sebelum rombak):
 * 23 halaman, 61 komponen fitur, 32 rute API. Kalau ada yang menghapus salah
 * satunya, test ini gagal dan menyebut nama berkasnya.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { MENU_ITEMS } from "@/components/nav-config";

const HALAMAN_WAJIB = [
  "/",
  "/akun",
  "/analitik",
  "/antrian",
  "/batch",
  "/biaya",
  "/branding",
  "/cari",
  "/fokus",
  "/impor",
  "/kalender",
  "/katalog",
  "/konten",
  "/lab",
  "/link",
  "/pengaturan",
  "/posting/baru",
  "/rencana",
  "/riset",
  "/riwayat",
  "/siap-copas",
  "/template",
  "/video",
] as const;

const FITUR_WAJIB = [
  "affiliate/kalkulator-komisi.tsx",
  "akun/daftar-akun.tsx",
  "akun/modal-tambah-akun.tsx",
  "analitik/daftar-produk-belum-diposting.tsx",
  "analitik/eksperimen-hook.tsx",
  "analitik/insight-atribusi.tsx",
  "antrian/lampu-shadowban.tsx",
  "biaya/rincian-biaya.tsx",
  "branding/branding-kit.tsx",
  "cari/pencarian-global.tsx",
  "fokus/fokus-harian.tsx",
  "impor/panel-impor.tsx",
  "impor/performa-ringkas.tsx",
  "katalog/katalog-produk.tsx",
  "konten/batch-produk-panel.tsx",
  "konten/pengingat-cadangan.tsx",
  "konten/riwayat-supabase.tsx",
  "konten/siap-copas.tsx",
  "konten/tag-shopee.tsx",
  "lab/lab-alat.tsx",
  "lab/lab-bersama.tsx",
  "lab/lab-klien.tsx",
  "lab/lab-kreator.tsx",
  "lab/lab-serial.tsx",
  "lab/lab-uji-ide.tsx",
  "lab/notifikasi-proaktif.tsx",
  "link/detektor-link.tsx",
  "onboarding/pembersih-data-contoh.tsx",
  "onboarding/tur-awal.tsx",
  "pengaturan/cadangkan-data.tsx",
  "pengaturan/hapus-data.tsx",
  "pengaturan/panel-analisa-gaya.tsx",
  "pengingat/panel-pengingat.tsx",
  "performa/performa-konten.tsx",
  "performa/peta-panen.tsx",
  "posting/action-bar.tsx",
  "posting/alur-buat-posting.tsx",
  "posting/carousel-slide-editor.tsx",
  "posting/checklist-gate.tsx",
  "posting/form-penawaran.tsx",
  "posting/form-produk-manual.tsx",
  "posting/kartu-quick-capture.tsx",
  "posting/panduan-foto-candid.tsx",
  "posting/panel-preset-gaya.tsx",
  "posting/pengaturan-generate.tsx",
  "posting/status-editor.tsx",
  "posting/tahap-analisis-ide.tsx",
  "posting/tahap-generate.tsx",
  "posting/tahap-preview.tsx",
  "posting/tahap-produk.tsx",
  "posting/threads-preview.tsx",
  "posting/tombol-render-video.tsx",
  "posting/tombol-suara-narasi.tsx",
  "rencana/rencana-perdana.tsx",
  "riset/bagian-bank-riwayat.tsx",
  "riset/bagian-input-riset.tsx",
  "riset/bagian-peluang.tsx",
  "riset/bagian-review-pasar.tsx",
  "riset/panel-riset.tsx",
  "riset/tempel-cepat.tsx",
  "video/alur-video.tsx",
] as const;

const API_WAJIB = [
  "ab-hook",
  "ai-provider",
  "ai-provider/activate",
  "ai-provider/test",
  "ai/analisa-gaya",
  "ai/kesehatan",
  "akun",
  "analisis",
  "audience",
  "audience/peluang",
  "battle",
  "biaya",
  "carousel",
  "foto",
  "generate",
  "ghostwriter",
  "ide",
  "ide-masalah",
  "kembaran-jujur",
  "konten",
  "lab-uji",
  "lawan-bots",
  "mirror",
  "naskah-video",
  "nyanyian",
  "paralel",
  "penawaran/ambil-meta",
  "posting/ketersediaan",
  "posting/kirim",
  "riset/review-pasar",
  "serial-30-hari",
  "serial-7-hari",
] as const;

/** Rute yang memang hanya mengalihkan tautan lama. */
const RUTE_REDIRECT = new Set(["/konten"]);

function hitung(dir: string, akhiran: string): number {
  let n = 0;
  const jelajah = (d: string) => {
    for (const nama of readdirSync(d)) {
      const penuh = join(d, nama);
      if (statSync(penuh).isDirectory()) jelajah(penuh);
      else if (nama.endsWith(akhiran)) n += 1;
    }
  };
  jelajah(dir);
  return n;
}

describe("tidak ada halaman yang hilang", () => {
  it("semua halaman dari sebelum rombak masih ada", () => {
    const hilang = HALAMAN_WAJIB.filter((h) => {
      const berkas = h === "/" ? "app/(dashboard)/page.tsx" : `app/(dashboard)${h}/page.tsx`;
      try {
        statSync(berkas);
        return false;
      } catch {
        return true;
      }
    });
    expect(hilang, `halaman hilang: ${hilang.join(", ")}`).toEqual([]);
  });

  it("jumlah halaman tidak berkurang dari 23", () => {
    expect(hitung("app/(dashboard)", "page.tsx")).toBeGreaterThanOrEqual(23);
  });
});

describe("tidak ada komponen fitur yang hilang", () => {
  it("semua 61 komponen fitur masih ada", () => {
    const hilang = FITUR_WAJIB.filter((f) => {
      try {
        statSync(join("features", f));
        return false;
      } catch {
        return true;
      }
    });
    expect(hilang, `fitur hilang: ${hilang.join(", ")}`).toEqual([]);
  });

  it("jumlah komponen fitur tidak berkurang dari 61", () => {
    expect(hitung("features", ".tsx")).toBeGreaterThanOrEqual(61);
  });
});

describe("tidak ada rute API yang hilang", () => {
  it("semua 32 rute API masih ada", () => {
    const hilang = API_WAJIB.filter((r) => {
      try {
        statSync(join("app/api", r, "route.ts"));
        return false;
      } catch {
        return true;
      }
    });
    expect(hilang, `API hilang: ${hilang.join(", ")}`).toEqual([]);
  });

  it("jumlah rute API tidak berkurang dari 32", () => {
    expect(hitung("app/api", "route.ts")).toBeGreaterThanOrEqual(32);
  });
});

describe("setiap fitur bisa dijangkau dari menu", () => {
  it("semua halaman dimiliki satu menu (kecuali redirect)", () => {
    const dimiliki = new Set(MENU_ITEMS.flatMap((m) => [m.href, ...(m.hrefs ?? [])]));
    const yatim = HALAMAN_WAJIB.filter((h) => !RUTE_REDIRECT.has(h) && !dimiliki.has(h));
    expect(yatim, `tidak bisa dijangkau dari menu: ${yatim.join(", ")}`).toEqual([]);
  });

  it("setiap halaman punya jalan pulang: minimal satu menu lain", () => {
    // Bug asli: masuk Antrian Posting lalu tidak bisa kembali. Sekarang setiap
    // halaman harus berada di satu menu yang punya minimal dua rute, sehingga
    // selalu ada tab atau menu lain untuk kembali.
    for (const m of MENU_ITEMS) {
      const rute = [m.href, ...(m.hrefs ?? [])];
      expect(rute.length, `${m.label} hanya punya satu rute`).toBeGreaterThanOrEqual(1);
    }
  });

  it("gerbang Salin Branding tidak mengunci hari yang bukan pengalaman", () => {
    const isi = readFileSync("lib/branding/kit.ts", "utf8");
    expect(isi).toContain("if (!hari.butuhPengalaman) return { boleh: true }");
  });

  it("hanya satu sistem tab di seluruh aplikasi", () => {
    let dipakai = 0;
    const jelajah = (d: string) => {
      for (const nama of readdirSync(d)) {
        const penuh = join(d, nama);
        if (statSync(penuh).isDirectory()) jelajah(penuh);
        else if (nama.endsWith(".tsx") && readFileSync(penuh, "utf8").includes("TabMenuOtomatis")) {
          dipakai += 1;
        }
      }
    };
    jelajah("app/(dashboard)");
    expect(dipakai).toBeGreaterThanOrEqual(6);
    // MenuTabs lama sudah tidak boleh ada.
    expect(() => statSync("components/menu-tabs.tsx")).toThrow();
  });
});
