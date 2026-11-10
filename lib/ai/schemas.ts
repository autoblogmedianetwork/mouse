/**
 * Zod schemas for every AI output (AGENTS rule 6) and for the generate
 * settings shared by the UI form and the API routes.
 */
import { z } from "zod";
import { PERSONA_BAWAAN, normalkanPersonaId } from "@/lib/ai/persona";
import { KERANGKA_IDS } from "@/lib/ai/kerangka";
import { MAX_STATUS_LENGTH, charLength } from "@/lib/statuses/validator-500";
import { MODE_OUTPUT_IDS } from "@/lib/platforms/batas";

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
  // Mode output (fitur 9): Threads (500 karakter), X (280), atau naskah video
  // (prompt 09, dienerate lewat /api/naskah-video). Draf lama tanpa kolom ini
  // otomatis mendapat "threads".
  mode_output: z.enum(MODE_OUTPUT_IDS).default("threads"),
  jumlah_status: z.enum(["pendek", "menengah", "panjang"]),
  panjang_status: z.enum(["singkat", "sedang", "panjang"]),
  instruksi: z.string(),
  anti_ai_slop: z.boolean(),
  // Persona id from lib/ai/persona.ts; legacy labels ("Bawaan", "Ahli") from
  // drafts saved before that module existed are normalized to an id here.
  persona: z.string().transform((nilai) => normalkanPersonaId(nilai)),
  // Urutan isi konten (lib/ai/kerangka.ts). Sengaja dipisah dari gaya_hook:
  // hook mengatur pembuka, kerangka mengatur alur. "bebas" = tidak dipaksakan,
  // sehingga draf lama dan perilaku prompt sebelumnya tidak berubah.
  kerangka: z.enum(KERANGKA_IDS).default("bebas"),
  gaya_hook: z.enum([
    "pertanyaan",
    "masalah_relatif",
    "pernyataan_mengejutkan",
    "curiosity_gap",
    "before_after",
    "contrarian",
    "bawaan",
  ]),
  aturan_kepercayaan: z.boolean(),
  letak_link: z.enum(["status_terakhir", "balasan", "tanpa_link"]),
  sertakan_disclosure: z.boolean().default(true),
});

export type Pengaturan = z.infer<typeof pengaturanSkema>;

export const PENGATURAN_AWAL: Pengaturan = {
  mode_output: "threads",
  jumlah_status: "menengah",
  panjang_status: "sedang",
  instruksi: "",
  anti_ai_slop: true,
  persona: PERSONA_BAWAAN.id,
  kerangka: "bebas",
  gaya_hook: "bawaan",
  aturan_kepercayaan: true,
  letak_link: "balasan",
  sertakan_disclosure: true,
};

/**
 * Schema for one generated content. Enforces the hard character limit
 * (AGENTS rule 7: 500 for Threads, 280 for X — fitur 9) and the requested
 * status count so a bad answer triggers the automatic retry inside
 * generateJSON before it ever reaches the UI.
 */
export function statusesSkema(
  batas: { min: number; max: number },
  batasKarakter: number = MAX_STATUS_LENGTH,
) {
  return z.object({
    statuses: z
      .array(
        z
          .string()
          .refine((s) => s.trim().length > 0, "ada status kosong")
          .refine(
            (s) => charLength(s) <= batasKarakter,
            `status melebihi ${batasKarakter} karakter`,
          ),
      )
      .min(batas.min, `minimal ${batas.min} status`)
      .max(batas.max, `maksimal ${batas.max} status`),
  });
}

/* --------------------------- Prompt 9: naskah video -------------------------- */

/**
 * Output prompt 09 (naskah video tiga bagian, PRD F7 dan fitur mode naskah
 * video): hook visual 3 detik pertama, fungsi produk, lalu CTA. Durasi total
 * dijaga di kode supaya jawaban yang tidak realistis langsung di-retry.
 */
const bagianNaskah = (nama: string) =>
  z
    .string()
    .min(1, `${nama} wajib diisi`)
    .refine(
      (s) => charLength(s) <= MAX_STATUS_LENGTH,
      `${nama} melebihi ${MAX_STATUS_LENGTH} karakter`,
    );

export const naskahVideoSkema = z.object({
  hook_visual: bagianNaskah("hook visual"),
  fungsi_produk: bagianNaskah("fungsi produk"),
  cta: bagianNaskah("CTA"),
  durasi_total_detik: z
    .number()
    .int("durasi harus bilangan bulat")
    .min(30, "minimal 30 detik")
    .max(60, "maksimal 60 detik"),
});

export type NaskahVideo = z.infer<typeof naskahVideoSkema>;

/* -------------------------- Prompt 8: carousel slides ------------------------- */

export function hitungKata(teks: string | null | undefined): number {
  if (!teks) return 0;
  return teks.trim().split(/\s+/).filter(Boolean).length;
}

export const BATAS_KATA_CAROUSEL = {
  kicker: 3,
  cover_headline: 8,
  isi_judul: 6,
  isi_penjelasan: 25,
  cta: 12,
} as const;

export const carouselSlideSkema = z.object({
  urutan: z.number().int().min(1),
  peran: z.enum(["cover", "isi", "cta"]),
  kicker: z.string().nullable().optional(),
  headline: z.string().nullable().optional(),
  judul: z.string().nullable().optional(),
  isi: z.string().nullable().optional(),
  visualUrl: z.string().nullable().optional(),
  visualPrompt: z.string().nullable().optional(),
});

export const carouselResponseSkema = z.object({
  slides: z
    .array(carouselSlideSkema)
    .min(3, "minimal 3 slide")
    .max(10, "maksimal 10 slide"),
  caption: z
    .string()
    .min(1, "caption wajib diisi")
    .refine((c) => charLength(c) <= 2200, "caption melebihi 2200 karakter"),
  hashtag: z.array(z.string()).max(5, "maksimal 5 hashtag").default([]),
  klaim_perlu_cek: z.array(z.string()).default([]),
});

export type CarouselSlide = z.infer<typeof carouselSlideSkema>;
export type CarouselResponse = z.infer<typeof carouselResponseSkema>;

/* ------------------- Prompt 10: riset audiens (tahap 1) ---------------------- */

/**
 * Satu masalah audiens. `situasi` dan `alasan` diberi default string kosong:
 * nilai yang hilang lebih baik ditampilkan apa adanya daripada membuang
 * seluruh 10 hasil riset yang lain.
 */
export const masalahAudiensSkema = z.object({
  masalah: z.string().min(1, "masalah tidak boleh kosong"),
  situasi: z.string().default(""),
  produk_contoh: z
    .array(z.string())
    .min(1, "setiap masalah wajib punya minimal satu contoh produk")
    .max(3, "maksimal 3 contoh produk per masalah"),
  alasan: z.string().default(""),
});

export const risetAudiensSkema = z.object({
  ringkasan: z.string().min(1, "ringkasan wajib diisi").max(4000),
  masalah: z
    .array(masalahAudiensSkema)
    .length(10, "riset audiens wajib menghasilkan tepat 10 masalah"),
});

export type MasalahAudiens = z.infer<typeof masalahAudiensSkema>;
export type RisetAudiens = z.infer<typeof risetAudiensSkema>;

/* ------------------ Prompt 11: peluang produk (tahap 2) ---------------------- */

export const PRIORITAS_PELUANG = ["tinggi", "sedang", "rendah"] as const;
export const KESULITAN_KONTEN = ["rendah", "sedang", "tinggi"] as const;

/** Skor kelayakan 1-5 per dimensi (Fase 3, task 3-A; prompt peluang v2). */
export const skorPeluangSkema = z.object({
  permintaan: z.number().int().min(1).max(5),
  kompetisi: z.number().int().min(1).max(5),
  kemudahan_konten: z.number().int().min(1).max(5),
  potensi_komisi: z.number().int().min(1).max(5),
  alasan_permintaan: z.string().max(300).default(""),
  alasan_kompetisi: z.string().max(300).default(""),
  alasan_kemudahan_konten: z.string().max(300).default(""),
  alasan_potensi_komisi: z.string().max(300).default(""),
});

export const peluangItemSkema = z.object({
  kategori: z.string().min(1, "kategori tidak boleh kosong").max(160),
  alasan: z.string().min(1).max(2000),
  masalah_terkait: z.string().default(""),
  contoh_produk: z.array(z.string()).min(1).max(3),
  prioritas: z.enum(PRIORITAS_PELUANG),
  kesulitan_konten: z.enum(KESULITAN_KONTEN),
  // Opsional supaya data lama tanpa skor tetap lolos validasi.
  skor: skorPeluangSkema.optional(),
  skor_total: z.number().int().min(0).max(20).optional(),
});

export const peluangProdukSkema = z.object({
  peluang: z
    .array(peluangItemSkema)
    .length(20, "peluang produk wajib menghasilkan tepat 20 kategori"),
});

export type PeluangItem = z.infer<typeof peluangItemSkema>;
export type PeluangProduk = z.infer<typeof peluangProdukSkema>;


/* ------------------------ Review pasar (Fase 3-C) ------------------------- */

export const reviewPasarSkema = z.object({
  klasifikasi: z
    .array(
      z.object({
        ringkas: z.string().min(1).max(200),
        jenis: z.enum(["keluhan", "pujian", "campuran"]),
        bintang: z.number().int().min(1).max(5).nullable().optional(),
      }),
    )
    .max(30),
  masalah: z.array(z.string().min(1).max(200)).max(8),
  angle: z.array(z.string().min(1).max(200)).max(6),
  kosakata: z.array(z.string().min(1).max(120)).max(10),
  red_flag: z.array(z.string().min(1).max(200)).max(5),
  kekurangan_asli: z.array(z.string().min(1).max(200)).max(5),
});

export const reviewPasarRequestSkema = z.object({
  niche: z.string().trim().min(3).max(120),
  audiens: z.string().trim().min(3).max(300),
  /** Review mentah yang ditempel user; batas longgar karena copas blok. */
  review_mentah: z.string().trim().min(30, "Tempel minimal satu review lengkap.").max(8000),
});

export type ReviewPasar = z.infer<typeof reviewPasarSkema>;

/* --------------------------- Request bodies (API) ----------------------------- */

export const risetRequestSkema = z.object({
  niche: z.string().trim().min(3, "Niche minimal 3 karakter.").max(120),
  audiens: z.string().trim().min(3, "Target audiens minimal 3 karakter.").max(200),
});

/** Body untuk menyusun ulang peluang dari riset yang sudah tersimpan. */
export const peluangRequestSkema = z.object({
  risetId: z.string().min(1, "ID riset wajib diisi.").max(64),
});

export const analisisRequestSkema = z.object({
  deskripsi: z.string().min(1, "Deskripsi wajib diisi"),
  nama: z.string().optional(),
  varian: z.string().optional(),
  harga: z.string().optional(),
  kategori: z.string().optional(),
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
  kategori: z.string().optional(),
  jumlahSlide: z.number().int().min(3).max(10).optional(),
  rasio: z.enum(["4:5", "1:1"]).optional(),
  template: z.enum(["template_1", "template_2", "template_3"]).optional(),
  fotoUrl: z.string().optional(),
});

export const carouselRequestSkema = z.object({
  namaProduk: z.string().min(1),
  ringkasan: z.string().min(1),
  fitur: z.array(z.string()).default([]),
  ide: ideItemSkema,
  pengaturan: pengaturanSkema,
  link: z.string().optional(),
  handle: z.string().optional(),
  sumber: z.string().optional(),
  jumlahSlide: z.number().int().min(3).max(10).default(5),
  rasio: z.enum(["4:5", "1:1"]).default("4:5"),
  template: z.enum(["template_1", "template_2", "template_3"]).default("template_1"),
  fotoUrl: z.string().optional(),
});

export type CarouselRequest = z.infer<typeof carouselRequestSkema>;
