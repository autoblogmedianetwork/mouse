/**
 * Peta atribusi: sub_id pada laporan marketplace → konten yang memakainya.
 *
 * Bentuknya sejajar calon kolom `affiliate_links.sub_id` di
 * docs/skema-database.md, sehingga saat Supabase aktif tinggal memindahkan isi
 * peta ini menjadi baris tabel, bukan mendesain ulang.
 */
import { z } from "zod";

export const KUNCI_ATRIBUSI = "autothreads-atribusi";
export const VERSI_ATRIBUSI = 1;

/** Kode pelacak dinormalkan: huruf kecil, tanpa spasi di ujung. */
export function normalkanSubId(subId: string): string {
  return subId.trim().toLowerCase();
}

export const petaAtribusiSkema = z.object({
  versi: z.number().int().min(1),
  /** sub_id ternormalisasi → konten id. */
  peta: z.record(z.string(), z.string()),
});

export type PetaAtribusi = z.infer<typeof petaAtribusiSkema>;

export const PETA_ATRIBUSI_AWAL: PetaAtribusi = { versi: VERSI_ATRIBUSI, peta: {} };
