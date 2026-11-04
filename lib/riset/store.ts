/**
 * Baca/tulis artefak tahap 1-2 dari peramban (tabel `audience_riset` dan
 * `peluang_produk`, migrasi 0010).
 *
 * Penulisan hasil AI ada di route `/api/audience*` (server-side, sesi wajib).
 * Modul ini hanya untuk yang memang aman dari klien: membaca riwayat dan
 * menandai satu kategori menjadi produk. Akses tetap dibatasi RLS
 * `(select auth.uid()) = user_id`.
 */
import { klienPeramban } from "@/lib/supabase/klien";
import { barisKePeluang, barisKeRiset, type Peluang, type Riset } from "./skema";

/** Berapa riset terakhir yang ditampilkan di riwayat. */
export const BATAS_RIWAYAT_RISET = 10;

const KOLOM_RISET =
  "id, niche, audiens, ringkasan, masalah, prompt_version, model, created_at";

const KOLOM_PELUANG =
  "id, riset_id, urutan, kategori, alasan, masalah_terkait, contoh_produk, prioritas, kesulitan_konten, dipilih, produk_id";

export async function daftarRiset(): Promise<Riset[]> {
  const supabase = klienPeramban();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("audience_riset")
    .select(KOLOM_RISET)
    .order("created_at", { ascending: false })
    .limit(BATAS_RIWAYAT_RISET);
  if (error) throw new Error(`Gagal memuat riwayat riset: ${error.message}`);
  return (data ?? []).map(barisKeRiset).filter((r): r is Riset => r !== null);
}

export async function daftarPeluang(risetId: string): Promise<Peluang[]> {
  const supabase = klienPeramban();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("peluang_produk")
    .select(KOLOM_PELUANG)
    .eq("riset_id", risetId)
    .order("urutan", { ascending: true });
  if (error) throw new Error(`Gagal memuat peluang produk: ${error.message}`);
  return (data ?? []).map(barisKePeluang).filter((p): p is Peluang => p !== null);
}

export interface HasilJadikanProduk {
  produkId: string;
  /** False kalau produk dengan nama sama sudah ada dan dipakai ulang. */
  baru: boolean;
}

/**
 * Ubah satu kategori peluang menjadi baris `products` (sumber manual) dan
 * tandai peluangnya. Data harga/tautan sengaja dibiarkan kosong: itu diisi
 * user di form produk, bukan dikarang dari hasil AI.
 */
export async function jadikanProduk(
  riset: Riset,
  peluang: Peluang,
): Promise<HasilJadikanProduk> {
  const supabase = klienPeramban();
  if (!supabase) throw new Error("Supabase belum dikonfigurasi.");

  const deskripsi = [
    peluang.alasan,
    peluang.masalah_terkait ? `Masalah terkait: ${peluang.masalah_terkait}` : "",
    peluang.contoh_produk.length > 0
      ? `Contoh produk: ${peluang.contoh_produk.join(", ")}`
      : "",
    `Niche: ${riset.niche} · Audiens: ${riset.audiens}`,
  ]
    .filter((b) => b.length > 0)
    .join("\n\n");

  const { data: sudahAda, error: cariError } = await supabase
    .from("products")
    .select("id")
    .eq("nama_internal", peluang.kategori)
    .maybeSingle();
  if (cariError) throw new Error(`Gagal memeriksa produk: ${cariError.message}`);

  let produkId: string | null = (sudahAda?.id as string | undefined) ?? null;
  let baru = false;

  if (!produkId) {
    const { data, error } = await supabase
      .from("products")
      .insert({
        nama_internal: peluang.kategori,
        nama: peluang.kategori,
        kategori: peluang.kategori,
        deskripsi,
        sumber: "manual",
      })
      .select("id")
      .single();
    if (error) throw new Error(`Gagal membuat produk: ${error.message}`);
    produkId = data.id as string;
    baru = true;
  }

  const { error: updateError } = await supabase
    .from("peluang_produk")
    .update({ dipilih: true, produk_id: produkId })
    .eq("id", peluang.id);
  if (updateError) throw new Error(`Gagal menandai peluang: ${updateError.message}`);

  return { produkId, baru };
}
