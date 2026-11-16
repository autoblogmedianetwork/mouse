/**
 * Uji struktur menu sidebar.
 *
 * Struktur dirapikan 17 Nov 2026 (lihat docs/AUDIT-MENU-BAHASA.md): empat grup
 * dengan peran jelas, label bahasa Indonesia yang tidak memakai jargon, dan
 * nomor langkah hanya dipakai di grup "alur" supaya urutannya tidak kabur.
 */
import { describe, expect, it } from "vitest";
import {
  GROUP_LABELS,
  GROUP_ORDER,
  LANGKAH_ALUR,
  MENU_ITEMS,
  labelHalaman,
  menuUntuk,
} from "@/components/nav-config";

describe("struktur menu", () => {
  it("memakai tepat empat grup dengan urutan tetap", () => {
    expect(GROUP_ORDER).toEqual(["mulai", "alur", "pantau", "sistem"]);
    for (const g of GROUP_ORDER) {
      expect(GROUP_LABELS[g]).toBeTruthy();
    }
  });

  it("setiap grup punya minimal satu menu", () => {
    for (const g of GROUP_ORDER) {
      expect(MENU_ITEMS.some((m) => m.group === g)).toBe(true);
    }
  });

  it("nomor langkah hanya dipakai di grup alur", () => {
    for (const m of MENU_ITEMS) {
      if (m.langkah !== undefined) expect(m.group).toBe("alur");
    }
  });

  it("langkah alur berurutan tanpa lompat", () => {
    expect(LANGKAH_ALUR.map((l) => l.nomor)).toEqual([1, 2, 3]);
  });

  it("tidak ada label ganda di sidebar", () => {
    const label = MENU_ITEMS.map((m) => m.label);
    expect(new Set(label).size).toBe(label.length);
  });

  it("tidak ada sub-tab dengan label ganda di satu menu", () => {
    for (const m of MENU_ITEMS) {
      const tab = (m.tabs ?? []).map((t) => t.label);
      if (tab.length === 0) continue;
      expect(new Set(tab).size).toBe(tab.length);
    }
  });
});

describe("label bahasa Indonesia, tanpa jargon lama", () => {
  const labelLama = ["copas", "Batch", "Aset", "Branding Kit", "Lab konten"];

  it("tidak memakai istilah campur bahasa yang lama", () => {
    const semua = [
      ...MENU_ITEMS.map((m) => m.label),
      ...MENU_ITEMS.flatMap((m) => (m.tabs ?? []).map((t) => t.label)),
      ...Object.values(GROUP_LABELS),
    ];
    for (const lama of labelLama) {
      const ketemu = semua.some((s) => s.toLowerCase() === lama.toLowerCase());
      expect(ketemu, `label lama "${lama}" masih dipakai`).toBe(false);
    }
  });

  it("label menu tidak memakai tanda & (pakai 'dan' atau dipisah)", () => {
    for (const m of MENU_ITEMS) {
      expect(m.label).not.toContain("&");
      for (const t of m.tabs ?? []) expect(t.label).not.toContain("&");
    }
  });

  it("label yang dipertahankan tetap ada", () => {
    const wajib = [
      "Hari Ini",
      "Branding Akun",
      "Riset",
      "Katalog",
      "Buat Konten",
      "Terbit",
      "Kalender",
      "Analitik",
      "Eksperimen",
      "Pengaturan",
    ];
    for (const w of wajib) {
      expect(MENU_ITEMS.some((m) => m.label === w), w).toBe(true);
    }
  });

  it("sub-tab Terbit memakai nama baru", () => {
    const terbit = MENU_ITEMS.find((m) => m.label === "Terbit")!;
    const tab = (terbit.tabs ?? []).map((t) => t.label);
    expect(tab).toEqual(["Siap Salin", "Antrian Posting", "Produksi Konten", "Arsip Terbit"]);
  });
});

describe("label halaman mengikuti label menu", () => {
  it("judul halaman memakai label menu yang sama", () => {
    // Kalau berbeda, user klik satu nama dan mendarat di nama lain.
    expect(labelHalaman("/siap-copas")).toBe("Terbit");
    expect(labelHalaman("/batch")).toBe("Terbit");
    expect(labelHalaman("/riwayat")).toBe("Terbit");
    expect(labelHalaman("/lab")).toBe("Eksperimen");
    expect(labelHalaman("/branding")).toBe("Branding Akun");
    expect(labelHalaman("/riset")).toBe("Riset");
    expect(labelHalaman("/link")).toBe("Pengaturan");
  });

  it("menuUntuk mengembalikan tab yang tepat", () => {
    const hasil = menuUntuk("/batch");
    expect(hasil?.item.label).toBe("Terbit");
    expect(hasil?.tab?.label).toBe("Produksi Konten");
  });

  it("Lab bukan lagi tab di dalam Buat Konten", () => {
    const buat = MENU_ITEMS.find((m) => m.label === "Buat Konten")!;
    expect((buat.tabs ?? []).some((t) => t.href === "/lab")).toBe(false);
    expect(MENU_ITEMS.some((m) => m.href === "/lab")).toBe(true);
  });
});

describe("sidebar tanpa penomoran", () => {
  it("sidebar tidak menampilkan nomor langkah sama sekali", async () => {
    // Nomor 1/2/3 dulu muncul hanya di sebagian menu (Katalog tanpa nomor),
    // sehingga terlihat timpang. Sekarang sidebar murni nama menu; urutan
    // langkah tetap tampil di BilahAlur pada halaman Hari Ini.
    const fs = await import("node:fs/promises");
    const shell = await fs.readFile("components/app-shell.tsx", "utf8");
    expect(shell).not.toContain("item.langkah");
  });

  it("BilahAlur masih memakai nomor langkah", async () => {
    const fs = await import("node:fs/promises");
    const bilah = await fs.readFile("components/bilah-alur.tsx", "utf8");
    expect(bilah).toContain("l.nomor");
  });

  it("LANGKAH_ALUR tetap berisi tiga langkah untuk bilah alur", () => {
    expect(LANGKAH_ALUR.length).toBe(3);
    for (const l of LANGKAH_ALUR) {
      expect(l.label).toBeTruthy();
      expect(l.href).toMatch(/^\//);
    }
  });
});
