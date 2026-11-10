/**
 * Aturan marketplace sisi produk & link (Fase 4-A, versi manual).
 *
 * Menepati janji Workflow bagian 6: aturan konten per marketplace disimpan di
 * sini dan diperiksa di checklist. TANPA API, TANPA scraping: marketplace
 * dideteksi dari link yang user tempel sendiri, dan aturan hanya berupa
 * instruksi tulisan untuk prompt + label di UI.
 */

export type MarketplaceProduk = "shopee" | "tokopedia" | "tiktok" | "lainnya";

export interface AturanMarketplace {
  label: string;
  /** Hashtag khas marketplace (opsional; platform tanpa hashtag mengabaikan). */
  hashtag: readonly string[];
  /** Instruksi satu-dua kalimat untuk prompt generate. */
  instruksi: string;
}

/** Pola domain per marketplace — lowercase, dicek dengan includes(). */
const POLA_DOMAIN: Array<{ marketplace: MarketplaceProduk; domain: string }> = [
  { marketplace: "shopee", domain: "shopee.co.id" },
  { marketplace: "shopee", domain: "s.shopee.co.id" },
  { marketplace: "shopee", domain: "shopee.id" },
  { marketplace: "tokopedia", domain: "tokopedia.com" },
  { marketplace: "tokopedia", domain: "vt.tokopedia.com" },
  { marketplace: "tokopedia", domain: "tokopedia.link" },
  { marketplace: "tiktok", domain: "tiktok.com" },
  { marketplace: "tiktok", domain: "vt.tiktok.com" },
];

export const ATURAN_MARKETPLACE: Record<MarketplaceProduk, AturanMarketplace> = {
  shopee: {
    label: "Shopee",
    hashtag: ["#racunshopee"],
    instruksi:
      "Penawaran dari Shopee: boleh sebut gratis ongkir atau voucher bila relevan, jangan janji harga termurah. Hashtag khas #racunshopee boleh dipakai di platform yang mendukung hashtag.",
  },
  tokopedia: {
    label: "Tokopedia",
    hashtag: ["#Tokopedia"],
    instruksi:
      "Penawaran dari Tokopedia: tekankan keamanan belanja (barang sesuai deskripsi, perlindungan pembeli). Jangan menyinggung marketplace lain.",
  },
  tiktok: {
    label: "TikTok Shop",
    hashtag: ["#TikTokShop"],
    instruksi:
      "Penawaran dari TikTok Shop: gaya santai seperti cerita di FYP, tekankan harga promo dan keranjang kuning. Jangan janji komisi atau hasil instan.",
  },
  lainnya: {
    label: "Lainnya / tidak dikenali",
    hashtag: [],
    instruksi:
      "Penawaran dari link di luar marketplace utama: fokus pada manfaat produk, jangan sebut nama marketplace mana pun.",
  },
};

/**
 * Deteksi marketplace dari link yang ditempel user. Null kalau link kosong.
 * Pencarian pakai includes supaya subdomain/shortlink tetap terdeteksi.
 */
export function deteksiMarketplaceLink(
  url: string | null | undefined,
): MarketplaceProduk | null {
  const teks = (url ?? "").toLowerCase().trim();
  if (teks === "") return null;
  for (const pola of POLA_DOMAIN) {
    if (teks.includes(pola.domain)) return pola.marketplace;
  }
  return "lainnya";
}

/** Label siap tampil di UI; null kalau link kosong. */
export function labelMarketplace(url: string | null | undefined): string | null {
  const hasil = deteksiMarketplaceLink(url);
  return hasil ? ATURAN_MARKETPLACE[hasil].label : null;
}
