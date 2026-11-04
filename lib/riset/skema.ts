/**
 * Bentuk data tahap 1-2 Content Machine (docs/content-machine.md).
 *
 * Dua artefak: satu riset audiens (10 masalah) dan daftar peluang produk
 * (20 kategori) yang menjadi anaknya. Baris PostgREST divalidasi di sini
 * sebelum menyentuh UI, supaya satu baris rusak tidak merusak halaman.
 */
import { z } from "zod";
import { KESULITAN_KONTEN, PRIORITAS_PELUANG } from "@/lib/ai/schemas";

/** Niche awal yang dipakai sebagai nilai default form (bisa diubah user). */
export const NICHE_AWAL = "Rumah tangga & perlengkapan dapur";
export const AUDIENS_CONTOH = "Ibu rumah tangga muda, 25-40 tahun";

export const masalahRisetSkema = z.object({
  masalah: z.string().min(1),
  situasi: z.string().default(""),
  produk_contoh: z.array(z.string()).default([]),
  alasan: z.string().default(""),
});

export type MasalahRiset = z.infer<typeof masalahRisetSkema>;

export const risetRowSkema = z.object({
  id: z.string().min(1),
  niche: z.string(),
  audiens: z.string(),
  ringkasan: z.string(),
  masalah: z.array(masalahRisetSkema).default([]),
  prompt_version: z.string().default(""),
  model: z.string().nullable().default(null),
  created_at: z.string(),
});

export type Riset = z.infer<typeof risetRowSkema>;

export const peluangRowSkema = z.object({
  id: z.string().min(1),
  riset_id: z.string().min(1),
  urutan: z.coerce.number().int().min(1),
  kategori: z.string().min(1),
  alasan: z.string().default(""),
  masalah_terkait: z.string().nullable().default(null),
  contoh_produk: z.array(z.string()).default([]),
  prioritas: z.enum(PRIORITAS_PELUANG).catch("sedang"),
  kesulitan_konten: z.enum(KESULITAN_KONTEN).catch("sedang"),
  dipilih: z.boolean().default(false),
  produk_id: z.string().nullable().default(null),
});

export type Peluang = z.infer<typeof peluangRowSkema>;

/** Baris Supabase → Riset, atau null kalau bentuknya tidak bisa dipakai. */
export function barisKeRiset(row: unknown): Riset | null {
  const hasil = risetRowSkema.safeParse(row);
  return hasil.success ? hasil.data : null;
}

/** Baris Supabase → Peluang, atau null kalau bentuknya tidak bisa dipakai. */
export function barisKePeluang(row: unknown): Peluang | null {
  const hasil = peluangRowSkema.safeParse(row);
  return hasil.success ? hasil.data : null;
}

/** Prioritas tinggi lebih dulu, lalu urutan asli dari AI. */
export const BOBOT_PRIORITAS: Record<Peluang["prioritas"], number> = {
  tinggi: 0,
  sedang: 1,
  rendah: 2,
};

export function urutkanPeluang(daftar: Peluang[]): Peluang[] {
  return [...daftar].sort(
    (a, b) => BOBOT_PRIORITAS[a.prioritas] - BOBOT_PRIORITAS[b.prioritas] || a.urutan - b.urutan,
  );
}
