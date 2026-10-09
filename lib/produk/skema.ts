import { z } from "zod";

/**
 * Manual product form schema.
 * Columns mirror the `products` table in supabase/migrations/0001_init.sql.
 * Form fields are strings; numeric conversion happens on save, which keeps
 * the zodResolver input/output types identical for React Hook Form.
 */

const hargaField = z
  .string()
  .refine((value) => value === "" || /^\d{1,13}$/.test(value), {
    message: "Harga harus angka rupiah tanpa titik atau koma",
  })
  .optional();

const urlReferensiField = z
  .string()
  .trim()
  .refine((value) => value === "" || /^https:\/\//i.test(value), {
    message: "Link harus diawali https://",
  })
  .optional()
  .or(z.literal(""));

export const productFormSchema = z.object({
  /** Required, used for search and display (skema-database.md). */
  nama_internal: z
    .string()
    .trim()
    .min(1, "Nama internal wajib diisi")
    .max(120, "Nama internal maksimal 120 karakter"),
  nama: z.string().trim().max(300).optional(),
  varian: z.string().trim().max(200).optional(),
  harga: hargaField,
  deskripsi: z
    .string()
    .trim()
    .min(10, "Deskripsi minimal 10 karakter")
    .max(50_000, "Deskripsi terlalu panjang"),
  url_referensi: urlReferensiField,
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
