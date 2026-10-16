import { z } from "zod";

/**
 * Skema data Program Link Affiliate (Tahap 4)
 * Menyimpan data program affiliate, link URL, catatan aturan (misal: larangan sebut brand),
 * serta catatan performa manual (klik & komisi).
 */
export const programAffiliateSkema = z.object({
  id: z.string().min(1),
  nama_program: z.string().trim().min(1, "Nama program wajib diisi").max(100),
  url: z
    .string()
    .trim()
    .min(1, "Link affiliate wajib diisi")
    .regex(/^https?:\/\//i, "Link harus diawali http:// atau https://"),
  catatan_aturan: z.string().trim().max(1000).default(""),
  klik: z.number().int().min(0).default(0),
  komisi: z.number().min(0).default(0),
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
});

export type ProgramAffiliate = z.infer<typeof programAffiliateSkema>;

/**
 * Temukan catatan aturan berdasarkan URL penawaran dari daftar program yang tersimpan.
 */
export function cariAturanBerdasarkanUrl(
  daftar: ProgramAffiliate[],
  url?: string,
): string | null {
  if (!url || !url.trim()) return null;
  const cleanUrl = url.trim().toLowerCase();
  const match = daftar.find((p) => {
    const pUrl = p.url.trim().toLowerCase();
    return cleanUrl.includes(pUrl) || pUrl.includes(cleanUrl);
  });
  return match?.catatan_aturan?.trim() || null;
}
