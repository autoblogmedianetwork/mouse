import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  GAYA_PERSONA,
  HARI_KIT,
  LABEL_BUTUH_PENGALAMAN,
  LABEL_ILUSTRASI,
  bodyAI,
  bolehSalin,
  isiTemplate,
  masihAdaKolomKosong,
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

describe("gerbang pengalaman (anti-cerita karangan)", () => {
  const hari = (id: number) => HARI_KIT.find((h) => h.id === id)!;

  it("hanya Hari 2, 3, dan 6 yang butuh pengalaman", () => {
    const butuh = HARI_KIT.filter((h) => h.butuhPengalaman).map((h) => h.id);
    expect(butuh).toEqual([2, 3, 6]);
  });

  it("instruksi hari bercerita melarang mengarang dan menyisakan kolom kosong", () => {
    for (const id of [2, 3, 6]) {
      const teks = hari(id).instruksi;
      expect(teks).toContain("JANGAN mengarang");
      expect(teks).toMatch(/tulis sendiri/i);
      expect(teks).toContain("APA ADANYA");
    }
  });

  it("masihAdaKolomKosong menangkap kurung siku yang belum diisi", () => {
    const isi = ["Pembuka.", "[tulis sendiri: apa yang terjadi]", "Penutup."].join(String.fromCharCode(10));
    const contoh = isi;
    expect(masihAdaKolomKosong(contoh)).toBe(true);
    expect(masihAdaKolomKosong("(ceritakan kebiasaan lamamu yang keliru)")).toBe(true);
    expect(masihAdaKolomKosong("Cerita sudah lengkap tanpa kolom.")).toBe(false);
  });

  it("hari bercerita terkunci walau sudah dicentang bila masih ada kolom kosong", () => {
    const hasil = bolehSalin(hari(3), "Saya pernah beli [tulis sendiri: apa].", true);
    expect(hasil.boleh).toBe(false);
    expect(hasil.alasan).toContain("[...]");
  });

  it("hari bercerita terkunci bila user belum mencentang", () => {
    const hasil = bolehSalin(hari(3), "Cerita lengkap tanpa kolom kosong.", false);
    expect(hasil.boleh).toBe(false);
    expect(hasil.alasan).toContain("kamu alami sendiri");
  });

  it("hari bercerita boleh disalin setelah dicentang dan kolom terisi", () => {
    expect(bolehSalin(hari(3), "Cerita lengkap tanpa kolom kosong.", true).boleh).toBe(true);
  });

  it("hari non-pengalaman boleh disalin tanpa centang", () => {
    for (const id of [1, 4, 5, 7]) {
      expect(bolehSalin(hari(id), "Teks bersih tanpa kolom.", false).boleh).toBe(true);
    }
  });

  it("label ilustrasi dan label pengalaman tersedia untuk UI", () => {
    expect(LABEL_ILUSTRASI).toContain("bukan pengalaman nyata");
    expect(LABEL_BUTUH_PENGALAMAN).toContain("kejadian asli");
  });
});

describe("gaya antarmuka Branding Akun", () => {
  const baca = (): string => readFileSync("features/branding/branding-kit.tsx", "utf8");

  it("tidak memakai sudut membulat (aplikasi ini bersudut tajam)", () => {
    // ADR 0013: --radius-chrome 0px. Komponen lain tidak memakai rounded-*.
    expect(baca()).not.toMatch(/rounded-(full|md|lg|xl|sm|none)/);
  });

  it("tidak memakai emoji hiasan di label tombol", () => {
    // Centang "Tersalin" (U+2713) adalah penanda status, bukan hiasan, jadi
    // dikecualikan. Emoji dekoratif seperti pena, kilau, dan segitiga
    // peringatan tidak boleh muncul.
    const isi = baca().replace(/\u2713/g, "");
    const hiasan = /[\u{1F300}-\u{1FAFF}\u{2700}-\u{27BF}\u{2B00}-\u{2BFF}]/u;
    expect(hiasan.test(isi), "ada emoji hiasan di branding-kit.tsx").toBe(false);
  });

  it("label tombol mode pendek supaya tidak meluber di layar 360px", () => {
    const isi = baca();
    expect(isi).toContain("Tulis sendiri");
    expect(isi).toContain("Buat dengan AI");
    expect(isi).not.toContain("Tulis sendiri (template)");
  });

  it("dua tombol mode ditumpuk di layar sempit, bukan dipaksa sebaris", () => {
    expect(baca()).toContain("grid-cols-1 gap-2 sm:grid-cols-2");
  });

  it("tombol memenuhi tinggi sentuh 44px", () => {
    const isi = baca();
    expect(isi).not.toMatch(/\bh-10\b/);
    expect(isi).toContain("min-h-11");
  });
});
