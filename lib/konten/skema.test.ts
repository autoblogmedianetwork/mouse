/**
 * Antrian review rules (UI-Spec 3.9 / PRD F10): tab counts, the checklist gate
 * reused by bulk "tandai siap", and backward compatibility of stored content.
 */
import { describe, expect, it } from "vitest";
import { CHECKLIST_AWAL, checklistLengkap } from "./checklist";
import {
  TAB_REVIEW,
  bisaTandaiSiap,
  filterKonten,
  hitungTab,
  kontenSkema,
  statusDariTab,
  type Konten,
} from "./skema";

const CHECKLIST_LENGKAP = {
  ...CHECKLIST_AWAL,
  produk: true,
  klaim: true,
  kekurangan: true,
  link: true,
  disclosure: true,
};

function kontenContoh(overrides: Partial<Konten> = {}): Konten {
  return kontenSkema.parse({
    id: "c1",
    judul: "Judul uji",
    statuses: ["Status pertama."],
    status: "draft",
    letak_link: "tanpa_link",
    created_at: "2026-10-01T00:00:00.000Z",
    updated_at: "2026-10-01T00:00:00.000Z",
    ...overrides,
  });
}

describe("entri konten lama", () => {
  it("tetap lolos parse tanpa field baru", () => {
    const lama = {
      id: "lama",
      judul: "Entri lama",
      statuses: ["Status lama."],
      status: "draft",
      letak_link: "tanpa_link",
      created_at: "2026-09-01T00:00:00.000Z",
      updated_at: "2026-09-01T00:00:00.000Z",
    };
    const hasil = kontenSkema.safeParse(lama);
    expect(hasil.success).toBe(true);
    if (!hasil.success) return;
    expect(hasil.data.otomatis).toBe(false);
    expect(hasil.data.skor).toBeNull();
    expect(hasil.data.checklist).toEqual({});
  });

  it("menerima status ditolak", () => {
    expect(kontenContoh({ status: "ditolak" }).status).toBe("ditolak");
  });
});

describe("hitungTab", () => {
  it("menghitung per status dan mengabaikan yang diarsipkan", () => {
    const list = [
      kontenContoh({ id: "a", status: "draft" }),
      kontenContoh({ id: "b", status: "draft" }),
      kontenContoh({ id: "c", status: "siap_posting" }),
      kontenContoh({ id: "d", status: "terjadwal" }),
      kontenContoh({ id: "e", status: "gagal" }),
      kontenContoh({ id: "f", status: "terkirim" }),
      kontenContoh({ id: "g", status: "ditolak" }),
      kontenContoh({ id: "h", status: "draft", arsip: true }),
    ];
    expect(hitungTab(list)).toEqual({
      perlu_review: 2,
      disetujui: 1,
      terjadwal: 1,
      gagal: 1,
      terkirim: 1,
      ditolak: 1,
    });
  });

  it("punya satu tab untuk setiap status", () => {
    const nilai = hitungTab([]);
    expect(Object.keys(nilai).sort()).toEqual(
      TAB_REVIEW.map((t) => t.value).sort(),
    );
  });

  it("memetakan tab ke status yang benar", () => {
    expect(statusDariTab("perlu_review")).toBe("draft");
    expect(statusDariTab("disetujui")).toBe("siap_posting");
    expect(statusDariTab("ditolak")).toBe("ditolak");
  });
});

describe("bisaTandaiSiap", () => {
  it("menolak ketika checklist belum lengkap", () => {
    const hasil = bisaTandaiSiap(kontenContoh());
    expect(hasil.boleh).toBe(false);
    expect(hasil.alasan).toContain("Checklist");
  });

  it("mengizinkan ketika checklist lengkap dan semua status valid", () => {
    const hasil = bisaTandaiSiap(
      kontenContoh({ checklist: CHECKLIST_LENGKAP, statuses: ["Satu.", "Dua."] }),
    );
    expect(hasil.boleh).toBe(true);
  });

  it("melewatkan item kekurangan saat aturan kepercayaan mati", () => {
    const checklist = { ...CHECKLIST_LENGKAP, kekurangan: false };
    expect(bisaTandaiSiap(kontenContoh({ checklist }), true).boleh).toBe(false);
    expect(bisaTandaiSiap(kontenContoh({ checklist }), false).boleh).toBe(true);
  });

  it("menolak ketika ada status melewati 500 karakter", () => {
    // Built without parse on purpose: the schema itself already rejects this,
    // so the gate is checked against a record that somehow got stored.
    const k = {
      ...kontenContoh({ checklist: CHECKLIST_LENGKAP }),
      statuses: ["x".repeat(501)],
    } as Konten;
    const hasil = bisaTandaiSiap(k);
    expect(hasil.boleh).toBe(false);
    expect(hasil.alasan).toContain("500");
  });
});

describe("filterKonten untuk tab", () => {
  it("menampilkan hanya konten dengan status tab terpilih", () => {
    const list = [
      kontenContoh({ id: "a", status: "draft" }),
      kontenContoh({ id: "b", status: "ditolak" }),
    ];
    const hasil = filterKonten(list, { q: "", status: "ditolak", rentang: "semua" });
    expect(hasil.map((k) => k.id)).toEqual(["b"]);
  });
});

describe("checklistLengkap", () => {
  it("false untuk checklist kosong atau hilang", () => {
    expect(checklistLengkap({})).toBe(false);
    expect(checklistLengkap(undefined)).toBe(false);
  });
});
