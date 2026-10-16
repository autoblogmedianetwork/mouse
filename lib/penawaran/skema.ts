import { z } from "zod";

export const SUMBER_PENAWARAN = ["marketplace", "manual", "link"] as const;
export type SumberPenawaran = (typeof SUMBER_PENAWARAN)[number];

export const KATEGORI_PENAWARAN = [
  "hosting",
  "saas",
  "course",
  "marketplace",
  "other",
] as const;
export type KategoriPenawaran = (typeof KATEGORI_PENAWARAN)[number];

export const LABEL_SUMBER_PENAWARAN: Record<SumberPenawaran, string> = {
  marketplace: "Marketplace",
  manual: "Manual",
  link: "Dari link",
};

export const LABEL_KATEGORI_PENAWARAN: Record<KategoriPenawaran, string> = {
  hosting: "Hosting",
  saas: "SaaS",
  course: "Kursus",
  marketplace: "Marketplace",
  other: "Lainnya",
};

export const penawaranManualSkema = z.object({
  nama: z
    .string()
    .trim()
    .min(1, "Nama penawaran wajib diisi")
    .max(150, "Nama penawaran maksimal 150 karakter"),
  link_affiliate: z
    .string()
    .trim()
    .min(1, "Link affiliate wajib diisi")
    .refine((val) => /^https?:\/\//i.test(val), {
      message: "Link affiliate harus berupa URL valid diawali http:// atau https://",
    }),
  harga: z.string().trim().optional().default(""),
  fitur: z.string().trim().optional().default(""),
  kategori: z.enum(KATEGORI_PENAWARAN).default("hosting"),
  gambar: z.string().trim().optional().default(""),
});

export type PenawaranManualValues = z.infer<typeof penawaranManualSkema>;

export const penawaranLinkSkema = z.object({
  url_halaman: z
    .string()
    .trim()
    .min(1, "URL halaman produk/layanan wajib diisi")
    .refine((val) => /^https?:\/\//i.test(val), {
      message: "URL halaman harus diawali http:// atau https://",
    }),
  nama: z
    .string()
    .trim()
    .min(1, "Nama penawaran wajib diisi")
    .max(150, "Nama penawaran maksimal 150 karakter"),
  deskripsi: z.string().trim().optional().default(""),
  link_affiliate: z
    .string()
    .trim()
    .min(1, "Link affiliate wajib diisi")
    .refine((val) => /^https?:\/\//i.test(val), {
      message: "Link affiliate harus berupa URL valid diawali http:// atau https://",
    }),
  harga: z.string().trim().optional().default(""),
  kategori: z.enum(KATEGORI_PENAWARAN).default("other"),
  gambar: z.string().trim().optional().default(""),
});

export type PenawaranLinkValues = z.infer<typeof penawaranLinkSkema>;

export interface PenawaranData {
  id: string;
  source_type: SumberPenawaran;
  category: KategoriPenawaran;
  name: string;
  affiliate_url: string;
  price?: string;
  features?: string;
  image_url?: string;
  marketplace_data?: Record<string, unknown>;
  saved_at: string;
}
