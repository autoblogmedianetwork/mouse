/**
 * Riwayat pencarian riset audiens (localStorage): niche + audiens yang pernah
 * dicoba disimpan supaya bisa dipilih ulang tanpa mengetik. Tanpa server.
 */
import { bacaDaftar, tulisJson } from "@/lib/storage/kotak";

export const KEY_RIWAYAT_RISET = "autothreads-riwayat-riset";
export const MAKS_RIWAYAT = 8;

export interface RiwayatRiset {
  niche: string;
  audiens: string;
  /** ISO timestamp pemakaian terakhir. */
  dipakai: string;
}

function kunci(entri: Pick<RiwayatRiset, "niche" | "audiens">): string {
  return `${entri.niche.trim().toLowerCase()}|${entri.audiens.trim().toLowerCase()}`;
}

/**
 * Tambah entri ke depan, buang duplikat (niche+audiens sama), potong ke
 * MAKS_RIWAYAT. Fungsi murni: pemanggil yang menyimpan.
 */
export function tambahRiwayat(
  list: readonly RiwayatRiset[],
  entri: Pick<RiwayatRiset, "niche" | "audiens">,
  dipakai = new Date().toISOString(),
): RiwayatRiset[] {
  const niche = entri.niche.trim();
  const audiens = entri.audiens.trim();
  if (niche === "" || audiens === "") return [...list];
  const baru: RiwayatRiset = { niche, audiens, dipakai };
  const kunciBaru = kunci(baru);
  return [baru, ...list.filter((item) => kunci(item) !== kunciBaru)].slice(0, MAKS_RIWAYAT);
}

export function muatRiwayat(): RiwayatRiset[] {
  return bacaDaftar<RiwayatRiset>(KEY_RIWAYAT_RISET, (entry) => {
    const item = entry as Partial<RiwayatRiset>;
    if (typeof item.niche !== "string" || typeof item.audiens !== "string") return null;
    return {
      niche: item.niche,
      audiens: item.audiens,
      dipakai: typeof item.dipakai === "string" ? item.dipakai : "",
    };
  });
}

export function simpanRiwayat(list: readonly RiwayatRiset[]): void {
  tulisJson(KEY_RIWAYAT_RISET, list);
}
