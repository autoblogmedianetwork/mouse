import { describe, expect, it, vi, beforeEach } from "vitest";
import { bacaDaftar, bacaJson, hapusKunci, tulisJson } from "./kotak";

/** localStorage palsu sesuai kontrak browser (bisa gagal saat penuh). */
function pasangStorage(kandung: Record<string, string> = {}) {
  const storage = {
    getItem: (k: string) => (k in kandung ? kandung[k] : null),
    setItem: (k: string, v: string) => {
      kandung[k] = v;
    },
    removeItem: (k: string) => {
      delete kandung[k];
    },
    key: (i: number) => Object.keys(kandung)[i] ?? null,
    get length() {
      return Object.keys(kandung).length;
    },
  };
  vi.stubGlobal("window", { localStorage: storage });
  return kandung;
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("bacaJson", () => {
  it("mengembalikan bawaan di server (tanpa window)", () => {
    vi.unstubAllGlobals();
    expect(bacaJson("k", (n) => (typeof n === "string" ? n : null), "bawaan")).toBe("bawaan");
  });

  it("memvalidasi dan mengembalikan nilai yang sah", () => {
    pasangStorage({ k: JSON.stringify("halo") });
    expect(bacaJson("k", (n) => (typeof n === "string" ? n : null), "bawaan")).toBe("halo");
  });

  it("JSON rusak -> bawaan, bukan crash", () => {
    pasangStorage({ k: "{rusak" });
    expect(bacaJson("k", (n) => (typeof n === "string" ? n : null), "bawaan")).toBe("bawaan");
  });

  it("nilai ditolak validasi -> bawaan", () => {
    pasangStorage({ k: JSON.stringify(123) });
    expect(bacaJson("k", (n) => (typeof n === "string" ? n : null), "bawaan")).toBe("bawaan");
  });

  it("kunci tidak ada -> bawaan", () => {
    pasangStorage();
    expect(bacaJson("tak-ada", () => null, 7)).toBe(7);
  });
});

describe("bacaDaftar", () => {
  const angkaSah = (n: unknown) => (typeof n === "number" ? n : null);

  it("membuang entri yang gagal validasi, bukan crash", () => {
    pasangStorage({ d: JSON.stringify([1, "x", 3, null, 5]) });
    expect(bacaDaftar("d", angkaSah)).toEqual([1, 3, 5]);
  });

  it("isi bukan array -> kosong", () => {
    pasangStorage({ d: JSON.stringify({ a: 1 }) });
    expect(bacaDaftar("d", angkaSah)).toEqual([]);
  });

  it("JSON rusak -> kosong", () => {
    pasangStorage({ d: "[" });
    expect(bacaDaftar("d", angkaSah)).toEqual([]);
  });
});

describe("tulisJson & hapusKunci", () => {
  it("menulis dan membaca kembali", () => {
    const kandung = pasangStorage();
    tulisJson("k", { a: 1 });
    expect(JSON.parse(kandung.k)).toEqual({ a: 1 });
  });

  it("storage penuh tidak melempar error", () => {
    const kandung = pasangStorage();
    vi.stubGlobal("window", {
      localStorage: {
        ...{ getItem: () => null, removeItem: () => {}, length: 0, key: () => null },
        setItem: () => {
          throw new Error("QuotaExceededError");
        },
      },
    });
    expect(() => tulisJson("k", 1)).not.toThrow();
    expect(kandung.k).toBeUndefined();
  });

  it("hapusKunci menghapus dan tidak melempar di server", () => {
    const kandung = pasangStorage({ k: "1" });
    hapusKunci("k");
    expect(kandung.k).toBeUndefined();
    vi.unstubAllGlobals();
    expect(() => hapusKunci("k")).not.toThrow();
  });
});
