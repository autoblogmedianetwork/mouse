import { describe, expect, it } from "vitest";
import {
  PERSONA_BAWAAN,
  PERSONA_IDS,
  PERSONA_LIST,
  ambilPersona,
  labelPersonaUntukPrompt,
  normalkanPersonaId,
} from "./persona";
import { PENGATURAN_AWAL, pengaturanSkema } from "./schemas";

describe("data persona", () => {
  it("memuat tepat id yang terdaftar, tanpa duplikat", () => {
    expect(PERSONA_LIST.map((p) => p.id)).toEqual([...PERSONA_IDS]);
    expect(new Set(PERSONA_LIST.map((p) => p.id)).size).toBe(PERSONA_LIST.length);
  });

  it("setiap persona punya judul, deskripsi nada, dan ikon yang terisi", () => {
    for (const persona of PERSONA_LIST) {
      expect(persona.judul.trim().length).toBeGreaterThan(0);
      expect(persona.deskripsi_nada.trim().length).toBeGreaterThan(0);
      expect(persona.ikon.trim().length).toBeGreaterThan(0);
    }
  });

  it("persona bawaan adalah default dan ada di daftar", () => {
    expect(PERSONA_BAWAAN.id).toBe("bawaan");
    expect(PENGATURAN_AWAL.persona).toBe(PERSONA_BAWAAN.id);
    expect(PERSONA_LIST[0]).toEqual(PERSONA_BAWAAN);
  });
});

describe("normalkanPersonaId", () => {
  it("menerima id yang sudah benar", () => {
    for (const id of PERSONA_IDS) {
      expect(normalkanPersonaId(id)).toBe(id);
    }
  });

  it("menerima label lama dari draf yang tersimpan sebelum persona jadi data", () => {
    expect(normalkanPersonaId("Bawaan")).toBe("bawaan");
    expect(normalkanPersonaId("Sahabat")).toBe("sahabat");
    expect(normalkanPersonaId("Ahli")).toBe("ahli");
  });

  it("mengabaikan spasi dan besar-kecil huruf", () => {
    expect(normalkanPersonaId("  aHLi ")).toBe("ahli");
  });

  it("jatuh ke bawaan untuk nilai kosong, null, atau tidak dikenal", () => {
    expect(normalkanPersonaId("")).toBe("bawaan");
    expect(normalkanPersonaId("   ")).toBe("bawaan");
    expect(normalkanPersonaId(null)).toBe("bawaan");
    expect(normalkanPersonaId(undefined)).toBe("bawaan");
    expect(normalkanPersonaId("persona gaib")).toBe("bawaan");
  });

  it("tidak melempar error untuk nilai tidak dikenal", () => {
    expect(() => ambilPersona("persona gaib")).not.toThrow();
    expect(ambilPersona("persona gaib")).toEqual(PERSONA_BAWAAN);
  });

  it("mengembalikan persona sesuai id", () => {
    expect(ambilPersona("ahli").judul).toBe("Ahli");
    expect(ambilPersona("Sahabat").id).toBe("sahabat");
  });

  it("label prompt memuat judul dan deskripsi nada", () => {
    const label = labelPersonaUntukPrompt("sahabat");
    expect(label).toContain("Sahabat");
    expect(label).toContain(ambilPersona("sahabat").deskripsi_nada);
  });
});

describe("pengaturanSkema persona", () => {
  it("menormalkan label lama saat pengaturan divalidasi", () => {
    const hasil = pengaturanSkema.parse({ ...PENGATURAN_AWAL, persona: "Ahli" });
    expect(hasil.persona).toBe("ahli");
  });

  it("membiarkan id yang sudah benar", () => {
    const hasil = pengaturanSkema.parse({ ...PENGATURAN_AWAL, persona: "sahabat" });
    expect(hasil.persona).toBe("sahabat");
  });

  it("menolak persona bukan string", () => {
    const hasil = pengaturanSkema.safeParse({ ...PENGATURAN_AWAL, persona: 5 });
    expect(hasil.success).toBe(false);
  });
});
