/** Duplication rules for the content bank (UI-Spec 3.3 / 3.9). */
import { describe, expect, it } from "vitest";
import { kontenSkema, type Konten } from "./skema";
import { duplikatKonten, tandaiGagal, tandaiTerkirim } from "./store";

function kontenContoh(overrides: Partial<Konten> = {}): Konten {
  return kontenSkema.parse({
    id: "asal",
    judul: "Judul asal",
    statuses: ["Status asal."],
    status: "siap_posting",
    letak_link: "tanpa_link",
    otomatis: true,
    skor: 88,
    checklist: { produk: true, klaim: true, kekurangan: true, link: true, disclosure: true },
    created_at: "2026-10-01T00:00:00.000Z",
    updated_at: "2026-10-01T00:00:00.000Z",
    ...overrides,
  });
}

describe("duplikatKonten", () => {
  it("menjadikan salinan sebagai draft baru", () => {
    const salinan = duplikatKonten(kontenContoh());
    expect(salinan.id).not.toBe("asal");
    expect(salinan.status).toBe("draft");
    expect(salinan.judul).toContain("Judul asal");
  });

  it("menghapus label otomatis dan checklist salinan", () => {
    const salinan = duplikatKonten(kontenContoh());
    expect(salinan.otomatis).toBe(false);
    expect(salinan.checklist).toEqual({});
  });

  it("mempertahankan skor ide sebagai data asal", () => {
    expect(duplikatKonten(kontenContoh()).skor).toBe(88);
  });
});

describe("tandaiTerkirim & tandaiGagal (Fase 7)", () => {
  it("menandai konten yang berhasil terkirim", () => {
    const hasil = tandaiTerkirim([kontenContoh()], "asal");
    expect(hasil[0].status).toBe("terkirim");
  });

  it("kegagalan API tidak menghilangkan konten dari pustaka", () => {
    const asal = kontenContoh();
    const hasil = tandaiGagal([asal], "asal");
    expect(hasil).toHaveLength(1);
    expect(hasil[0].status).toBe("gagal");
    // Status kontennya tetap utuh supaya bisa disalin manual (ADR 0002).
    expect(hasil[0].statuses).toEqual(asal.statuses);
  });

  it("tidak menyentuh konten lain", () => {
    const lain = kontenContoh({ id: "lain", status: "draft" });
    const hasil = tandaiGagal([kontenContoh(), lain], "asal");
    expect(hasil.find((k) => k.id === "lain")?.status).toBe("draft");
  });
});
