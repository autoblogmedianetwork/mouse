/**
 * Ide manual (PRD F1 "input manual selalu tersedia", AGENTS rule 5).
 *
 * Step 3 of Buat posting used to accept ideas only from the AI call, so when
 * GEMINI_API_KEY was missing the flow dead-locked behind "Pilih minimal satu
 * ide". This builds the same Ide shape the rest of the flow expects, validated
 * with Zod (AGENTS rule 9).
 */
import { z } from "zod";
import { FORMAT_LABELS, ideItemSkema, type Ide } from "@/lib/ai/schemas";

export const ideManualSkema = z.object({
  judul: z.string().min(1, "Judul ide wajib diisi."),
  deskripsi: z.string().optional(),
  format_label: z.enum(FORMAT_LABELS).optional(),
});

export type IdeManualInput = z.input<typeof ideManualSkema>;

/** Shown in the generate prompt so the model knows the angle was hand-written. */
export const JEMBATAN_IDE_MANUAL = "Ditulis manual tanpa AI; sesuaikan dengan produk.";

export const DESKRIPSI_IDE_MANUAL =
  "Ide manual — tulis urutan status sendiri di editor bila generate AI tidak tersedia.";

export type BuatIdeManualResult =
  | { ok: true; ide: Ide }
  | { ok: false; error: string };

/**
 * Bangun objek Ide dari input user. Selalu mengembalikan objek yang lolos
 * `ideItemSkema`, jadi langkah generate dan preview tidak perlu tahu asal ide
 * ini.
 */
export function buatIdeManual(input: IdeManualInput): BuatIdeManualResult {
  const parsed = ideManualSkema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Input ide manual tidak valid.",
    };
  }

  const judul = parsed.data.judul.trim();
  if (!judul) {
    return { ok: false, error: "Judul ide wajib diisi." };
  }

  const deskripsi = parsed.data.deskripsi?.trim();
  const hasil = ideItemSkema.safeParse({
    judul,
    deskripsi: deskripsi ? deskripsi : DESKRIPSI_IDE_MANUAL,
    jembatan: JEMBATAN_IDE_MANUAL,
    format_label: parsed.data.format_label ?? "Problem-Solution",
  });

  if (!hasil.success) {
    return {
      ok: false,
      error: hasil.error.issues[0]?.message ?? "Ide manual tidak lolos validasi.",
    };
  }

  return { ok: true, ide: hasil.data };
}
