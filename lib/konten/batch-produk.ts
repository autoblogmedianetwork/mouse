/**
 * Batch produk: buat 3–5 draft konten dari produk terpilih, lalu review satu
 * per satu (tidak ada posting otomatis, tidak ada AI).
 *
 * "Batch generate" di sini berarti batch pembuatan draft (antrean job), bukan
 * generate teks otomatis: setiap produk menjadi satu draft yang wajib ditinjau
 * di tab Perlu review sebelum bisa ditandai siap posting. Ini menjaga aturan
 * "tidak ada siap_posting tanpa aksi user" (AGENTS aturan 4).
 */
import { z } from "zod";
import type { Konten } from "./skema";

export const KUNCI_BATCH_PRODUK = "autothreads-batch-produk";
export const MIN_PRODUK_BATCH = 3;
export const MAKS_PRODUK_BATCH = 5;

export const statusBatchSkema = z.enum(["antri", "proses", "selesai"]);
export type StatusBatch = z.infer<typeof statusBatchSkema>;

export const batchProdukSkema = z.object({
  id: z.string().min(1),
  dibuat_pada: z.string(),
  produk_ids: z.array(z.string().min(1)).min(MIN_PRODUK_BATCH).max(MAKS_PRODUK_BATCH),
  konten_ids: z.array(z.string().min(1)),
  status: statusBatchSkema,
  indeks_review: z.number().int().min(0),
  selesai_pada: z.string().nullable().default(null),
});

export type BatchProduk = z.infer<typeof batchProdukSkema>;

/** Validasi daftar produk terpilih. Kembalikan pesan galat atau null. */
export function validasiBatch(produkIds: string[], tersedia: Set<string>): string | null {
  const bersih = produkIds.map((p) => p.trim()).filter((p) => p !== "");
  if (bersih.length < MIN_PRODUK_BATCH) {
    return `Pilih minimal ${MIN_PRODUK_BATCH} produk.`;
  }
  if (bersih.length > MAKS_PRODUK_BATCH) {
    return `Maksimal ${MAKS_PRODUK_BATCH} produk per batch.`;
  }
  if (new Set(bersih).size !== bersih.length) {
    return "Produk yang dipilih tidak boleh duplikat.";
  }
  const tidakAda = bersih.filter((id) => !tersedia.has(id));
  if (tidakAda.length > 0) {
    return "Ada produk yang tidak ditemukan di pustaka produk.";
  }
  return null;
}

/** Buat satu draft konten dari produk. Status draft, belum siap posting. */
export function buatDraftDariProduk(
  produk: { id: string; nama_internal?: string; nama?: string; varian?: string },
  batchId: string,
  dibuatPada: string,
): Konten {
  const nama = (produk.nama_internal || produk.nama || "Produk tanpa nama").trim();
  const varian = produk.varian?.trim();
  const judul = varian ? `${nama} — ${varian}` : nama;
  // Placeholder status yang valid (< 500 karakter) agar konten lolos skema;
  // pengguna wajib menggantinya di Buat posting sebelum bisa ditandai siap.
  const placeholder =
    "Draft batch: isi status di Buat posting, lalu tandai siap. Jangan kirim placeholder ini.";
  return {
    id: crypto.randomUUID(),
    judul: judul.slice(0, 120) || "Draft batch",
    produk_nama: nama,
    ide_judul: `Batch ${batchId.slice(0, 8)}`,
    statuses: [placeholder],
    status: "draft",
    letak_link: "balasan",
    gaya_hook: "bawaan",
    kerangka: "bebas",
    link_produk: "",
    arsip: false,
    arsip_at: null,
    skor: null,
    otomatis: false,
    checklist: {},
    jadwal_at: null,
    klik_manual: 0,
    komisi_manual: 0,
    created_at: dibuatPada,
    updated_at: dibuatPada,
  };
}

export function muatBatch(): BatchProduk[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KUNCI_BATCH_PRODUK);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry) => {
      const r = batchProdukSkema.safeParse(entry);
      return r.success ? [r.data] : [];
    });
  } catch {
    return [];
  }
}

export function simpanBatch(daftar: BatchProduk[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KUNCI_BATCH_PRODUK, JSON.stringify(daftar));
  } catch {
    // Abaikan kegagalan storage
  }
}

/** Buat batch baru + daftar draft konten. Validasi dilakukan oleh pemanggil. */
export function buatBatch(
  produkIds: string[],
  produkMap: Map<string, { id: string; nama_internal?: string; nama?: string; varian?: string }>,
): { batch: BatchProduk; kontenBaru: Konten[] } {
  const dibuatPada = new Date().toISOString();
  const id = crypto.randomUUID();
  const kontenBaru: Konten[] = produkIds.map((pid) => {
    const p = produkMap.get(pid) ?? { id: pid, nama: pid };
    return buatDraftDariProduk(p, id, dibuatPada);
  });
  const batch: BatchProduk = {
    id,
    dibuat_pada: dibuatPada,
    produk_ids: [...produkIds],
    konten_ids: kontenBaru.map((k) => k.id),
    status: "antri",
    indeks_review: 0,
    selesai_pada: null,
  };
  return { batch, kontenBaru };
}

/** Mulai review: antri -> proses. */
export function mulaiReview(batch: BatchProduk): BatchProduk {
  if (batch.status !== "antri") return batch;
  return { ...batch, status: "proses", indeks_review: 0 };
}

/** Tandai item saat ini sudah direview; maju ke berikutnya atau selesai. */
export function tandaiDireview(batch: BatchProduk): BatchProduk {
  if (batch.status !== "proses") return batch;
  const berikutnya = batch.indeks_review + 1;
  if (berikutnya >= batch.konten_ids.length) {
    return { ...batch, status: "selesai", indeks_review: batch.konten_ids.length, selesai_pada: new Date().toISOString() };
  }
  return { ...batch, indeks_review: berikutnya };
}

/** Batalkan batch yang belum selesai (hapus dari daftar oleh pemanggil). */
export function hapusBatch(daftar: BatchProduk[], id: string): BatchProduk[] {
  return daftar.filter((b) => b.id !== id);
}

export interface RingkasanBatch {
  total: number;
  antri: number;
  proses: number;
  selesai: number;
  rata_ukuran: number;
}

export function ringkasanBatch(daftar: BatchProduk[]): RingkasanBatch {
  const total = daftar.length;
  return {
    total,
    antri: daftar.filter((b) => b.status === "antri").length,
    proses: daftar.filter((b) => b.status === "proses").length,
    selesai: daftar.filter((b) => b.status === "selesai").length,
    rata_ukuran: total > 0 ? daftar.reduce((a, b) => a + b.konten_ids.length, 0) / total : 0,
  };
}
