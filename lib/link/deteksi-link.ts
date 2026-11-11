/**
 * Detektor link afiliasi (Gelombang 4, power-up Aset).
 *
 * Tempel link -> cek kesehatannya secara lokal, tanpa jaringan:
 * - https atau http
 * - marketplace mana (pakai deteksi domain yang sama dengan form produk)
 * - parameter tracking affiliate yang terbaca (sub_id, affiliate_id, dsb.)
 * - masalah yang perlu diperhatikan sebelum link dipakai di konten
 */

import { deteksiMarketplaceLink, ATURAN_MARKETPLACE, type MarketplaceProduk } from "@/lib/affiliate/rules";

export interface HasilDeteksiLink {
  ok: boolean;
  marketplace: MarketplaceProduk | null;
  labelMarketplace: string;
  /** Nama parameter tracking yang terbaca di URL, mis. ["sub_id"]. */
  tracking: string[];
  /** Peringatan singkat; kosong berarti link siap dipakai. */
  masalah: string[];
}

/** Parameter tracking affiliate yang umum dipakai marketplace Indonesia. */
const PARAM_TRACKING = [
  "sub_id",
  "subid",
  "sub_id1",
  "subid1",
  "affiliate_id",
  "aff_id",
  "af_id",
  "u",
  "userId",
  "ttclid",
  "scta",
];

export function deteksiLinkAfiliasi(url: string): HasilDeteksiLink {
  const teks = url.trim();
  if (teks === "") {
    return {
      ok: false,
      marketplace: null,
      labelMarketplace: "",
      tracking: [],
      masalah: ["Link masih kosong."],
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(teks);
  } catch {
    return {
      ok: false,
      marketplace: null,
      labelMarketplace: "",
      tracking: [],
      masalah: ["Bentuk URL tidak valid — periksa lagi link yang ditempel."],
    };
  }

  const masalah: string[] = [];
  if (parsed.protocol !== "https:") {
    masalah.push("Pakai https:// — banyak platform menandai link http sebagai tidak aman.");
  }

  const marketplace = deteksiMarketplaceLink(teks);
  const label = marketplace ? ATURAN_MARKETPLACE[marketplace].label : "";

  const tracking = [...parsed.searchParams.keys()].filter((k) =>
    PARAM_TRACKING.includes(k.toLowerCase()),
  );
  if (tracking.length === 0) {
    masalah.push(
      "Tidak ada parameter tracking terbaca (sub_id/affiliate_id). Komisi bisa tidak tercatat — cek ulang link dari dashboard affiliate.",
    );
  }

  return { ok: masalah.length === 0, marketplace, labelMarketplace: label, tracking, masalah };
}
