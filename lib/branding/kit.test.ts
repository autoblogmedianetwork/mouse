import { describe, expect, it } from "vitest";
import {
  GAYA_PERSONA,
  HARI_KIT,
  bodyAI,
  isiTemplate,
} from "./kit";

const data = {
  nama: "Pak Slem",
  detailHidup: "kandang ayam di belakang rumah",
  niche: "barang praktis rumah tangga",
};

describe("branding kit", () => {
  it("memiliki 7 hari dengan id unik", () => {
    expect(HARI_KIT).toHaveLength(7);
    expect(new Set(HARI_KIT.map((h) => h.id)).size).toBe(7);
    for (const hari of HARI_KIT) {
      expect(hari.judul.length).toBeGreaterThan(0);
      expect(hari.tugas.length).toBeGreaterThan(0);
      expect(hari.template.length).toBeGreaterThan(0);
      expect(hari.instruksi.length).toBeGreaterThan(0);
    }
  });

  it("isiTemplate mengganti semua placeholder", () => {
    const hasil = isiTemplate("[nama] suka [niche], rutinitasnya [detail_hidup]", data);
    expect(hasil).toBe(
      "Pak Slem suka barang praktis rumah tangga, rutinitasnya kandang ayam di belakang rumah",
    );
  });

  it("placeholder tanpa data dibiarkan terlihat", () => {
    const kosong = { nama: "", detailHidup: "", niche: "" };
    const hasil = isiTemplate("Halo [nama], soal [niche]", kosong);
    expect(hasil).toBe("Halo [nama], soal [niche]");
  });

  it("hanya Hari 1 yang menyebut nama di template; Hari 2-7 tidak", () => {
    for (const hari of HARI_KIT) {
      const berisiNama = hari.template.includes("[nama]");
      if (hari.id === 1) expect(berisiNama).toBe(true);
      else expect(berisiNama).toBe(false);
    }
  });

  it("template manifesto muat dalam 500 karakter Threads setelah diisi", () => {
    const hari1 = HARI_KIT.find((h) => h.id === 1)!;
    expect(isiTemplate(hari1.template, data).length).toBeLessThanOrEqual(500);
  });

  it("bodyAI memakai satu status, persona bernama, tanpa link", () => {
    const hari2 = HARI_KIT.find((h) => h.id === 2)!;
    const body = bodyAI(data, hari2);
    const p = body.pengaturan as Record<string, unknown>;
    expect(p.jumlah_status).toBe("satu");
    expect(p.persona).toBe("bernama");
    expect(p.persona_nama).toBe("Pak Slem");
    expect(p.letak_link).toBe("tanpa_link");
    expect(p.kerangka).toBe("cerita");
    expect(p.sertakan_disclosure).toBe(false);
    expect(p.aturan_kepercayaan).toBe(false);
  });

  it("Hari 1: kerangka bebas; Hari 2+: instruksi melarang perkenalan ulang", () => {
    const hari1 = HARI_KIT.find((h) => h.id === 1)!;
    const hari2 = HARI_KIT.find((h) => h.id === 2)!;
    expect((bodyAI(data, hari1).pengaturan as Record<string, unknown>).kerangka).toBe("bebas");
    const instruksi2 = (bodyAI(data, hari2).pengaturan as Record<string, unknown>).instruksi;
    expect(String(instruksi2)).toContain("JANGAN memperkenalkan diri");
    expect(String(instruksi2)).toContain("kandang ayam");
  });

  it("gaya persona tidak melebihi 300 karakter (batas skema)", () => {
    expect(GAYA_PERSONA.length).toBeLessThanOrEqual(300);
  });

  it("format_label valid sesuai FORMAT_LABELS", () => {
    const hari3 = HARI_KIT.find((h) => h.id === 3)!;
    const ide = bodyAI(data, hari3).ide as Record<string, unknown>;
    expect(ide.format_label).toBe("Storytelling");
  });
});
