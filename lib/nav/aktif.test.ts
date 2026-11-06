import { describe, expect, it } from "vitest";
import { cocokRute, menuUntuk } from "./aktif";

const MENU = [
  { label: "Dashboard", href: "/", fase: "MVP" },
  { label: "Buat posting", href: "/posting/baru", fase: "MVP" },
  { label: "Analitik", href: "/analitik", hrefs: ["/impor"], fase: "Setelah M5" },
  { label: "Aset", href: "/link", hrefs: ["/template"], fase: "MVP" },
] as const;

describe("cocokRute", () => {
  it("mencocokkan root hanya secara persis", () => {
    expect(cocokRute("/", "/")).toBe(true);
    expect(cocokRute("/posting/baru", "/")).toBe(false);
  });

  it("menandai halaman turunan sebagai aktif", () => {
    expect(cocokRute("/posting/baru/123", "/posting/baru")).toBe(true);
    expect(cocokRute("/posting/baru", "/posting/baru")).toBe(true);
  });

  it("berhenti di batas segmen", () => {
    expect(cocokRute("/posting/baruan", "/posting/baru")).toBe(false);
    expect(cocokRute("/linknya", "/link")).toBe(false);
  });
});

describe("menuUntuk", () => {
  it("mengembalikan item yang memiliki rute turunan", () => {
    expect(menuUntuk("/posting/baru/123", MENU)?.label).toBe("Buat posting");
  });

  it("memakai hrefs untuk tab dalam satu bagian", () => {
    expect(menuUntuk("/template", MENU)?.label).toBe("Aset");
    expect(menuUntuk("/impor", MENU)?.label).toBe("Analitik");
  });

  it("memilih kecocokan terpanjang", () => {
    const menu = [
      { label: "Induk", href: "/posting" },
      { label: "Anak", href: "/posting/baru" },
    ];
    expect(menuUntuk("/posting/baru", menu)?.label).toBe("Anak");
  });

  it("mengembalikan null kalau tidak ada yang memiliki", () => {
    expect(menuUntuk("/entah", MENU)).toBeNull();
  });
});
