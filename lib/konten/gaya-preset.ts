/**
 * Preset gaya carousel per akun (tabel `carousel_gaya_preset`, migrasi 0009).
 *
 * Satu preset berisi empat field yang sama dengan panel "Gaya Slide" di editor
 * carousel (docs/fitur-carousel.md bagian 4). CRUD jalan dari peramban lewat
 * klien Supabase publik; akses dibatasi RLS `(select auth.uid()) = user_id`.
 */
import { z } from "zod";
import { klienPeramban } from "@/lib/supabase/klien";

/** Nama preset: 1–40 karakter setelah trim. */
export const namaPresetSkema = z
  .string()
  .trim()
  .min(1, "Nama preset tidak boleh kosong.")
  .max(40, "Nama preset maksimal 40 karakter.");

/** Empat field gaya hasil panel Gaya Slide. */
export const gayaPresetSkema = z.object({
  skalaFont: z.number().int().min(70).max(150),
  warnaAksen: z
    .string()
    .regex(/^$|^#[0-9a-fA-F]{6}$/, "Warna aksen harus hex #rrggbb atau kosong."),
  posisiKonten: z.enum(["atas", "tengah"]),
  ruangKeliling: z.number().int().min(90).max(140),
});

export type GayaPresetIsi = z.infer<typeof gayaPresetSkema>;

export interface GayaPreset {
  id: string;
  nama: string;
  gaya: GayaPresetIsi;
}

/** Default gaya ketika tidak ada preset diterapkan. */
export const PENGATURAN_GAYA_AWAL: GayaPresetIsi = {
  skalaFont: 100,
  warnaAksen: "",
  posisiKonten: "tengah",
  ruangKeliling: 100,
};

/** Baris mentah dari Supabase → bentuk aplikasi; field invalid jatuh ke default. */
export function barisKeGayaPreset(row: {
  id: string;
  nama: string;
  gaya: unknown;
}): GayaPreset | null {
  const parsed = gayaPresetSkema.safeParse(row.gaya);
  if (!parsed.success) return null;
  const nama = namaPresetSkema.safeParse(row.nama);
  if (!nama.success) return null;
  return { id: row.id, nama: nama.data, gaya: parsed.data };
}

/** Ambil semua preset user, urut terakhir dipakai/diubah di atas. */
export async function daftarPresetGaya(): Promise<GayaPreset[]> {
  const supabase = klienPeramban();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("carousel_gaya_preset")
    .select("id, nama, gaya")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`Gagal memuat preset gaya: ${error.message}`);
  return (data ?? [])
    .map(barisKeGayaPreset)
    .filter((p): p is GayaPreset => p !== null);
}

/** Simpan (insert atau update berdasarkan nama) satu preset. */
export async function simpanPresetGaya(nama: string, gaya: GayaPresetIsi): Promise<GayaPreset> {
  const supabase = klienPeramban();
  if (!supabase) throw new Error("Supabase belum dikonfigurasi.");

  const namaValid = namaPresetSkema.parse(nama);
  const gayaValid = gayaPresetSkema.parse(gaya);

  const { data, error } = await supabase
    .from("carousel_gaya_preset")
    .upsert({ nama: namaValid, gaya: gayaValid }, { onConflict: "user_id, nama" })
    .select("id, nama, gaya")
    .single();
  if (error) throw new Error(`Gagal menyimpan preset: ${error.message}`);

  const preset = barisKeGayaPreset(data);
  if (!preset) throw new Error("Data preset yang tersimpan tidak valid.");
  return preset;
}

/** Hapus preset berdasarkan id milik user sendiri (RLS). */
export async function hapusPresetGaya(id: string): Promise<void> {
  const supabase = klienPeramban();
  if (!supabase) throw new Error("Supabase belum dikonfigurasi.");
  const { error } = await supabase.from("carousel_gaya_preset").delete().eq("id", id);
  if (error) throw new Error(`Gagal menghapus preset: ${error.message}`);
}
