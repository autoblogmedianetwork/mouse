/**
 * Zod schemas for every AI output (AGENTS rule 6) and for the generate
 * settings shared by the UI form and the API routes.
 */
import { z } from "zod";
import { PERSONA_BAWAAN, normalkanPersonaId } from "@/lib/ai/persona";
import { MAX_STATUS_LENGTH, charLength } from "@/lib/statuses/validator-500";

export const FORMAT_LABELS = [
  "Listicle",
  "Checklist",
  "Storytelling",
  "Perbandingan",
  "Problem-Solution",
  "Tutorial",
] as const;

/* ----------------------------- Prompt 1: analisis ----------------------------- */

export const analisisSkema = z.object({
  ringkasan: z.string(),
  fitur: z.array(z.string()),
  target_audiens: z.array(z.string()),
  angle: z.array(z.object({ judul: z.string(), alasan: z.string() })),
  klaim_perlu_cek: z.array(z.string()),
  confidence: z.enum(["tinggi", "sedang", "rendah"]),
  catatan: z.string().nullable(),
});

export type Analisis = z.infer<typeof analisisSkema>;

/* ------------------------------- Prompt 2: ide -------------------------------- */

export const ideSkema = z.object({
  ide: z
    .array(
      z.object({
        judul: z.string(),
        deskripsi: z.string(),
        jembatan: z.string(),
        format_label: z.enum(FORMAT_LABELS),
      }),
    )
    .length(10, "Prompt 2 wajib menghasilkan tepat 10 ide (PRD F2)"),
});

export const ideItemSkema = z.object({
  judul: z.string().min(1),
  deskripsi: z.string().min(1),
  jembatan: z.string().min(1),
  format_label: z.enum(FORMAT_LABELS),
});

export type Ide = z.infer<typeof ideItemSkema>;
export type IdeBatch = z.infer<typeof ideSkema>;

/* ----------------------------- Prompt 3: generate ----------------------------- */

/** Status range per "jumlah status" setting (PRD F3). */
export const BATAS_JUMLAH = {
  pendek: { min: 3, max: 5 },
  menengah: { min: 6, max: 11 },
  panjang: { min: 12, max: 20 },
} as const;

export const pengaturanSkema = z.object({
  jumlah_status: z.enum(["pendek", "menengah", "panjang"]),
  panjang_status: z.enum(["singkat", "sedang", "panjang"]),
  instruksi: z.string(),
  anti_ai_slop: z.boolean(),
  // Persona id from lib/ai/persona.ts; legacy labels ("Bawaan", "Ahli") from
  // drafts saved before that module existed are normalized to an id here.
  persona: z.string().transform((nilai) => normalkanPersonaId(nilai)),
  gaya_hook: z.enum(["pertanyaan", "masalah_relatif", "pernyataan_mengejutkan", "bawaan"]),
  aturan_kepercayaan: z.boolean(),
  letak_link: z.enum(["status_terakhir", "balasan", "tanpa_link"]),
});

export type Pengaturan = z.infer<typeof pengaturanSkema>;

export const PENGATURAN_AWAL: Pengaturan = {
  jumlah_status: "menengah",
  panjang_status: "sedang",
  instruksi: "",
  anti_ai_slop: true,
  persona: PERSONA_BAWAAN.id,
  gaya_hook: "bawaan",
  aturan_kepercayaan: true,
  letak_link: "balasan",
};

/**
 * Schema for one generated content. Enforces the hard 500-character limit
 * (AGENTS rule 7) and the requested status count so a bad answer triggers
 * the automatic retry inside generateJSON before it ever reaches the UI.
 */
export function statusesSkema(batas: { min: number; max: number }) {
  return z.object({
    statuses: z
      .array(
        z
          .string()
          .refine((s) => s.trim().length > 0, "ada status kosong")
          .refine((s) => charLength(s) <= MAX_STATUS_LENGTH, "status melebihi 500 karakter"),
      )
      .min(batas.min, `minimal ${batas.min} status`)
      .max(batas.max, `maksimal ${batas.max} status`),
  });
}

/* --------------------------- Request bodies (API) ----------------------------- */

export const analisisRequestSkema = z.object({
  deskripsi: z.string().min(1, "Deskripsi wajib diisi"),
  nama: z.string().optional(),
  varian: z.string().optional(),
  harga: z.string().optional(),
});

export const ideRequestSkema = z.object({
  namaProduk: z.string().min(1),
  ringkasan: z.string().min(1),
  fitur: z.array(z.string()).default([]),
  target_audiens: z.array(z.string()).default([]),
  angle: z.array(z.object({ judul: z.string(), alasan: z.string() })).default([]),
});

export const generateRequestSkema = z.object({
  namaProduk: z.string().min(1),
  ringkasan: z.string().min(1),
  fitur: z.array(z.string()).default([]),
  ide: ideItemSkema,
  pengaturan: pengaturanSkema,
  link: z.string().optional(),
});
