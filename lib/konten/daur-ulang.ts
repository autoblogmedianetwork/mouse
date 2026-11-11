/**
 * Daur ulang konten (power-up Antrian/Konten).
 *
 * Beda dengan "Duplikat": duplikat menyalin konten persis; daur ulang
 * menyiapkan draft wizard baru dari produk yang sama dengan konten lama
 * sebagai REFERENSI — user/AI menulis angle baru, bukan salinan.
 */

import type { Konten } from "./skema";

/** Bentuk draft yang dibaca AlurBuatPosting dari localStorage (DRAFT_KEY). */
export interface DraftDaurUlang {
  produk: unknown | null;
  analisis: null;
  analisisManual: string;
  ideList: unknown[];
  ideDipilih: string[];
  pengaturan: Record<string, unknown>;
  konten: unknown[];
  kontenAktif: number;
  checklist: Record<string, boolean>;
  status: "draft";
  updatedAt: string;
}

const PENGATURAN_KOSONG = {
  gaya_hook: "bawaan",
  letak_link: "status_terakhir",
  jumlah_status: 5,
  mode_output: "threads",
  gaya_bahasa: "santai",
  kerangka: "masalah_solusi",
  jumlah_variasi: 1,
};

/**
 * Cocokkan konten lama dengan produk tersimpan: nama dulu, lalu link.
 * Null kalau produk sudah tidak ada di daftar.
 */
export function cariProdukUntukDaurUlang(
  konten: Konten,
  produkList: Array<Record<string, unknown>>,
): Record<string, unknown> | null {
  const nama = (konten.produk_nama ?? "").trim().toLowerCase();
  const link = (konten.link_produk ?? "").trim().toLowerCase();
  if (nama === "" && link === "") return null;
  return (
    produkList.find((p) => {
      const namaInternal = String(p.nama_internal ?? "").trim().toLowerCase();
      const namaProduk = String(p.nama ?? "").trim().toLowerCase();
      const url = String(p.url_referensi ?? "").trim().toLowerCase();
      return (nama !== "" && (namaInternal === nama || namaProduk === nama)) ||
        (link !== "" && url !== "" && url === link);
    }) ?? null
  );
}

/**
 * Susun draft daur ulang. Konten lama masuk ke analisisManual sebagai
 * referensi dengan perintah eksplisit menulis angle baru.
 */
export function siapkanDraftDaurUlang(
  konten: Konten,
  produkList: Array<Record<string, unknown>>,
): DraftDaurUlang {
  const produk = cariProdukUntukDaurUlang(konten, produkList);
  const referensi = konten.statuses.join("\n\n---\n\n");
  return {
    produk,
    analisis: null,
    analisisManual:
      `DAUR ULANG dari konten lama "${konten.judul}". Tulis angle BARU yang berbeda ` +
      `dari versi lama (jangan salin mentah). Konten lama sebagai referensi:\n\n${referensi}`,
    ideList: [],
    ideDipilih: [],
    pengaturan: PENGATURAN_KOSONG,
    konten: [],
    kontenAktif: 0,
    checklist: {},
    status: "draft",
    updatedAt: new Date().toISOString(),
  };
}
