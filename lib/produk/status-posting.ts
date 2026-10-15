/**
 * Status posting per produk (feedback Claude #3 — Sedang): daftar produk yang
 * lama tidak diangkat di Threads supaya user tidak harus mengingat sendiri.
 *
 * Sumber datanya pustaka konten (`lib/konten/skema`, localStorage sampai
 * Supabase aktif). "Terkirim terakhir" diambil dari konten berstatus
 * `terkirim` dengan `updated_at` terbesar — benar karena `tandaiTerkirim`
 * menaruh waktu kirim ke `updated_at` saat status berubah.
 *
 * Fungsi murni tanpa storage (pola lib/konten/kalender.ts), jadi seluruh
 * aturan bisa diuji tanpa DOM/UI. Konten arsip tetap dihitung untuk riwayat
 * kirim: K3 hanya menyembunyikan konten dari antrian, bukan menghapus sejarah.
 */
import type { Konten } from "@/lib/konten/skema";

export interface StatusPostingProduk {
  /** Nama produk dari `produk_nama` pustaka konten. */
  produk: string;
  /** Jumlah konten pustaka untuk produk ini (arsip ikut dihitung). */
  jumlahKonten: number;
  /** Berapa di antara konten itu yang sudah terkirim. */
  jumlahTerkirim: number;
  /** ISO `updated_at` konten terkirim terakhir; null bila belum pernah. */
  terakhirTerkirim: string | null;
  /** Hari (bulat) sejak terkirim terakhir; null = belum pernah terkirim. */
  usiaHari: number | null;
  /** Ringkas: tidak ada satu konten pun yang terkirim. */
  belumPernah: boolean;
}

/** Pilihan batas hari di filter UI (default: 7 = "minggu ini belum diangkat"). */
export const BATAS_HARI_OPSI = [7, 14, 30, 90] as const;

export const BATAS_HARI_AWAL: (typeof BATAS_HARI_OPSI)[number] = 7;

/**
 * Susun status per produk dari pustaka konten. Urutan hasil:
 * produk yang belum pernah terkirim paling atas, lalu usia terlama, dan
 * nama produk sebagai penguat determinasi ketika usianya sama.
 * `produk_nama` kosong diabaikan karena tidak bisa ditugaskan ke produk.
 */
export function statusPostingProduk(kontenList: Konten[], sekarang: number): StatusPostingProduk[] {
  const perProduk = new Map<string, StatusPostingProduk>();

  for (const k of kontenList) {
    const produk = k.produk_nama.trim();
    if (produk === "") continue;
    const status = perProduk.get(produk) ?? {
      produk,
      jumlahKonten: 0,
      jumlahTerkirim: 0,
      terakhirTerkirim: null,
      usiaHari: null,
      belumPernah: true,
    };
    status.jumlahKonten += 1;
    if (k.status === "terkirim") {
      status.jumlahTerkirim += 1;
      const t = Date.parse(k.updated_at);
      // updated_at rusak tidak menghapus status terkirim; hanya diabaikan
      // dari penentuan "terakhir terkirim" supaya tanggal palsu tidak muncul.
      const terakhir = status.terakhirTerkirim ? Date.parse(status.terakhirTerkirim) : NaN;
      if (Number.isFinite(t) && (!Number.isFinite(terakhir) || t > terakhir)) {
        status.terakhirTerkirim = k.updated_at;
      }
      status.belumPernah = false;
    }
    perProduk.set(produk, status);
  }

  const hasil = [...perProduk.values()].map((s) => ({
    ...s,
    usiaHari:
      s.terakhirTerkirim !== null
        ? Math.max(0, Math.floor((sekarang - Date.parse(s.terakhirTerkirim)) / 86_400_000))
        : null,
  }));

  return hasil.sort((a, b) => {
    // Belum pernah dulu (usia = tak hingga), lalu terlama, lalu nama.
    if (a.belumPernah !== b.belumPernah) return a.belumPernah ? -1 : 1;
    const usiaA = a.usiaHari ?? -1;
    const usiaB = b.usiaHari ?? -1;
    if (usiaA !== usiaB) return usiaB - usiaA;
    return a.produk.localeCompare(b.produk, "id");
  });
}

/**
 * Saring sesuai filter jarak waktu: ambil produk yang belum pernah terkirim
 * atau yang terakhir terkirimnya lebih tua dari `batasHari` (inklusif).
 */
export function filterUsiaTerakhir(
  list: StatusPostingProduk[],
  batasHari: number,
): StatusPostingProduk[] {
  return list.filter((s) => s.belumPernah || (s.usiaHari ?? -1) >= batasHari);
}
