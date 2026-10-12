import { describe, expect, it } from "vitest";
import { FORMAT_LABELS, ideItemSkema } from "@/lib/ai/schemas";
import {
  DESKRIPSI_IDE_MANUAL,
  JEMBATAN_IDE_MANUAL,
  buatIdeManual,
} from "./ide-manual";

describe("buatIdeManual", () => {
  it("membangun ide valid dari judul saja dan men-trim spasi", () => {
    const hasil = buatIdeManual({ judul: "  5 alasan tas kanvas  " });
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.ide.judul).toBe("5 alasan tas kanvas");
    expect(hasil.ide.deskripsi).toBe(DESKRIPSI_IDE_MANUAL);
    expect(hasil.ide.jembatan).toBe(JEMBATAN_IDE_MANUAL);
    expect(hasil.ide.format_label).toBe("Problem-Solution");
  });

  it("selalu menghasilkan objek yang lolos ideItemSkema", () => {
    const hasil = buatIdeManual({
      judul: "Tas kanvas untuk kuliah",
      deskripsi: "Cocok untuk mahasiswa.",
      format_label: "Listicle",
    });
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(ideItemSkema.safeParse(hasil.ide).success).toBe(true);
  });

  it("memakai deskripsi dan format yang diisi user", () => {
    const hasil = buatIdeManual({
      judul: "Bandila tahan air?",
      deskripsi: "Uji hujan deras.",
      format_label: "Tutorial",
    });
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.ide.deskripsi).toBe("Uji hujan deras.");
    expect(hasil.ide.format_label).toBe("Tutorial");
  });

  it("menolak judul kosong atau hanya spasi", () => {
    expect(buatIdeManual({ judul: "" }).ok).toBe(false);
    const spasi = buatIdeManual({ judul: "   " });
    expect(spasi.ok).toBe(false);
    if (spasi.ok) return;
    expect(spasi.error).toBe("Judul ide wajib diisi.");
  });

  it("menolak label format di luar daftar FORMAT_LABELS", () => {
    const hasil = buatIdeManual({
      judul: "Ide valid",
      // "Pengalaman" ada di prompt lama tapi tidak di FORMAT_LABELS; wajib ditolak.
      format_label: "Pengalaman" as unknown as (typeof FORMAT_LABELS)[number],
    });
    expect(hasil.ok).toBe(false);
  });
});
